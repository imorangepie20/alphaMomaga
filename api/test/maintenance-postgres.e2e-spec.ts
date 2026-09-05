import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/audit/audit.service.js';
import { MaintenanceService } from '../src/maintenance/maintenance.service.js';

const url = process.env.TEST_DATABASE_URL;
const previous = process.env.DATABASE_URL;

(url ? describe : describe.skip)('Maintenance completion (isolated PostgreSQL)', () => {
  let database: DatabaseService;
  let pool: Pool;
  let service: MaintenanceService;
  const propertyId = `maintenance-test-${randomUUID()}`;
  let id: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    database = new DatabaseService();
    pool = new Pool({ connectionString: url });
    service = new MaintenanceService(database, new AuditService(database));
    await pool.query("insert into properties (id,name,location,type,occupancy,status) values ($1,'Test','Test','Test',0,'Active')", [propertyId]);
  });

  afterAll(async () => {
    if (id) await pool.query('delete from audit_logs where entity_id = $1', [id]);
    await pool.query('delete from maintenance where property_id = $1', [propertyId]);
    await pool.query('delete from properties where id = $1', [propertyId]);
    await database.onApplicationShutdown();
    await pool.end();
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });

  it('persists completion, rolls back invalid edits, and audits evidence before reopening', async () => {
    const created = await service.create({ propertyId, task: 'Repair', dueDate: '2026-09-10', status: 'InProgress' });
    id = created.id;
    await expect(service.update(id, { status: 'Completed' })).rejects.toThrow();
    expect((await pool.query('select status from maintenance where id=$1', [id])).rows[0].status).toBe('InProgress');
    const evidence = { completedAt: '2026-09-01', resolution: 'Replaced valve and verified' };
    await service.update(id, { status: 'Completed', ...evidence });
    await database.onApplicationShutdown();
    database = new DatabaseService();
    service = new MaintenanceService(database, new AuditService(database));
    expect((await service.findAll()).find((item) => item.id === id)).toMatchObject(evidence);
    await expect(service.update(id, { resolution: '' })).rejects.toThrow();
    expect((await service.findAll()).find((item) => item.id === id)).toMatchObject(evidence);
    const reopened = await service.update(id, { status: 'InProgress' });
    expect(reopened.completedAt).toBeUndefined();
    expect(reopened.resolution).toBeUndefined();
    const audit = await pool.query('select metadata from audit_logs where entity_id=$1', [id]);
    expect(audit.rows).toHaveLength(3);
    expect(audit.rows).toContainEqual({ metadata: { changes: { status: 'InProgress' }, previousCompletion: evidence } });
  });
});
