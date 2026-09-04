import { calculateDueDate, getBillingMonth } from './billing.js';
import { BillingService } from './billing.service.js';
import { ContractsService } from '../contracts/contracts.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../database/database.service.js';
import { vi } from 'vitest';

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

  it('writes only newly generated drafts and their audit events in one database transaction', async () => {
    const contract = {
      id: 'contract-1',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      unit: 'A-101',
      monthlyRent: '₩1,200,000',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      billingDay: 1,
      dueDay: 5,
      billingEnabled: true,
      status: 'Active' as const,
    };
    const returning = vi.fn().mockResolvedValue([{ ...contract, billingMonth: '2026-09', dueDate: '2026-09-05', baseRentWon: 1200000, adjustmentWon: 0, billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: 'Draft', approvedAt: null, approvedBy: null, cancelledAt: null, cancelledBy: null, cancellationReason: null, createdAt: new Date(), updatedAt: new Date() }]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const transaction = { insert: vi.fn(() => ({ values })) };
    const database = { client: { transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } } as unknown as DatabaseService;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const contracts = { findAll: vi.fn().mockResolvedValue([contract]) } as unknown as ContractsService;
    const service = new BillingService(contracts, database, audit);

    const generated = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));

    expect(generated).toHaveLength(1);
    expect(onConflictDoNothing).toHaveBeenCalledOnce();
    expect(audit.record).toHaveBeenCalledWith(transaction, expect.objectContaining({ action: 'charge.generated', entityId: 'contract-1' }));
  });
});
