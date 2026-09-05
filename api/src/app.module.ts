import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PropertiesController } from './properties/properties.controller.js';
import { PropertiesService } from './properties/properties.service.js';
import { TenantsController } from './tenants/tenants.controller.js';
import { TenantsService } from './tenants/tenants.service.js';
import { ContractsController } from './contracts/contracts.controller.js';
import { ContractsModule } from './contracts/contracts.module.js';
import { PaymentsController } from './payments/payments.controller.js';
import { PaymentsService } from './payments/payments.service.js';
import { MaintenanceController } from './maintenance/maintenance.controller.js';
import { MaintenanceService } from './maintenance/maintenance.service.js';
import { InspectionsController } from './inspections/inspections.controller.js';
import { InspectionsService } from './inspections/inspections.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditModule } from './audit/audit.module.js';
import { RolesController } from './roles/roles.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { BillingModule } from './billing/billing.module.js';
import { RolesModule } from './roles/roles.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DomainModule } from './domain/domain.module.js';
import { AdminUsersModule } from './admin-users/admin-users.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, AuditModule, DomainModule, RolesModule, AuthModule, ContractsModule, BillingModule, AdminUsersModule],
  controllers: [AppController, PropertiesController, TenantsController, ContractsController, PaymentsController, MaintenanceController, InspectionsController, RolesController, AuthController],
  providers: [AppService, PropertiesService, TenantsService, PaymentsService, MaintenanceService, InspectionsService],
})
export class AppModule {}
