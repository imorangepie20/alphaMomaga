import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';

@Controller('admin/audit-logs')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermission('user:manage')
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('actorSubject') actorSubject?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.findAll({
      entityType,
      entityId,
      action,
      actorSubject,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
