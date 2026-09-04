import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import type { AuthenticatedRequest } from '../auth/principal.js';
import type { PaymentReceiptInput } from './billing.js';
import { BillingService } from './billing.service.js';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('monthly-charges')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  findCharges(
    @Query('billingMonth') billingMonth?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.billingService.findCharges({ billingMonth, propertyId, tenantId });
  }

  @Get('billing-summary')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  getSummary(@Query('billingMonth') billingMonth?: string) {
    if (!billingMonth) throw new BadRequestException('billingMonth is required');
    return this.billingService.getSummary(billingMonth);
  }

  @Get('tenants/:tenantId/ledger')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  getTenantLedger(@Param('tenantId') tenantId: string, @Query('billingMonth') billingMonth?: string) {
    if (!billingMonth) throw new BadRequestException('billingMonth is required');
    return this.billingService.getTenantLedger(tenantId, billingMonth);
  }

  @Get('payment-receipts')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('portfolio:read')
  findReceipts(@Query('billingMonth') billingMonth?: string, @Query('propertyId') propertyId?: string, @Query('tenantId') tenantId?: string) {
    return this.billingService.findReceipts({ billingMonth, propertyId, tenantId });
  }

  @Post('billing-runs/:billingMonth')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('billing:manage')
  async generateMonth(@Param('billingMonth') billingMonth: string) {
    try {
      return await this.billingService.generateMonth(billingMonth);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid billing month');
    }
  }

  @Post('monthly-charges/:id/approve')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('billing:manage')
  async approveCharge(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    try {
      return await this.billingService.approveCharge(id, request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid monthly charge approval');
    }
  }

  @Post('payment-receipts')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('billing:manage')
  async recordReceipt(@Body() input: PaymentReceiptInput, @Req() request: AuthenticatedRequest) {
    try {
      return await this.billingService.recordReceipt(input, request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment receipt');
    }
  }

  @Post('monthly-charges/:id/cancel')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('billing:manage')
  async cancelCharge(@Param('id') id: string, @Body() input: { reason?: string }, @Req() request: AuthenticatedRequest) {
    try {
      return await this.billingService.cancelCharge(id, input.reason ?? '', request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid monthly charge cancellation');
    }
  }

  @Post('payment-receipts/:id/void')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('billing:manage')
  async voidReceipt(@Param('id') id: string, @Body() input: { reason?: string }, @Req() request: AuthenticatedRequest): Promise<void> {
    try {
      await this.billingService.voidReceipt(id, input.reason ?? '', request.user?.subject);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment receipt void');
    }
  }
}
