import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/audit/audit.service.js';
import { InspectionsService } from '../src/inspections/inspections.service.js';

const url = process.env.TEST_DATABASE_URL;
const previous = process.env.DATABASE_URL;

(url ? describe : describe.skip)('Inspection completion (isolated PostgreSQL)', () => {
  let database: DatabaseService;
  let pool: Pool;
  let service: InspectionsService;
  const propertyId = `inspection-test-${randomUUID()}`;
  let id: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    database = new DatabaseService();
    pool = new Pool({ connectionString: url });
    service = new InspectionsService(database, new AuditService(database));
    await pool.query("insert into properties (id,name,location,type,occupancy,status) values ($1,'Test','Test','Test',0,'Active')", [propertyId]);
  });

  afterAll(async () => {
    if (id) await pool.query('delete from audit_logs where entity_id=$1', [id]);
    await pool.query('delete from inspections where property_id=$1', [propertyId]);
    await pool.query('delete from properties where id=$1', [propertyId]);
    await database.onApplicationShutdown();
    await pool.end();
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });

  it('persists early completion, rolls back invalid edits, and preserves the previous date when reopening', async () => {
    const created = await service.create({ propertyId, type: 'Safety', scheduledDate: '2026-09-10', status: 'InReview', priority: 'Routine' });
    id = created.id;
    await expect(service.update(id, { status: 'Completed' })).rejects.toThrow();
    expect((await pool.query('select status from inspections where id=$1', [id])).rows[0].status).toBe('InReview');
    await service.update(id, { status: 'Completed', completedAt: '2026-09-01' });
    await database.onApplicationShutdown();
    database = new DatabaseService();
    service = new InspectionsService(database, new AuditService(database));
    expect((await service.findAll()).find((item) => item.id === id)).toMatchObject({ status: 'Completed', completedAt: '2026-09-01' });
    await expect(service.update(id, { completedAt: '9999-01-01' })).rejects.toThrow();
    expect((await service.findAll()).find((item) => item.id === id)?.completedAt).toBe('2026-09-01');
    expect(await service.update(id, { status: 'InReview' })).not.toHaveProperty('completedAt');
    expect((await pool.query('select completed_at from inspections where id=$1', [id])).rows[0].completed_at).toBeNull();
    const audit = await pool.query('select metadata from audit_logs where entity_id=$1', [id]);
    expect(audit.rows).toHaveLength(3);
    expect(audit.rows).toContainEqual({ metadata: { changes: { status: 'InReview' }, previousCompletion: { completedAt: '2026-09-01' } } });

    await Promise.all([
      service.update(id, { status: 'Completed', completedAt: '2026-09-01' }),
      service.update(id, { status: 'Completed', completedAt: '2026-09-02' }),
    ]);
    const history = (await pool.query('select metadata from audit_logs where entity_id=$1', [id])).rows.map((row) => row.metadata);
    expect(history).toHaveLength(5);
    const chained = history.find((entry) => entry.changes?.status === 'Completed' && entry.previousCompletion?.completedAt);
    expect(chained).toBeDefined();
    expect(chained.previousCompletion.completedAt).not.toBe(chained.changes.completedAt);
    expect((await service.findAll()).find((item) => item.id === id)?.completedAt).toBe(chained.changes.completedAt);
  });
});
