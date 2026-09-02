import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the database seed');
}

const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('begin');

    await client.query(`
      insert into properties (id, name, location, type, occupancy, status)
      values
        ('property-1', 'Seoul Heights Tower', 'Seoul, KR', 'Apartment', 96, 'Occupied'),
        ('property-2', 'Hana Village', 'Busan, KR', 'Townhouse', 88, 'Active'),
        ('property-3', 'Blue Park Residences', 'Incheon, KR', 'Officetel', 82, 'Pending'),
        ('property-4', 'Riverside Point', 'Daegu, KR', 'Commercial', 91, 'Occupied')
      on conflict (id) do update set
        name = excluded.name,
        location = excluded.location,
        type = excluded.type,
        occupancy = excluded.occupancy,
        status = excluded.status
    `);

    await client.query(`
      insert into tenants (id, name, property_id, unit, rent_won, status)
      values
        ('tenant-1', 'Kim Jihoon', 'property-1', 'A-101', 1200000, 'Paid'),
        ('tenant-2', 'Park Minseo', 'property-2', 'B-302', 980000, 'Overdue'),
        ('tenant-3', 'Lee Daeho', 'property-3', 'C-205', 1540000, 'Paid'),
        ('tenant-4', 'Choi Yuna', 'property-4', 'D-408', 1020000, 'Pending')
      on conflict (id) do update set
        name = excluded.name,
        property_id = excluded.property_id,
        unit = excluded.unit,
        rent_won = excluded.rent_won,
        status = excluded.status
    `);

    await client.query(`
      insert into contracts (id, property_id, tenant_id, unit, monthly_rent_won, start_date, end_date, status)
      values
        ('contract-1', 'property-1', 'tenant-1', 'A-101', 1200000, '2026-01-01', '2027-08-31', 'Active'),
        ('contract-2', 'property-2', 'tenant-2', 'B-302', 980000, '2025-12-16', '2026-12-15', 'Active'),
        ('contract-3', 'property-3', 'tenant-3', 'C-205', 1540000, '2026-03-10', '2027-03-09', 'Active'),
        ('contract-4', 'property-4', 'tenant-4', 'D-408', 1020000, '2025-10-03', '2026-10-02', 'Active')
      on conflict (id) do update set
        property_id = excluded.property_id,
        tenant_id = excluded.tenant_id,
        unit = excluded.unit,
        monthly_rent_won = excluded.monthly_rent_won,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        status = excluded.status
    `);

    await client.query(`
      insert into payments (id, property_id, contract_id, amount_won, due_date, status, paid_at)
      values
        ('payment-1', 'property-1', 'contract-1', 12400000, '2026-08-31', 'Paid', '2026-08-29'),
        ('payment-2', 'property-2', 'contract-2', 9800000, '2026-08-05', 'Overdue', null),
        ('payment-3', 'property-3', 'contract-3', 8200000, '2026-09-10', 'Pending', null),
        ('payment-4', 'property-4', 'contract-4', 15300000, '2026-09-11', 'Paid', '2026-09-01')
      on conflict (id) do update set
        property_id = excluded.property_id,
        contract_id = excluded.contract_id,
        amount_won = excluded.amount_won,
        due_date = excluded.due_date,
        status = excluded.status,
        paid_at = excluded.paid_at
    `);

    await client.query(`
      insert into maintenance (id, property_id, task, due_date, status)
      values
        ('maintenance-1', 'property-1', '승강기 정기 점검', '2026-09-07', 'Scheduled'),
        ('maintenance-2', 'property-2', '누수 보수', '2026-09-09', 'InProgress'),
        ('maintenance-3', 'property-4', '냉난방기 정비', '2026-08-14', 'Completed'),
        ('maintenance-4', 'property-3', '외벽 상태 점검', '2026-09-22', 'Pending')
      on conflict (id) do update set
        property_id = excluded.property_id,
        task = excluded.task,
        due_date = excluded.due_date,
        status = excluded.status
    `);

    await client.query(`
      insert into inspections (id, property_id, type, scheduled_date, status, priority, completed_at)
      values
        ('inspection-1', 'property-1', '소방 안전', '2026-09-06', 'Scheduled', 'Routine', null),
        ('inspection-2', 'property-2', '냉난방 설비', '2026-08-09', 'Completed', 'Routine', '2026-08-10'),
        ('inspection-3', 'property-4', '전기 안전', '2026-09-12', 'InReview', 'Urgent', null),
        ('inspection-4', 'property-3', '외벽 점검', '2026-09-18', 'Pending', 'Routine', null)
      on conflict (id) do update set
        property_id = excluded.property_id,
        type = excluded.type,
        scheduled_date = excluded.scheduled_date,
        status = excluded.status,
        priority = excluded.priority,
        completed_at = excluded.completed_at
    `);

    await client.query('commit');
    console.log('Database seed completed for six domain tables');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});