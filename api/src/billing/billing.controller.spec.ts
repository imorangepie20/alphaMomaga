import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { vi } from 'vitest';

describe('BillingController', () => {
  it('forwards a receipt registration request to the billing service', async () => {
    const recordReceipt = vi.fn().mockResolvedValue({ id: 'receipt-1' });
    const controller = new BillingController({ recordReceipt } as unknown as BillingService);

    await expect(controller.recordReceipt({ amountWon: 100, allocations: [] }, { user: { subject: 'manager-1' } } as any)).resolves.toEqual({ id: 'receipt-1' });
    expect(recordReceipt).toHaveBeenCalledOnce();
  });

  it('forwards a receipt void request with its reason to the billing service', async () => {
    const voidReceipt = vi.fn().mockResolvedValue(undefined);
    const controller = new BillingController({ voidReceipt } as unknown as BillingService);

    await expect(controller.voidReceipt('receipt-1', { reason: 'duplicate entry' }, { user: { subject: 'manager-1' } } as any)).resolves.toBeUndefined();
    expect(voidReceipt).toHaveBeenCalledWith('receipt-1', 'duplicate entry', 'manager-1');
  });

  it('forwards a charge cancellation request with its reason to the billing service', async () => {
    const cancelCharge = vi.fn().mockResolvedValue({ id: 'charge-1', status: 'Cancelled' });
    const controller = new BillingController({ cancelCharge } as unknown as BillingService);

    await expect(controller.cancelCharge('charge-1', { reason: 'duplicate charge' }, { user: { subject: 'manager-1' } } as any)).resolves.toMatchObject({ status: 'Cancelled' });
    expect(cancelCharge).toHaveBeenCalledWith('charge-1', 'duplicate charge', 'manager-1');
  });

  it('forwards monthly charge filters to the billing service', async () => {
    const findCharges = vi.fn().mockResolvedValue([{ id: 'charge-1' }]);
    const controller = new BillingController({ findCharges } as unknown as BillingService);

    await expect(controller.findCharges('2026-09', 'property-1', 'tenant-1')).resolves.toEqual([{ id: 'charge-1' }]);
    expect(findCharges).toHaveBeenCalledWith({ billingMonth: '2026-09', propertyId: 'property-1', tenantId: 'tenant-1' });
  });

  it('requires a billing month when forwarding the billing summary query', async () => {
    const getSummary = vi.fn().mockResolvedValue({ billingMonth: '2026-09' });
    const controller = new BillingController({ getSummary } as unknown as BillingService);

    await expect(controller.getSummary('2026-09')).resolves.toEqual({ billingMonth: '2026-09' });
    expect(getSummary).toHaveBeenCalledWith('2026-09');
  });
});
