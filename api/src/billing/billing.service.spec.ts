import { calculateDueDate, deriveChargeStatus, getBillingMonth } from './billing.js';
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

  it('derives overdue only from the server reference date after unpaid and cancelled rules', () => {
    const charge = { id: 'charge-1', propertyId: 'property-1', tenantId: 'tenant-1', contractId: 'contract-1', billingMonth: '2026-09', dueDate: '2026-09-05', baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 0, outstandingWon: 100, status: 'Approved' as const };
    expect(deriveChargeStatus(charge, new Date('2026-09-05T00:00:00.000Z'))).toBe('Approved');
    expect(deriveChargeStatus(charge, new Date('2026-09-06T00:00:00.000Z'))).toBe('Overdue');
    expect(deriveChargeStatus({ ...charge, receivedWon: 100, outstandingWon: 0 }, new Date('2026-09-06T00:00:00.000Z'))).toBe('Paid');
    expect(deriveChargeStatus({ ...charge, status: 'Draft' }, new Date('2026-09-06T00:00:00.000Z'))).toBe('Draft');
    expect(deriveChargeStatus({ ...charge, status: 'Cancelled' }, new Date('2026-09-06T00:00:00.000Z'))).toBe('Cancelled');
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

describe('BillingService.approveCharge', () => {
  it('changes a draft charge to approved before receipt allocation', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth(
      '2026-09',
      new Date('2026-09-04T00:00:00.000Z'),
    );

    const approved = await service.approveCharge(draft.id);

    expect(approved).toMatchObject({ id: draft.id, status: 'Approved' });
  });

  it('persists approval and records an audit event in a database transaction', async () => {
    const returning = vi.fn().mockResolvedValue([{
      id: 'charge-1', propertyId: 'property-1', tenantId: 'tenant-1', contractId: 'contract-1', billingMonth: '2026-09', dueDate: '2026-09-05', baseRentWon: 1200000, adjustmentWon: 0, billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: 'Approved', approvedAt: new Date(), approvedBy: 'manager-1', cancelledAt: null, cancelledBy: null, cancellationReason: null, createdAt: new Date(), updatedAt: new Date(),
    }]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const transaction = { update: vi.fn(() => ({ set })) };
    const database = { client: { transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } } as unknown as DatabaseService;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BillingService(undefined, database, audit);

    const approved = await service.approveCharge('charge-1', 'manager-1');

    expect(approved.status).toBe('Approved');
    expect(audit.record).toHaveBeenCalledWith(transaction, expect.objectContaining({ action: 'charge.approved', entityId: 'charge-1' }));
  });
});

describe('BillingService.cancelCharge', () => {
  it('cancels an unallocated approved charge and prevents later receipt allocation', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(draft.id);

    const cancelled = await service.cancelCharge(draft.id, 'duplicate charge');

    expect(cancelled).toMatchObject({ id: draft.id, status: 'Cancelled' });
    await expect(service.recordReceipt({
      propertyId: draft.propertyId,
      tenantId: draft.tenantId,
      receivedDate: '2026-09-04',
      amountWon: 100,
      method: 'BankTransfer',
      allocations: [{ chargeId: draft.id, amountWon: 100 }],
    })).rejects.toThrow('is not ready for receipt allocation');
  });

  it('persists a cancellation reason and audit event for an unallocated database charge', async () => {
    const row = {
      id: 'charge-1', propertyId: 'property-1', tenantId: 'tenant-1', contractId: 'contract-1',
      billingMonth: '2026-09', dueDate: '2026-09-05', baseRentWon: 1200000, adjustmentWon: 0,
      billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: 'Cancelled',
    };
    const returning = vi.fn().mockResolvedValue([row]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const transaction = { update: vi.fn(() => ({ set })) };
    const database = { client: { transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } } as unknown as DatabaseService;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BillingService(undefined, database, audit);

    const cancelled = await service.cancelCharge('charge-1', 'duplicate charge', 'manager-1');

    expect(cancelled.status).toBe('Cancelled');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ cancellationReason: 'duplicate charge', cancelledBy: 'manager-1' }));
    expect(audit.record).toHaveBeenCalledWith(transaction, expect.objectContaining({ action: 'charge.cancelled', entityId: 'charge-1' }));
  });
});

describe('BillingService.findCharges', () => {
  it('returns only the selected billing month instead of a tenant-owned payment status', async () => {
    const service = new BillingService(new ContractsService());
    await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.generateMonth('2026-10', new Date('2026-09-04T00:00:00.000Z'));

    const charges = await service.findCharges({ billingMonth: '2026-09' });

    expect(charges).toHaveLength(4);
    expect(charges).toEqual(expect.arrayContaining([
      expect.objectContaining({ billingMonth: '2026-09', outstandingWon: 1200000 }),
    ]));
  });
});

describe('BillingService.getSummary', () => {
  it('summarizes billed, received, outstanding, and approval work for one billing month', async () => {
    const service = new BillingService(new ContractsService());
    const [first] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(first.id);
    await service.recordReceipt({
      propertyId: first.propertyId, tenantId: first.tenantId, receivedDate: '2026-09-04',
      amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: first.id, amountWon: 400000 }],
    });

    await expect(service.getSummary('2026-09')).resolves.toMatchObject({
      billingMonth: '2026-09', billedWon: 4740000, receivedWon: 400000, outstandingWon: 4340000,
      draftCount: 3, partiallyPaidCount: 1,
    });
  });
});

describe('BillingService.findReceipts', () => {
  it('returns receipt history for the selected tenant, including void state', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(draft.id);
    const receipt = await service.recordReceipt({ propertyId: draft.propertyId, tenantId: draft.tenantId, receivedDate: '2026-09-04', amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: draft.id, amountWon: 400000 }] });
    await service.voidReceipt(receipt.id, 'duplicate entry');

    await expect(service.findReceipts({ tenantId: draft.tenantId })).resolves.toEqual([expect.objectContaining({ id: receipt.id, voidReason: 'duplicate entry' })]);
  });

  it('limits receipt history to receipts allocated to the selected billing month', async () => {
    const service = new BillingService(new ContractsService());
    const [septemberCharge] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    const [octoberCharge] = await service.generateMonth('2026-10', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(septemberCharge.id);
    await service.approveCharge(octoberCharge.id);

    const septemberReceipt = await service.recordReceipt({ propertyId: septemberCharge.propertyId, tenantId: septemberCharge.tenantId, receivedDate: '2026-09-04', amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: septemberCharge.id, amountWon: 400000 }] });
    await service.recordReceipt({ propertyId: octoberCharge.propertyId, tenantId: octoberCharge.tenantId, receivedDate: '2026-10-04', amountWon: 300000, method: 'BankTransfer', allocations: [{ chargeId: octoberCharge.id, amountWon: 300000 }] });

    await expect(service.findReceipts({ billingMonth: '2026-09' })).resolves.toEqual([expect.objectContaining({ id: septemberReceipt.id })]);
  });
});

describe('BillingService.recordReceipt', () => {
  it('rejects duplicate allocations that exceed one charge outstanding balance', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(draft.id);

    await expect(service.recordReceipt({
      propertyId: draft.propertyId,
      tenantId: draft.tenantId,
      receivedDate: '2026-09-04',
      amountWon: 1400000,
      method: 'BankTransfer',
      allocations: [
        { chargeId: draft.id, amountWon: 700000 },
        { chargeId: draft.id, amountWon: 700000 },
      ],
    })).rejects.toThrow(`Receipt allocation exceeds outstanding amount for ${draft.id}`);
  });

  it('marks an approved charge partially paid after a valid partial allocation', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth(
      '2026-09',
      new Date('2026-09-04T00:00:00.000Z'),
    );
    await service.approveCharge(draft.id);

    const receipt = await service.recordReceipt({
      propertyId: draft.propertyId,
      tenantId: draft.tenantId,
      receivedDate: '2026-09-04',
      amountWon: 400000,
      method: 'BankTransfer',
      allocations: [{ chargeId: draft.id, amountWon: 400000 }],
    });

    expect(receipt.amountWon).toBe(400000);
    expect(await service.findCharge(draft.id)).toMatchObject({
      receivedWon: 400000,
      outstandingWon: 800000,
      status: 'PartiallyPaid',
    });
  });

  it('persists a receipt, allocation, balance, and audit event in one database transaction', async () => {
    const charge = {
      id: 'charge-1', propertyId: 'property-1', tenantId: 'tenant-1', contractId: 'contract-1',
      billingMonth: '2026-09', dueDate: '2026-09-05', baseRentWon: 1200000, adjustmentWon: 0,
      billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: 'Approved',
    };
    const lockedCharges = vi.fn().mockResolvedValue([charge]);
    const whereCharge = vi.fn(() => ({ for: lockedCharges }));
    const receiptReturning = vi.fn().mockResolvedValue([{ id: 'receipt-1' }]);
    const receiptValues = vi.fn(() => ({ returning: receiptReturning }));
    const allocationValues = vi.fn().mockResolvedValue(undefined);
    const balanceWhere = vi.fn().mockResolvedValue(undefined);
    const balanceSet = vi.fn(() => ({ where: balanceWhere }));
    const transaction = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: whereCharge })) })),
      insert: vi.fn()
        .mockReturnValueOnce({ values: receiptValues })
        .mockReturnValueOnce({ values: allocationValues }),
      update: vi.fn(() => ({ set: balanceSet })),
    };
    const database = { client: { transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } } as unknown as DatabaseService;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BillingService(undefined, database, audit);

    const receipt = await service.recordReceipt({
      propertyId: 'property-1', tenantId: 'tenant-1', receivedDate: '2026-09-04', amountWon: 400000,
      method: 'BankTransfer', allocations: [{ chargeId: 'charge-1', amountWon: 400000 }],
    }, 'manager-1');

    expect(receipt).toMatchObject({ id: 'receipt-1', amountWon: 400000 });
    expect(allocationValues).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ receiptId: 'receipt-1', chargeId: 'charge-1', amountWon: 400000 }),
    ]));
    expect(balanceSet).toHaveBeenCalledWith(expect.objectContaining({ receivedWon: 400000, outstandingWon: 800000, status: 'PartiallyPaid' }));
    expect(audit.record).toHaveBeenCalledWith(transaction, expect.objectContaining({ action: 'receipt.recorded', entityId: 'receipt-1', actorSubject: 'manager-1' }));
  });

  it('restores the charge balance when a receipt is voided', async () => {
    const service = new BillingService(new ContractsService());
    const [draft] = await service.generateMonth('2026-09', new Date('2026-09-04T00:00:00.000Z'));
    await service.approveCharge(draft.id);
    const receipt = await service.recordReceipt({ propertyId: draft.propertyId, tenantId: draft.tenantId, receivedDate: '2026-09-04', amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: draft.id, amountWon: 400000 }] });

    await service.voidReceipt(receipt.id, 'duplicate entry');

    expect(await service.findCharge(draft.id)).toMatchObject({ receivedWon: 0, outstandingWon: 1200000, status: 'Approved' });
  });

  it('voids a persisted receipt and restores its allocated charge balance atomically', async () => {
    const receipt = { id: 'receipt-1', voidedAt: null };
    const allocation = { chargeId: 'charge-1', amountWon: 400000 };
    const charge = { id: 'charge-1', billedWon: 1200000, receivedWon: 400000 };
    const lockedReceipt = vi.fn().mockResolvedValue([receipt]);
    const lockedAllocations = vi.fn().mockResolvedValue([allocation]);
    const lockedCharges = vi.fn().mockResolvedValue([charge]);
    const transaction = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: lockedReceipt })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: lockedAllocations })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: lockedCharges })) })) }),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    };
    const database = { client: { transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } } as unknown as DatabaseService;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BillingService(undefined, database, audit);

    await service.voidReceipt('receipt-1', 'duplicate entry', 'manager-1');

    expect(transaction.update).toHaveBeenCalledTimes(2);
    expect(audit.record).toHaveBeenCalledWith(transaction, expect.objectContaining({ action: 'receipt.voided', entityId: 'receipt-1', actorSubject: 'manager-1' }));
  });
});
