import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('property:manage')
  async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    await this.propertiesService.delete(id, request.user);
    return { message: '부동산이 삭제되었습니다' };
  }
}