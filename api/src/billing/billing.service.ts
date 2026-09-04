import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';
import { ContractsService } from '../contracts/contracts.service.js';
import type { Contract } from '../contracts/contract.js';
import { DatabaseService } from '../database/database.service.js';
import { monthlyCharges } from '../database/schema.js';
import { billingMonthBounds, calculateDueDate, type MonthlyCharge } from './billing.js';

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
}
