import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { AdminUsersController } from './admin-users.controller.js';
import { ManagementService } from './management.service.js';

@Module({ imports: [AuthModule, RolesModule], controllers: [AdminUsersController], providers: [ManagementService] })
export class AdminUsersModule {}
