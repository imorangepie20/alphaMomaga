import type { Payment } from './payment.js';
import { validatePayment } from './payment.js';
import { mapPaymentRow, PaymentsService } from './payments.service.js';

const referenceDate = new Date('2026-09-02T12:00:00.000Z');
const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'payment-test', propertyId: 'property-1', contractId: 'contract-1', amount: '₩1,000,000',
  dueDate: '2026-09-10', status: 'Pending', ...overrides,
});

describe('PaymentsService', () => {
  it('returns validated payment records', async () => {
    expect(await new PaymentsService().findAll()).toHaveLength(4);
  });

  it('maps database amounts and omits a null paid date', () => {
    const mapped = mapPaymentRow({
      id: 'payment-db', propertyId: 'property-1', contractId: 'contract-1', amountWon: 1200000,
      dueDate: '2026-09-10', status: 'Pending', paidAt: null, createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(mapped).toEqual(expect.objectContaining({ amount: '₩1,200,000', dueDate: '2026-09-10' }));
    expect(mapped).not.toHaveProperty('paidAt');
  });
});

describe('validatePayment', () => {
  it('accepts paid, pending, overdue, and cancelled states', () => {
    expect(() => validatePayment(payment({ status: 'Paid', dueDate: '2026-08-31', paidAt: '2026-08-29' }), referenceDate)).not.toThrow();
    expect(() => validatePayment(payment(), referenceDate)).not.toThrow();
    expect(() => validatePayment(payment({ status: 'Overdue', dueDate: '2026-08-05' }), referenceDate)).not.toThrow();
    expect(() => validatePayment(payment({ status: 'Cancelled' }), referenceDate)).not.toThrow();
  });

  it.each([
    [{ dueDate: '2026-02-30' }],
    [{ status: 'Paid', dueDate: '2026-08-31' }],
    [{ status: 'Pending', dueDate: '2026-08-01' }],
    [{ status: 'Overdue', dueDate: '2026-09-10' }],
    [{ amount: '1000000' }],
  ])('rejects invalid payment data: %s', (overrides) => {
    expect(() => validatePayment(payment(overrides), referenceDate)).toThrow();
  });
});

describe('PaymentsService.update', () => {
  it('updates a payment status and paid date', async () => {
    const service = new PaymentsService();

    const updated = await service.update('payment-3', {
      status: 'Paid',
      paidAt: '2026-09-02',
    });

    expect(updated).toMatchObject({
      id: 'payment-3',
      status: 'Paid',
      paidAt: '2026-09-02',
    });
  });

  it('does not mutate a payment when the proposed state is invalid', async () => {
    const service = new PaymentsService();

    await expect(service.update('payment-3', { status: 'Overdue' })).rejects.toThrow();
    const payments = await service.findAll();

    expect(payments.find((item) => item.id === 'payment-3')).toMatchObject({
      status: 'Pending',
    });
  });

  it('throws when no fields are provided', async () => {
    const service = new PaymentsService();

    await expect(service.update('payment-3', {})).rejects.toThrow('At least one field is required');
  });

  it('throws when the payment does not exist', async () => {
    const service = new PaymentsService();

    await expect(service.update('non-existent-id', { status: 'Paid' })).rejects.toThrow('not found');
  });
});