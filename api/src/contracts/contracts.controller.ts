import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service.js';
import type {
  CreateContractInput,
  RenewContractInput,
  UpdateContractInput,
} from './contract.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('contract:manage')
  async create(
    @Body() input: CreateContractInput,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.contractsService.create(input, request.user);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid contract input',
      );
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('contract:manage')
  async update(
    @Param('id') id: string,
    @Body() input: UpdateContractInput,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.contractsService.update(id, input, request.user);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid contract update',
      );
    }
  }

  @Post(':id/renew')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('contract:manage')
  async renew(
    @Param('id') id: string,
    @Body() input: RenewContractInput,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.contractsService.renew(id, input, request.user);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid contract renewal',
      );
    }
  }
}
