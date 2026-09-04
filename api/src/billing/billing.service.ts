import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service.js';
import { ContractsService } from '../contracts/contracts.service.js';
import type { Contract } from '../contracts/contract.js';
import { DatabaseService } from '../database/database.service.js';
import { monthlyCharges, paymentAllocations, paymentReceipts } from '../database/schema.js';
import { billingMonthBounds, calculateDueDate, type MonthlyCharge, type PaymentReceipt, type PaymentReceiptInput } from './billing.js';

function parseWon(value: string): number {
  const digits = value.replaceAll(/[^0-9]/g, '');
  const amountWon = Number.parseInt(digits, 10);
  if (!Number.isSafeInteger(amountWon) || amountWon <= 0) {
    throw new Error(`Invalid won amount: ${value}`);
  }
  return amountWon;
}

function isEligibleForBillingMonth(contract: Contract, billingMonth: string): boolean {
  if (contract.status !== 'Active' || !contract.billingEnabled) return false;
  const { startDate, endDate } = billingMonthBounds(billingMonth);
  return contract.startDate <= endDate && contract.endDate >= startDate;
}

@Injectable()
export class BillingService {
  private readonly charges: MonthlyCharge[] = [];
  private readonly receipts: PaymentReceipt[] = [];

  constructor(
    @Optional() private readonly contractsService?: ContractsService,
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async generateMonth(billingMonth: string, referenceDate = new Date()): Promise<MonthlyCharge[]> {
    if (!this.contractsService) {
      throw new Error('BillingService requires ContractsService');
    }

    const contracts = await this.contractsService.findAll(referenceDate);
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const generated: MonthlyCharge[] = [];
        for (const contract of contracts) {
          if (!isEligibleForBillingMonth(contract, billingMonth)) continue;

          const baseRentWon = parseWon(contract.monthlyRent);
          const [row] = await transaction
            .insert(monthlyCharges)
            .values({
              id: `charge-${randomUUID()}`,
              propertyId: contract.propertyId,
              tenantId: contract.tenantId,
              contractId: contract.id,
              billingMonth,
              dueDate: calculateDueDate(billingMonth, contract.dueDay),
              baseRentWon,
              adjustmentWon: 0,
              billedWon: baseRentWon,
              receivedWon: 0,
              outstandingWon: baseRentWon,
              status: 'Draft',
            })
            .onConflictDoNothing()
            .returning();
          if (!row) continue;

          await this.auditService?.record(transaction, {
            action: 'charge.generated',
            actorSubject: 'system',
            actorRole: 'system',
            entityType: 'monthly_charge',
            entityId: row.id,
            metadata: { billingMonth, contractId: contract.id },
          });
          generated.push({
            id: row.id,
            propertyId: row.propertyId,
            tenantId: row.tenantId,
            contractId: row.contractId,
            billingMonth: row.billingMonth,
            dueDate: row.dueDate,
            baseRentWon: row.baseRentWon,
            adjustmentWon: row.adjustmentWon,
            billedWon: row.billedWon,
            receivedWon: row.receivedWon,
            outstandingWon: row.outstandingWon,
            status: row.status,
          });
        }
        return generated;
      });
    }

    const generated: MonthlyCharge[] = [];
    for (const contract of contracts) {
      if (!isEligibleForBillingMonth(contract, billingMonth)) continue;
      if (this.charges.some((charge) => charge.contractId === contract.id && charge.billingMonth === billingMonth)) continue;

      const baseRentWon = parseWon(contract.monthlyRent);
      const charge: MonthlyCharge = {
        id: `charge-${contract.id}-${billingMonth}`,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        contractId: contract.id,
        billingMonth,
        dueDate: calculateDueDate(billingMonth, contract.dueDay),
        baseRentWon,
        adjustmentWon: 0,
        billedWon: baseRentWon,
        receivedWon: 0,
        outstandingWon: baseRentWon,
        status: 'Draft',
      };
      this.charges.push(charge);
      generated.push(charge);
    }
    return generated;
  }

  async approveCharge(id: string, actorSubject = 'system'): Promise<MonthlyCharge> {
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction
          .update(monthlyCharges)
          .set({ status: 'Approved', approvedAt: new Date(), approvedBy: actorSubject, updatedAt: new Date() })
          .where(and(eq(monthlyCharges.id, id), eq(monthlyCharges.status, 'Draft')))
          .returning();
        if (!row) {
          throw new Error(`Monthly charge ${id} must be Draft to approve`);
        }
        await this.auditService?.record(transaction, {
          action: 'charge.approved',
          actorSubject,
          actorRole: 'system',
          entityType: 'monthly_charge',
          entityId: row.id,
          metadata: { billingMonth: row.billingMonth },
        });
        return {
          id: row.id,
          propertyId: row.propertyId,
          tenantId: row.tenantId,
          contractId: row.contractId,
          billingMonth: row.billingMonth,
          dueDate: row.dueDate,
          baseRentWon: row.baseRentWon,
          adjustmentWon: row.adjustmentWon,
          billedWon: row.billedWon,
          receivedWon: row.receivedWon,
          outstandingWon: row.outstandingWon,
          status: row.status,
        };
      });
    }

    const charge = this.charges.find((item) => item.id === id);
    if (!charge) {
      throw new Error(`Monthly charge ${id} not found`);
    }
    if (charge.status !== 'Draft') {
      throw new Error(`Monthly charge ${id} must be Draft to approve`);
    }
    charge.status = 'Approved';
    return charge;
  }

  async findCharge(id: string): Promise<MonthlyCharge> {
    const charge = this.charges.find((item) => item.id === id);
    if (!charge) {
      throw new Error(`Monthly charge ${id} not found`);
    }
    return charge;
  }

  async recordReceipt(input: PaymentReceiptInput, recordedBy = 'system'): Promise<PaymentReceipt> {
    if (!Number.isSafeInteger(input.amountWon) || input.amountWon <= 0) {
      throw new Error('Receipt amountWon must be a positive won amount');
    }
    if (input.allocations.length === 0) {
      throw new Error('Receipt requires at least one allocation');
    }
    const allocationTotal = input.allocations.reduce((total, allocation) => total + allocation.amountWon, 0);
    if (allocationTotal !== input.amountWon || input.allocations.some((allocation) => !Number.isSafeInteger(allocation.amountWon) || allocation.amountWon <= 0)) {
      throw new Error('Receipt allocations must equal the receipt amount');
    }

    const allocationByChargeId = new Map<string, number>();
    for (const allocation of input.allocations) {
      allocationByChargeId.set(
        allocation.chargeId,
        (allocationByChargeId.get(allocation.chargeId) ?? 0) + allocation.amountWon,
      );
    }

    const allocationsByCharge = [...allocationByChargeId].map(([chargeId, amountWon]) => ({
      chargeId,
      amountWon,
    }));

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const databaseCharges = await transaction
          .select()
          .from(monthlyCharges)
          .where(inArray(monthlyCharges.id, allocationsByCharge.map((allocation) => allocation.chargeId)))
          .for('update');
        const chargesById = new Map(databaseCharges.map((charge) => [charge.id, charge]));

        for (const allocation of allocationsByCharge) {
          const charge = chargesById.get(allocation.chargeId);
          if (!charge) throw new Error(`Monthly charge ${allocation.chargeId} not found`);
          if (charge.propertyId !== input.propertyId || charge.tenantId !== input.tenantId) {
            throw new Error('Receipt allocation must match the charge property and tenant');
          }
          if (charge.status !== 'Approved' && charge.status !== 'PartiallyPaid') {
            throw new Error(`Monthly charge ${charge.id} is not ready for receipt allocation`);
          }
          if (allocation.amountWon > charge.outstandingWon) {
            throw new Error(`Receipt allocation exceeds outstanding amount for ${charge.id}`);
          }
        }

        const [receipt] = await transaction
          .insert(paymentReceipts)
          .values({
            id: `receipt-${randomUUID()}`,
            propertyId: input.propertyId,
            tenantId: input.tenantId,
            receivedDate: input.receivedDate,
            amountWon: input.amountWon,
            method: input.method,
            reference: input.reference,
            memo: input.memo,
            recordedBy,
          })
          .returning();
        if (!receipt) throw new Error('Unable to create payment receipt');

        await transaction.insert(paymentAllocations).values(input.allocations.map((allocation) => ({
          id: `allocation-${randomUUID()}`,
          receiptId: receipt.id,
          chargeId: allocation.chargeId,
          amountWon: allocation.amountWon,
        })));

        for (const allocation of allocationsByCharge) {
          const charge = chargesById.get(allocation.chargeId)!;
          const receivedWon = charge.receivedWon + allocation.amountWon;
          const outstandingWon = charge.billedWon - receivedWon;
          await transaction
            .update(monthlyCharges)
            .set({
              receivedWon,
              outstandingWon,
              status: outstandingWon === 0 ? 'Paid' : 'PartiallyPaid',
              updatedAt: new Date(),
            })
            .where(eq(monthlyCharges.id, charge.id));
        }

        await this.auditService?.record(transaction, {
          action: 'receipt.recorded',
          actorSubject: recordedBy,
          actorRole: 'system',
          entityType: 'payment_receipt',
          entityId: receipt.id,
          metadata: { propertyId: input.propertyId, tenantId: input.tenantId, amountWon: input.amountWon },
        });

        return { id: receipt.id, ...input };
      });
    }

    const charges = allocationsByCharge.map((allocation) => ({
      ...allocation,
      charge: this.charges.find((item) => item.id === allocation.chargeId),
    }));
    for (const { chargeId, amountWon, charge } of charges) {
      if (!charge) throw new Error(`Monthly charge ${chargeId} not found`);
      if (charge.propertyId !== input.propertyId || charge.tenantId !== input.tenantId) {
        throw new Error('Receipt allocation must match the charge property and tenant');
      }
      if (charge.status !== 'Approved' && charge.status !== 'PartiallyPaid') {
        throw new Error(`Monthly charge ${charge.id} is not ready for receipt allocation`);
      }
      if (amountWon > charge.outstandingWon) {
        throw new Error(`Receipt allocation exceeds outstanding amount for ${charge.id}`);
      }
    }

    const receipt: PaymentReceipt = { id: `receipt-${randomUUID()}`, ...input };
    for (const { amountWon, charge } of charges) {
      charge!.receivedWon += amountWon;
      charge!.outstandingWon = charge!.billedWon - charge!.receivedWon;
      charge!.status = charge!.outstandingWon === 0 ? 'Paid' : 'PartiallyPaid';
    }
    this.receipts.push(receipt);
    return receipt;
  }

  async voidReceipt(id: string, reason: string, voidedBy = 'system'): Promise<void> {
    if (!reason.trim()) throw new Error('Receipt void requires a reason');
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        const [receipt] = await transaction
          .select()
          .from(paymentReceipts)
          .where(eq(paymentReceipts.id, id))
          .for('update');
        if (!receipt) throw new Error(`Payment receipt ${id} not found`);
        if (receipt.voidedAt) throw new Error(`Payment receipt ${id} is already voided`);

        const allocations = await transaction
          .select()
          .from(paymentAllocations)
          .where(eq(paymentAllocations.receiptId, id))
          .for('update');
        const allocationByChargeId = new Map<string, number>();
        for (const allocation of allocations) {
          allocationByChargeId.set(
            allocation.chargeId,
            (allocationByChargeId.get(allocation.chargeId) ?? 0) + allocation.amountWon,
          );
        }

        const charges = await transaction
          .select()
          .from(monthlyCharges)
          .where(inArray(monthlyCharges.id, [...allocationByChargeId.keys()]))
          .for('update');
        const chargesById = new Map(charges.map((charge) => [charge.id, charge]));
        if (chargesById.size !== allocationByChargeId.size) {
          throw new Error(`Payment receipt ${id} has an invalid allocation`);
        }

        await transaction
          .update(paymentReceipts)
          .set({ voidedAt: new Date(), voidedBy, voidReason: reason.trim() })
          .where(eq(paymentReceipts.id, id));

        for (const [chargeId, amountWon] of allocationByChargeId) {
          const charge = chargesById.get(chargeId)!;
          const receivedWon = charge.receivedWon - amountWon;
          if (receivedWon < 0) {
            throw new Error(`Payment receipt ${id} cannot restore a negative charge balance`);
          }
          const outstandingWon = charge.billedWon - receivedWon;
          await transaction
            .update(monthlyCharges)
            .set({
              receivedWon,
              outstandingWon,
              status: receivedWon === 0 ? 'Approved' : outstandingWon === 0 ? 'Paid' : 'PartiallyPaid',
              updatedAt: new Date(),
            })
            .where(eq(monthlyCharges.id, chargeId));
        }

        await this.auditService?.record(transaction, {
          action: 'receipt.voided',
          actorSubject: voidedBy,
          actorRole: 'system',
          entityType: 'payment_receipt',
          entityId: id,
          metadata: { reason: reason.trim() },
        });
      });
      return;
    }

    const receipt = this.receipts.find((item) => item.id === id);
    if (!receipt) throw new Error(`Payment receipt ${id} not found`);
    if (receipt.voidedAt) throw new Error(`Payment receipt ${id} is already voided`);
    receipt.voidedAt = new Date().toISOString();
    receipt.voidReason = reason.trim();

    for (const allocation of receipt.allocations) {
      const charge = await this.findCharge(allocation.chargeId);
      const receivedWon = this.receipts
        .filter((item) => !item.voidedAt)
        .flatMap((item) => item.allocations)
        .filter((item) => item.chargeId === charge.id)
        .reduce((total, item) => total + item.amountWon, 0);
      charge.receivedWon = receivedWon;
      charge.outstandingWon = charge.billedWon - receivedWon;
      charge.status = receivedWon === 0 ? 'Approved' : charge.outstandingWon === 0 ? 'Paid' : 'PartiallyPaid';
    }
  }
}
