import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import type { CreatePaymentInput, UpdatePaymentInput } from './payment.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('payment:manage')
  async create(@Body() input: CreatePaymentInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.paymentsService.create(input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment input');
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('payment:manage')
  async update(@Param('id') id: string, @Body() input: UpdatePaymentInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.paymentsService.update(id, input, request.user);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment update');
    }
  }
}