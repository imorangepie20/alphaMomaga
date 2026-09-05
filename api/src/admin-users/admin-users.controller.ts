import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import type { AuthenticatedRequest } from '../auth/principal.js';
import { ManagementService } from './management.service.js';

@Controller('admin/users')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('user:manage')
export class AdminUsersController {
  constructor(private readonly management: ManagementService) {}
  @Get() list(@Req() req: AuthenticatedRequest, @Query('page') page = '0', @Query('email') email?: string) { return this.management.list(req.user!.subject, Number(page), email); }
  @Get('roles') roles(@Req() req: AuthenticatedRequest) { return this.management.roles(req.user!.subject); }
  @Post('invite') invite(@Req() req: AuthenticatedRequest, @Body() body: { email?: unknown; roleId?: unknown }) { return this.management.invite(req.user!.subject, body ?? {}); }
  @Post(':id/block') block(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { blocked?: unknown }) { return this.management.block(req.user!.subject, id, body?.blocked); }
  @Post(':id/role') role(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { roleId?: unknown }) { return this.management.setRole(req.user!.subject, id, body?.roleId); }
}
