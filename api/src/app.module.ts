import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PropertiesController } from './properties/properties.controller.js';
import { PropertiesService } from './properties/properties.service.js';
import { TenantsController } from './tenants/tenants.controller.js';
import { TenantsService } from './tenants/tenants.service.js';
import { ContractsController } from './contracts/contracts.controller.js';
import { ContractsService } from './contracts/contracts.service.js';
import { PaymentsController } from './payments/payments.controller.js';
import { PaymentsService } from './payments/payments.service.js';
import { MaintenanceController } from './maintenance/maintenance.controller.js';
import { MaintenanceService } from './maintenance/maintenance.service.js';
import { InspectionsController } from './inspections/inspections.controller.js';
import { InspectionsService } from './inspections/inspections.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditModule } from './audit/audit.module.js';
import { RolesController } from './roles/roles.controller.js';
import { RolesService } from './roles/roles.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthService } from './auth/auth.service.js';
import { AuthConfigService } from './auth/auth-config.service.js';
import { PermissionsGuard } from './auth/permissions.guard.js';
import { InMemoryReferenceRegistry } from './domain/in-memory-reference-registry.service.js';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [AppController, PropertiesController, TenantsController, ContractsController, PaymentsController, MaintenanceController, InspectionsController, RolesController, AuthController],
  providers: [AppService, InMemoryReferenceRegistry, PropertiesService, TenantsService, ContractsService, PaymentsService, MaintenanceService, InspectionsService, RolesService, AuthGuard, AuthConfigService, AuthService, PermissionsGuard],
})
export class AppModule {}
