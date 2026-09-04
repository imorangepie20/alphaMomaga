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
});
