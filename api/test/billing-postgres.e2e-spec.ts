import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres('Billing ledger (PostgreSQL e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  const manager = { 'x-demo-role': 'PropertyManager' };
  const ids = { propertyId: '', tenantId: '', contractId: '', chargeId: '', receiptId: '' };
  const suffix = randomUUID().slice(0, 8);
  const billingMonth = '2026-09';

  beforeAll(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    pool = new Pool({ connectionString: databaseUrl });
    app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (ids.propertyId) {
      await pool.query('delete from payment_allocations where charge_id = $1', [ids.chargeId]);
      await pool.query('delete from payment_receipts where id = $1', [ids.receiptId]);
      await pool.query('delete from monthly_charges where contract_id = $1', [ids.contractId]);
      await pool.query('delete from contracts where id = $1', [ids.contractId]);
      await pool.query('delete from tenants where id = $1', [ids.tenantId]);
      await pool.query('delete from properties where id = $1', [ids.propertyId]);
    }
    await app.close();
    await pool.end();
    delete process.env.AUTH_ALLOW_DEMO_ROLE;
  });

  it('enforces one monthly charge and restores its balance after a receipt void', async () => {
    const property = await request(app.getHttpServer()).post('/properties').set(manager).send({ name: `Billing DB ${suffix}`, location: 'Seoul, KR', type: 'Apartment', occupancy: 0, status: 'Active' }).expect(201);
    ids.propertyId = property.body.id;
    const tenant = await request(app.getHttpServer()).post('/tenants').set(manager).send({ name: `Billing Tenant ${suffix}`, propertyId: ids.propertyId, unit: `T-${suffix}`, rent: '₩1,200,000' }).expect(201);
    ids.tenantId = tenant.body.id;
    const contract = await request(app.getHttpServer()).post('/contracts').set(manager).send({ propertyId: ids.propertyId, tenantId: ids.tenantId, unit: `T-${suffix}`, monthlyRent: '₩1,200,000', startDate: '2026-09-01', endDate: '2027-08-31', status: 'Active' }).expect(201);
    ids.contractId = contract.body.id;

    await Promise.all([
      request(app.getHttpServer()).post(`/billing-runs/${billingMonth}`).set(manager).expect(201),
      request(app.getHttpServer()).post(`/billing-runs/${billingMonth}`).set(manager).expect(201),
    ]);
    const charges = await request(app.getHttpServer()).get(`/monthly-charges?billingMonth=${billingMonth}&propertyId=${ids.propertyId}`).set(manager).expect(200);
    expect(charges.body).toHaveLength(1);
    ids.chargeId = charges.body[0].id;

    await request(app.getHttpServer()).post(`/monthly-charges/${ids.chargeId}/approve`).set(manager).expect(201);
    const receipt = await request(app.getHttpServer()).post('/payment-receipts').set(manager).send({ propertyId: ids.propertyId, tenantId: ids.tenantId, receivedDate: '2026-09-04', amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: ids.chargeId, amountWon: 400000 }] }).expect(201);
    ids.receiptId = receipt.body.id;
    await request(app.getHttpServer()).post(`/payment-receipts/${ids.receiptId}/void`).set(manager).send({ reason: 'PostgreSQL correction test' }).expect(201);

    const restored = await request(app.getHttpServer()).get(`/monthly-charges?billingMonth=${billingMonth}&propertyId=${ids.propertyId}`).set(manager).expect(200);
    expect(restored.body[0]).toMatchObject({ receivedWon: 0, outstandingWon: 1200000 });
  });
});
