import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { InspectionsService } from './inspections.service.js';
import type { CreateInspectionInput, UpdateInspectionInput } from './inspection.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  findAll() {
    return this.inspectionsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('inspection:manage')
  async create(@Body() input: CreateInspectionInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.inspectionsService.create(input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid inspection input');
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('inspection:manage')
  async update(@Param('id') id: string, @Body() input: UpdateInspectionInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.inspectionsService.update(id, input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid inspection update');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('inspection:manage')
  async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<void> {
    try {
      await this.inspectionsService.delete(id, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid inspection deletion');
    }
  }
}
