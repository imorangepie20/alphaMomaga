import { BadRequestException, Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';
import type { PaymentReceiptInput } from './billing.js';
import { BillingService } from './billing.service.js';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('payment-receipts')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('payment:manage')
  async recordReceipt(@Body() input: PaymentReceiptInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.billingService.recordReceipt(input, request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment receipt');
    }
  }

  @Post('payment-receipts/:id/void')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('payment:manage')
  async voidReceipt(@Param('id') id: string, @Body() input: { reason?: string }, @Req() request: AuthenticatedRequest): Promise<void> {
    try {
      await this.billingService.voidReceipt(id, input.reason ?? '', request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment receipt void');
    }
  }
}
