import { RolesService } from './roles.service.js';

describe('RolesService', () => {
  const service = new RolesService();

  it('exposes the four operational roles', () => {
    expect(service.findAll().map((role) => role.name)).toEqual(['Admin', 'PropertyManager', 'Finance', 'Inspector']);
  });

  it('enforces the policy matrix', () => {
    expect(service.can('Admin', 'user:manage')).toBe(true);
    expect(service.can('PropertyManager', 'payment:manage')).toBe(true);
    expect(service.can('Finance', 'contract:manage')).toBe(false);
    expect(service.can('Inspector', 'inspection:manage')).toBe(true);
  });
});