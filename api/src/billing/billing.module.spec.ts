import { Test } from '@nestjs/testing';
import { BillingModule } from './billing.module.js';
import { BillingService } from './billing.service.js';

describe('BillingModule', () => {
  it('provides BillingService to its consumers', async () => {
    const module = await Test.createTestingModule({
      imports: [BillingModule],
    }).compile();

    expect(module.get(BillingService)).toBeInstanceOf(BillingService);
  });

  it('shares the contract source needed to generate a monthly draft', async () => {
    const module = await Test.createTestingModule({
      imports: [BillingModule],
    }).compile();

    await expect(
      module.get(BillingService).generateMonth(
        '2026-09',
        new Date('2026-09-04T00:00:00.000Z'),
      ),
    ).resolves.toHaveLength(4);
  });
});
