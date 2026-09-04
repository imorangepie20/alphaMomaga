import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module.js';
import { AuthConfigService } from './auth-config.service.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';

@Module({
  imports: [RolesModule],
  providers: [AuthConfigService, AuthService, AuthGuard, PermissionsGuard],
  exports: [AuthConfigService, AuthService, AuthGuard, PermissionsGuard],
})
export class AuthModule {}
