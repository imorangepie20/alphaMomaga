import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the database seed');
}

const pool = new Pool({ connectionString });

function getSeoulBillingMonth() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
}

async function seed() {
  const client = await pool.connect();
  const billingMonth = getSeoulBillingMonth();
  const dueDate = `${billingMonth}-01`;
  const receiptDate = `${billingMonth}-02`;
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
      insert into monthly_charges (id, property_id, tenant_id, contract_id, billing_month, due_date, base_rent_won, adjustment_won, billed_won, received_won, outstanding_won, status, approved_at, approved_by)
      values
        ('seed-charge-1', 'property-1', 'tenant-1', 'contract-1', $1, $2, 1200000, 0, 1200000, 1200000, 0, 'Paid', now(), 'seed'),
        ('seed-charge-2', 'property-2', 'tenant-2', 'contract-2', $1, $2, 980000, 0, 980000, 0, 980000, 'Overdue', now(), 'seed'),
        ('seed-charge-3', 'property-3', 'tenant-3', 'contract-3', $1, $2, 1540000, 0, 1540000, 500000, 1040000, 'PartiallyPaid', now(), 'seed'),
        ('seed-charge-4', 'property-4', 'tenant-4', 'contract-4', $1, $2, 1020000, 0, 1020000, 0, 1020000, 'Draft', null, null)
      on conflict (contract_id, billing_month) do update set
        due_date = excluded.due_date,
        base_rent_won = excluded.base_rent_won,
        adjustment_won = excluded.adjustment_won,
        billed_won = excluded.billed_won,
        received_won = excluded.received_won,
        outstanding_won = excluded.outstanding_won,
        status = excluded.status,
        approved_at = excluded.approved_at,
        approved_by = excluded.approved_by,
        cancelled_at = null,
        cancelled_by = null,
        cancellation_reason = null,
        updated_at = now()
    `, [billingMonth, dueDate]);

    await client.query(`
      insert into payment_receipts (id, property_id, tenant_id, received_date, amount_won, method, reference, memo, recorded_by)
      values
        ('seed-receipt-1', 'property-1', 'tenant-1', $1, 1200000, 'BankTransfer', 'seed-full', 'Seeded full payment', 'seed'),
        ('seed-receipt-3', 'property-3', 'tenant-3', $1, 500000, 'BankTransfer', 'seed-partial', 'Seeded partial payment', 'seed')
      on conflict (id) do update set
        received_date = excluded.received_date,
        amount_won = excluded.amount_won,
        method = excluded.method,
        reference = excluded.reference,
        memo = excluded.memo,
        voided_at = null,
        voided_by = null,
        void_reason = null
    `, [receiptDate]);

    await client.query(`
      insert into payment_allocations (id, receipt_id, charge_id, amount_won)
      values
        ('seed-allocation-1', 'seed-receipt-1', 'seed-charge-1', 1200000),
        ('seed-allocation-3', 'seed-receipt-3', 'seed-charge-3', 500000)
      on conflict (id) do update set
        receipt_id = excluded.receipt_id,
        charge_id = excluded.charge_id,
        amount_won = excluded.amount_won
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
    console.log(`Database seed completed with ${billingMonth} billing ledger fixtures`);
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
