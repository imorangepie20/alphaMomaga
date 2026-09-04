import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { ContractsService } from './contracts.service.js';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
