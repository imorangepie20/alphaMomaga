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