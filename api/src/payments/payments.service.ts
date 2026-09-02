import { Injectable, Optional } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { Payment } from './payment.js';
import { validatePayment } from './payment.js';
import { payments } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

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
  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

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
}