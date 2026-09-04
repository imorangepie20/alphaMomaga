import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { ContractsModule } from '../contracts/contracts.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [AuditModule, ContractsModule, DatabaseModule],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
