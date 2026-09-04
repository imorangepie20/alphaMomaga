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
});
