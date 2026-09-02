import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard.js';
import { RolesService } from '../roles/roles.service.js';

const context = (role?: string) => ({
  getHandler: () => function handler() {},
  getClass: () => class Controller {},
  switchToHttp: () => ({ getRequest: () => ({ user: role ? { role, subject: `demo:${role}` } : undefined }) }),
}) as unknown as ExecutionContext;

describe('PermissionsGuard', () => {
  it('allows a role with the required permission', () => {
    const reflector = { getAllAndOverride: () => 'tenant:manage' } as unknown as Reflector;
    expect(new PermissionsGuard(reflector, new RolesService()).canActivate(context('PropertyManager'))).toBe(true);
  });

  it('rejects missing identity and denied roles', () => {
    const reflector = { getAllAndOverride: () => 'tenant:manage' } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector, new RolesService());
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context('Finance'))).toThrow(ForbiddenException);
  });
});