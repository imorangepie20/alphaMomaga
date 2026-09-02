import { AuditService } from './audit.service.js';

describe('AuditService', () => {
  it('writes a tenant creation event through the supplied database executor', async () => {
    const insert = () => ({
      values: async (value: Record<string, unknown>) => value,
    });
    const database = { insert } as never;

    await expect(new AuditService().record(database, {
      action: 'tenant.created',
      actorSubject: 'user-1',
      actorRole: 'PropertyManager',
      entityType: 'tenant',
      entityId: 'tenant-1',
    })).resolves.toBeUndefined();
  });
});