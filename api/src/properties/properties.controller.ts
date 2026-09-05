import { Controller, Delete, Get, Post, Put, Param, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import type { CreatePropertyInput, UpdatePropertyInput } from './property.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  findAll() {
    return this.propertiesService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('property:manage')
  async create(@Body() input: CreatePropertyInput, @Req() request: AuthenticatedRequest) {
    if (!input.name || !input.location || !input.type) {
      throw new BadRequestException('부동산 이름, 위치, 유형은 필수입니다');
    }
    return this.propertiesService.create(input, request.user);
  }

  @Put(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('property:manage')
  async update(@Param('id') id: string, @Body() input: UpdatePropertyInput, @Req() request: AuthenticatedRequest) {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('업데이트할 필드가 최소 하나 필요합니다');
    }
    return this.propertiesService.update(id, input, request.user);
  }
  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('property:manage')
  async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    await this.propertiesService.delete(id, request.user);
    return { message: '부동산이 삭제되었습니다' };
  }
}
