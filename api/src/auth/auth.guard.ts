import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RolesService } from '../roles/roles.service.js';
import type { RoleName } from '../roles/role.js';
import type { AuthenticatedRequest } from './principal.js';
import { AuthService } from './auth.service.js';

const roleNames: RoleName[] = ['Admin', 'PropertyManager', 'Finance', 'Inspector'];

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly rolesService: RolesService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearerToken = request.header('authorization');
    if (bearerToken) {
      request.user = await this.authService.verifyBearerToken(bearerToken);
      return true;
    }

    const role = request.header('x-demo-role');
    if (process.env.NODE_ENV !== 'production' && process.env.AUTH_ALLOW_DEMO_ROLE === 'true' && role && roleNames.includes(role as RoleName) && this.rolesService.can(role as RoleName, 'portfolio:read')) {
      request.user = { role, subject: `demo:${role}` };
      return true;
    }

    throw new UnauthorizedException('A valid Bearer token is required');
  }
}