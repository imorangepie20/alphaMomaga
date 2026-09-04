import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { ContractsModule } from '../contracts/contracts.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { BillingScheduler } from './billing.scheduler.js';

@Module({
  imports: [AuditModule, AuthModule, ContractsModule, DatabaseModule, RolesModule],
  controllers: [BillingController],
  providers: [BillingService, BillingScheduler, AuthGuard, PermissionsGuard],
  exports: [BillingService],
})
export class BillingModule {}
