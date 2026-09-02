export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';

export type Payment = {
  id: string;
  propertyId: string;
  contractId: string;
  amount: string;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
};

export type CreatePaymentInput = {
  propertyId: string;
  contractId: string;
  amount: string;
  dueDate: string;
  status: PaymentStatus;
};

export type UpdatePaymentInput = {
  status?: PaymentStatus;
  paidAt?: string;
};

export function validatePayment(payment: Payment, referenceDate = new Date()): void {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dueDate = new Date(`${payment.dueDate}T00:00:00.000Z`);
  const today = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  const dueDateIsValid = datePattern.test(payment.dueDate)
    && !Number.isNaN(dueDate.getTime())
    && dueDate.toISOString().slice(0, 10) === payment.dueDate;

  if (!dueDateIsValid) throw new Error(`Payment ${payment.id} must use a valid ISO due date`);
  if (!/^₩[\d,]+$/.test(payment.amount)) throw new Error(`Payment ${payment.id} must have a valid amount`);
  if (payment.status === 'Paid' && !payment.paidAt) throw new Error(`Payment ${payment.id} requires a paid date`);
  if (payment.status === 'Pending' && dueDate < today) throw new Error(`Payment ${payment.id} cannot be pending after its due date`);
  if (payment.status === 'Overdue' && dueDate >= today) throw new Error(`Payment ${payment.id} cannot be overdue before its due date`);
}