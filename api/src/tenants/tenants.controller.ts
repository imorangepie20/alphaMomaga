import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service.js';
import type { CreateTenantInput } from './tenant.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

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
  async create(@Body() input: CreateTenantInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.tenantsService.create(input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid tenant input');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('tenant:manage')
  async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    await this.tenantsService.delete(id, request.user);
    return { message: '임차인이 삭제되었습니다' };
  }
}