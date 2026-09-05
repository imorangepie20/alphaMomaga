import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('maintenance:manage')
  async create(@Body() input: CreateMaintenanceInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.maintenanceService.create(input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid maintenance input');
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('maintenance:manage')
  async update(@Param('id') id: string, @Body() input: UpdateMaintenanceInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.maintenanceService.update(id, input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid maintenance update');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('maintenance:manage')
  async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<void> {
    try {
      await this.maintenanceService.delete(id, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid maintenance deletion');
    }
  }
}
