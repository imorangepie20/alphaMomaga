import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { RolesService } from '../roles/roles.service.js';
import { AuthService } from './auth.service.js';
import { AuthConfigService } from './auth-config.service.js';

const context = (role?: string, authorization?: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ header: (name: string) => name === 'x-demo-role' ? role : authorization }) }),
}) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  const authConfig = new AuthConfigService();
  const authService = new AuthService(authConfig);
  const guard = new AuthGuard(new RolesService(), authService);

  it('accepts a valid development role', async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    expect(await guard.canActivate(context('PropertyManager'))).toBe(true);
  });

  it('rejects missing and unknown roles', async () => {
    await expect(guard.canActivate(context())).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context('Unknown'))).rejects.toThrow(UnauthorizedException);
  });
});