import { Module } from '@nestjs/common';
import { ContractsModule } from '../contracts/contracts.module.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [ContractsModule],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
