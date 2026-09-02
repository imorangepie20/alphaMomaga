import { Injectable, Optional } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Payment, CreatePaymentInput, UpdatePaymentInput } from './payment.js';
import { validatePayment } from './payment.js';
import { payments, contracts } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';

type PaymentRow = typeof payments.$inferSelect;

export function mapPaymentRow(row: PaymentRow): Payment {
  const payment: Payment = {
    id: row.id,
    propertyId: row.propertyId,
    contractId: row.contractId,
    amount: `₩${row.amountWon.toLocaleString('en-US')}`,
    dueDate: row.dueDate,
    status: row.status,
  };
  if (row.paidAt) payment.paidAt = row.paidAt;
  return payment;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  private readonly payments: Payment[] = [
    { id: 'payment-1', propertyId: 'property-1', contractId: 'contract-1', amount: '₩12,400,000', dueDate: '2026-08-31', status: 'Paid', paidAt: '2026-08-29' },
    { id: 'payment-2', propertyId: 'property-2', contractId: 'contract-2', amount: '₩9,800,000', dueDate: '2026-08-05', status: 'Overdue' },
    { id: 'payment-3', propertyId: 'property-3', contractId: 'contract-3', amount: '₩8,200,000', dueDate: '2026-09-10', status: 'Pending' },
    { id: 'payment-4', propertyId: 'property-4', contractId: 'contract-4', amount: '₩15,300,000', dueDate: '2026-09-11', status: 'Paid', paidAt: '2026-09-01' },
  ];

  async findAll(): Promise<Payment[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(payments).orderBy(asc(payments.id))).map(mapPaymentRow)
      : this.payments;
    records.forEach((payment) => validatePayment(payment));
    return records;
  }

  async create(input: CreatePaymentInput, principal?: AuthenticatedPrincipal): Promise<Payment> {
    if (!input.propertyId || !input.contractId || !input.amount || !input.dueDate || !input.status) {
      throw new Error('Payment requires propertyId, contractId, amount, dueDate, and status');
    }

    const amountWon = this.parseAmount(input.amount);
    const payment: Payment = {
      id: `payment-temp`,
      ...input,
      amount: `₩${amountWon.toLocaleString('en-US')}`,
    };
    validatePayment(payment);

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        // 외래키 검증: contractId 존재 확인
        const [contractExists] = await transaction.select().from(contracts).where(eq(contracts.id, input.contractId)).limit(1);
        if (!contractExists) {
          throw new Error(`Contract ${input.contractId}을(를) 찾을 수 없습니다`);
        }

        const [row] = await transaction.insert(payments).values({
          id: `payment-${randomUUID()}`,
          propertyId: input.propertyId,
          contractId: input.contractId,
          amountWon,
          dueDate: input.dueDate,
          status: input.status,
        }).returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'payment.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'payment',
            entityId: row.id,
            metadata: { propertyId: input.propertyId, contractId: input.contractId, amount: amountWon },
          });
        }

        return mapPaymentRow(row);
      });
    }

    // 인-메모리 검증 (fixtures 데이터에 hardcoded)
    const fixtureContracts = [
      { id: 'contract-1' }, { id: 'contract-2' }, { id: 'contract-3' }, { id: 'contract-4' },
    ];

    if (!fixtureContracts.find((c) => c.id === input.contractId)) {
      throw new Error(`Contract ${input.contractId}을(를) 찾을 수 없습니다`);
    }

    const payment2: Payment = {
      id: `payment-${this.payments.length + 1}`,
      ...input,
      amount: `₩${amountWon.toLocaleString('en-US')}`,
    };
    this.payments.push(payment2);
    return payment2;
  }

  async update(id: string, input: UpdatePaymentInput, principal?: AuthenticatedPrincipal): Promise<Payment> {
    if (Object.keys(input).length === 0) {
      throw new Error('At least one field is required to update');
    }

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction
          .update(payments)
          .set({
            ...(input.status !== undefined && { status: input.status }),
            ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
          })
          .where(eq(payments.id, id))
          .returning();

        if (!row) {
          throw new Error(`Payment ${id} not found`);
        }

        const payment = mapPaymentRow(row);
        validatePayment(payment);

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'payment.updated',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'payment',
            entityId: id,
            metadata: { changes: input },
          });
        }

        return payment;
      });
    }

    const payment = this.payments.find((p) => p.id === id);
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }

    const updated: Payment = {
      ...payment,
      ...(input.status !== undefined && { status: input.status }),
      ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
    };
    validatePayment(updated);

    this.payments[this.payments.indexOf(payment)] = updated;
    return updated;
  }

  private parseAmount(amount: string): number {
    if (!/^₩[\d,]+$/.test(amount)) {
      throw new Error('Payment amount must be a positive won amount such as ₩12,400,000');
    }

    const amountWon = Number.parseInt(amount.replaceAll(',', '').slice(1), 10);
    if (!Number.isSafeInteger(amountWon) || amountWon <= 0) {
      throw new Error('Payment amount must be a positive won amount');
    }
    return amountWon;
  }
}