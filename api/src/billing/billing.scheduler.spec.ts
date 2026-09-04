import { BillingScheduler } from './billing.scheduler.js';
import { BillingService } from './billing.service.js';
import { vi } from 'vitest';

describe('BillingScheduler', () => {
  it('catches up the current Seoul billing month idempotently', async () => {
    const generateMonth = vi.fn().mockResolvedValue([]);
    const scheduler = new BillingScheduler({ generateMonth } as unknown as BillingService);

    await scheduler.catchUp(new Date('2026-09-04T00:00:00.000Z'));

    expect(generateMonth).toHaveBeenCalledWith('2026-09', new Date('2026-09-04T00:00:00.000Z'));
  });
});
