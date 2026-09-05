import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Property lifecycle simulation (e2e)', () => {
  let app: INestApplication<App>;
  const previousDemoSetting = process.env.AUTH_ALLOW_DEMO_ROLE;
  const manager = { 'x-demo-role': 'PropertyManager' };
  const prefix = 'SIM-20260904-';

  beforeEach(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    // Keep the server alive across concurrent Supertest requests.
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    await app.close();
    if (previousDemoSetting === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previousDemoSetting;
  });

  it('creates, progresses, reads, and cleans up a complete property lifecycle', async () => {
    const property = await request(app.getHttpServer())
      .post('/properties')
      .set(manager)
      .send({
        name: prefix + '한강 리버뷰',
        location: 'Seoul, KR',
        type: 'Apartment',
        occupancy: 0,
        status: 'Active',
      })
      .expect(201);

    const tenant = await request(app.getHttpServer())
      .post('/tenants')
      .set(manager)
      .send({
        name: prefix + '김하늘',
        propertyId: property.body.id,
        unit: 'A-901',
        rent: '₩1,200,000',
        status: 'Pending',
      })
      .expect(201);

    const contract = await request(app.getHttpServer())
      .post('/contracts')
      .set(manager)
      .send({
        propertyId: property.body.id,
        tenantId: tenant.body.id,
        unit: 'A-901',
        monthlyRent: '₩1,200,000',
        startDate: '2026-09-01',
        endDate: '2027-08-31',
        status: 'Active',
      })
      .expect(201);

    const payment = await request(app.getHttpServer())
      .post('/payments')
      .set(manager)
      .send({
        propertyId: property.body.id,
        contractId: contract.body.id,
        amount: '₩1,200,000',
        dueDate: '2026-09-05',
        status: 'Pending',
      })
      .expect(201);

    const paidPayment = await request(app.getHttpServer())
      .put('/payments/' + payment.body.id)
      .set(manager)
      .send({ status: 'Paid', paidAt: '2026-09-05' })
      .expect(200);
    expect(paidPayment.body).toEqual(expect.objectContaining({
      id: payment.body.id,
      status: 'Paid',
      paidAt: '2026-09-05',
    }));

    const maintenance = await request(app.getHttpServer())
      .post('/maintenance')
      .set(manager)
      .send({
        propertyId: property.body.id,
        task: prefix + '보일러 점검',
        dueDate: '2026-09-05',
        status: 'Pending',
      })
      .expect(201);
    await request(app.getHttpServer())
      .put('/maintenance/' + maintenance.body.id)
      .set(manager)
      .send({ status: 'Scheduled' })
      .expect(200);
    const completedMaintenance = await request(app.getHttpServer())
      .put('/maintenance/' + maintenance.body.id)
      .set(manager)
      .send({ status: 'Completed' })
      .expect(200);
    expect(completedMaintenance.body.status).toBe('Completed');

    const inspection = await request(app.getHttpServer())
      .post('/inspections')
      .set(manager)
      .send({
        propertyId: property.body.id,
        type: prefix + '정기 안전 점검',
        scheduledDate: '2026-09-02',
        status: 'Pending',
        priority: 'Routine',
      })
      .expect(201);
    await request(app.getHttpServer())
      .put('/inspections/' + inspection.body.id)
      .set(manager)
      .send({ status: 'Scheduled' })
      .expect(200);
    const completedInspection = await request(app.getHttpServer())
      .put('/inspections/' + inspection.body.id)
      .set(manager)
      .send({ status: 'Completed', completedAt: '2026-09-03' })
      .expect(200);
    expect(completedInspection.body.status).toBe('Completed');

    const [properties, tenants, contracts, payments, maintenanceRecords, inspections] = await Promise.all([
      request(app.getHttpServer()).get('/properties').set('x-demo-role', 'PropertyManager').expect(200),
      request(app.getHttpServer()).get('/tenants').set('x-demo-role', 'PropertyManager').expect(200),
      request(app.getHttpServer()).get('/contracts').set('x-demo-role', 'PropertyManager').expect(200),
      request(app.getHttpServer()).get('/payments').set('x-demo-role', 'PropertyManager').expect(200),
      request(app.getHttpServer()).get('/maintenance').set('x-demo-role', 'PropertyManager').expect(200),
      request(app.getHttpServer()).get('/inspections').set('x-demo-role', 'PropertyManager').expect(200),
    ]);
    expect(properties.body).toContainEqual(expect.objectContaining({ id: property.body.id }));
    expect(tenants.body).toContainEqual(expect.objectContaining({ id: tenant.body.id, propertyId: property.body.id }));
    expect(contracts.body).toContainEqual(expect.objectContaining({ id: contract.body.id, tenantId: tenant.body.id }));
    expect(payments.body).toContainEqual(expect.objectContaining({ id: payment.body.id, status: 'Paid' }));
    expect(maintenanceRecords.body).toContainEqual(expect.objectContaining({ id: maintenance.body.id, status: 'Completed' }));
    expect(inspections.body).toContainEqual(expect.objectContaining({ id: inspection.body.id, status: 'Completed' }));

    await request(app.getHttpServer()).delete('/payments/' + payment.body.id).set(manager).expect(200);
    await request(app.getHttpServer()).delete('/contracts/' + contract.body.id).set(manager).expect(200);
    await request(app.getHttpServer()).delete('/maintenance/' + maintenance.body.id).set(manager).expect(200);
    await request(app.getHttpServer()).delete('/inspections/' + inspection.body.id).set(manager).expect(200);
    await request(app.getHttpServer()).delete('/tenants/' + tenant.body.id).set(manager).expect(200);
    await request(app.getHttpServer()).delete('/properties/' + property.body.id).set(manager).expect(200);
  });

  it('rejects missing parents, unauthenticated requests, and unauthorized roles', async () => {
    await request(app.getHttpServer())
      .post('/contracts')
      .set(manager)
      .send({
        propertyId: 'missing-property',
        tenantId: 'missing-tenant',
        unit: 'Z-999',
        monthlyRent: '₩1,000,000',
        startDate: '2026-09-01',
        endDate: '2027-08-31',
        status: 'Active',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/payments')
      .set(manager)
      .send({
        propertyId: 'property-1',
        contractId: 'missing-contract',
        amount: '₩1,000,000',
        dueDate: '2026-09-05',
        status: 'Pending',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/maintenance')
      .set('x-demo-role', 'Finance')
      .send({
        propertyId: 'property-1',
        task: prefix + '권한 확인',
        dueDate: '2026-09-05',
        status: 'Pending',
      })
      .expect(403);
    await request(app.getHttpServer())
      .post('/inspections')
      .send({
        propertyId: 'property-1',
        type: prefix + '무인 점검',
        scheduledDate: '2026-09-02',
        status: 'Pending',
        priority: 'Routine',
      })
      .expect(401);

    await request(app.getHttpServer())
      .delete('/payments/payment-1')
      .expect(401);
  });
});
