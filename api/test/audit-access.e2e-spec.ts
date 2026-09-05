import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/audit/audit.service.js';

describe('Audit access boundary', () => {
  let app: INestApplication;
  const previous = process.env.AUTH_ALLOW_DEMO_ROLE;
  const findAll = vi.fn(async () => []);

  beforeAll(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue({ client: undefined })
      .overrideProvider(AuditService).useValue({ findAll }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });
  beforeEach(() => findAll.mockClear());
  afterAll(async () => {
    await app.close();
    if (previous === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previous;
  });

  it('rejects unauthenticated reads without calling the audit service', async () => {
    await request(app.getHttpServer()).get('/admin/audit-logs').expect(401);
    expect(findAll).not.toHaveBeenCalled();
  });
  it.each(['PropertyManager', 'Finance', 'Inspector'])('rejects %s without calling the audit service', async (role) => {
    await request(app.getHttpServer()).get('/admin/audit-logs').set('x-demo-role', role).expect(403);
    expect(findAll).not.toHaveBeenCalled();
  });
  it('allows an administrator to query a specific entity', async () => {
    await request(app.getHttpServer()).get('/admin/audit-logs?entityType=inspection&entityId=test-id').set('x-demo-role', 'Admin').expect(200);
    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'inspection', entityId: 'test-id' }));
  });
});
