import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Operations API (e2e)', () => {
  let app: INestApplication<App>;
  const previousDemoSetting = process.env.AUTH_ALLOW_DEMO_ROLE;

  beforeEach(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it.each(['/maintenance', '/inspections'])('%s returns operational records', async (route) => {
    const response = await request(app.getHttpServer()).get(route).expect(200);
    expect(response.body.length).toBeGreaterThanOrEqual(4);
    expect(response.body[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      propertyId: expect.any(String),
      status: expect.any(String),
    }));
  });

  it('allows a property manager to create and update maintenance', async () => {
    const created = await request(app.getHttpServer())
      .post('/maintenance')
      .set('x-demo-role', 'PropertyManager')
      .send({ propertyId: 'property-1', task: '보일러 점검', dueDate: '2026-12-01', status: 'Pending' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .put(`/maintenance/${created.body.id}`)
      .set('x-demo-role', 'PropertyManager')
      .send({ status: 'Scheduled' })
      .expect(200);

    expect(updated.body).toEqual(expect.objectContaining({
      id: created.body.id,
      status: 'Scheduled',
    }));
  });

  it('allows a property manager to create and update an inspection', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspections')
      .set('x-demo-role', 'PropertyManager')
      .send({ propertyId: 'property-1', type: '정기 안전 점검', scheduledDate: '2026-12-02', status: 'Pending', priority: 'Routine' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .put(`/inspections/${created.body.id}`)
      .set('x-demo-role', 'PropertyManager')
      .send({ status: 'Scheduled' })
      .expect(200);

    expect(updated.body).toEqual(expect.objectContaining({
      id: created.body.id,
      status: 'Scheduled',
    }));
  });

  it('rejects unauthenticated and unauthorized operation mutations', async () => {
    await request(app.getHttpServer())
      .post('/maintenance')
      .send({ propertyId: 'property-1', task: '보일러 점검', dueDate: '2026-12-01', status: 'Pending' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/inspections')
      .set('x-demo-role', 'Finance')
      .send({ propertyId: 'property-1', type: '정기 안전 점검', scheduledDate: '2026-12-02', status: 'Pending', priority: 'Routine' })
      .expect(403);
  });

  it('rejects invalid maintenance and inspection input', async () => {
    await request(app.getHttpServer())
      .post('/maintenance')
      .set('x-demo-role', 'PropertyManager')
      .send({ propertyId: 'property-1', task: '보일러 점검', dueDate: '2026-02-30', status: 'Pending' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/inspections')
      .set('x-demo-role', 'PropertyManager')
      .send({ propertyId: 'property-1', type: '정기 안전 점검', scheduledDate: '2026-02-30', status: 'Pending', priority: 'Routine' })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
    if (previousDemoSetting === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previousDemoSetting;
  });
});
