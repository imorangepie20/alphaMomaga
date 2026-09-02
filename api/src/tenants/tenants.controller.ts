import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service.js';
import type { CreateTenantInput } from './tenant.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('tenant:manage')
  async create(@Body() input: CreateTenantInput) {
    try {
      return await this.tenantsService.create(input);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid tenant input');
    }
  }
}