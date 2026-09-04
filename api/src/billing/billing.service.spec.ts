import { calculateDueDate, getBillingMonth } from './billing.js';
import { BillingService } from './billing.service.js';
import { ContractsService } from '../contracts/contracts.service.js';

describe('billing calendar rules', () => {
  it('uses the last calendar day when the due day exceeds month length', () => {
    expect(calculateDueDate('2028-02', 31)).toBe('2028-02-29');
    expect(calculateDueDate('2027-02', 31)).toBe('2027-02-28');
  });

  it('derives a billing month from the Seoul calendar date', () => {
    expect(getBillingMonth(new Date('2026-09-04T00:00:00.000Z'))).toBe('2026-09');
  });
});

describe('BillingService.generateMonth', () => {
  it('generates one draft per eligible active contract and remains idempotent', async () => {
    const service = new BillingService(new ContractsService());
    const referenceDate = new Date('2026-09-04T00:00:00.000Z');

    const generated = await service.generateMonth('2026-09', referenceDate);
    const repeated = await service.generateMonth('2026-09', referenceDate);

    expect(generated).toHaveLength(4);
    expect(generated[0]).toMatchObject({
      billingMonth: '2026-09',
      dueDate: '2026-09-05',
      baseRentWon: 1200000,
      billedWon: 1200000,
      receivedWon: 0,
      outstandingWon: 1200000,
      status: 'Draft',
    });
    expect(repeated).toEqual([]);
  });
});
