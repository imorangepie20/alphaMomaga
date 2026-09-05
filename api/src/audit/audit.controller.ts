import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';

function pagination(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException('Invalid audit pagination');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException('Invalid audit pagination');
  }
  return parsed;
}

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
      limit: pagination(limit, 100, 1, 100),
      offset: pagination(offset, 0, 0, 1_000_000),
    });
  }
}
