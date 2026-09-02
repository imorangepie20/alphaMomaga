import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../roles/roles.service.js';
import type { Permission } from '../roles/role.js';
import type { AuthenticatedRequest } from './principal.js';
import { REQUIRED_PERMISSION } from './permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission>(REQUIRED_PERMISSION, [context.getHandler(), context.getClass()]);
    if (!permission) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;
    if (!role) throw new UnauthorizedException('An authenticated principal is required');
    if (!this.rolesService.can(role as Parameters<RolesService['can']>[0], permission)) {
      throw new ForbiddenException('The role does not have the required permission');
    }
    return true;
  }
}