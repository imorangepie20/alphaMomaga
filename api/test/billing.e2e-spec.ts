import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Billing ledger (e2e)', () => {
  let app: INestApplication<App>;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const manager = { 'x-demo-role': 'PropertyManager' };
  const finance = { 'x-demo-role': 'Finance' };

  beforeAll(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    delete process.env.DATABASE_URL;
    app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); delete process.env.AUTH_ALLOW_DEMO_ROLE; if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDatabaseUrl; });

  it('runs the authenticated draft-to-receipt-to-void workflow', async () => {
    await request(app.getHttpServer()).post('/billing-runs/2026-09').set(manager).expect(201);
    const charges = await request(app.getHttpServer()).get('/monthly-charges?billingMonth=2026-09').set(manager).expect(200);
    const draft = charges.body.find((charge: { status: string }) => charge.status === 'Draft');
    expect(draft).toBeDefined();
    await request(app.getHttpServer()).post(`/monthly-charges/${draft.id}/approve`).set(manager).expect(201);
    const receipt = await request(app.getHttpServer()).post('/payment-receipts').set(manager).send({ propertyId: draft.propertyId, tenantId: draft.tenantId, receivedDate: '2026-09-04', amountWon: 400000, method: 'BankTransfer', allocations: [{ chargeId: draft.id, amountWon: 400000 }] }).expect(201);
    await request(app.getHttpServer()).post(`/payment-receipts/${receipt.body.id}/void`).set(manager).send({ reason: 'test correction' }).expect(201);
    await request(app.getHttpServer()).get('/billing-summary?billingMonth=2026-09').set(finance).expect(200);
    await request(app.getHttpServer()).post('/billing-runs/2026-09').set(finance).expect(403);
  });
});
