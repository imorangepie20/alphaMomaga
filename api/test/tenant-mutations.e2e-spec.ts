import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { randomUUID } from 'node:crypto';

describe('Tenant mutations authorization (e2e)', () => {
  let app: INestApplication<App>;
  const previousDemoSetting = process.env.AUTH_ALLOW_DEMO_ROLE;

  beforeEach(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('allows a property manager to create a tenant', async () => {
    const unit = `A-${randomUUID().slice(0, 8)}`;
    const response = await request(app.getHttpServer())
      .post('/tenants')
      .set('x-demo-role', 'PropertyManager')
      .send({ name: 'Jung Sora', propertyId: 'property-1', unit, rent: '₩1,100,000' })
      .expect(201);

    expect(response.body).toEqual(expect.objectContaining({ name: 'Jung Sora', unit }));
    await request(app.getHttpServer()).delete(`/tenants/${response.body.id}`).set('x-demo-role', 'PropertyManager').expect(200);
  });

  it('denies finance users without tenant management permission', async () => {
    await request(app.getHttpServer())
      .post('/tenants')
      .set('x-demo-role', 'Finance')
      .send({ name: 'Jung Sora', propertyId: 'property-1', unit: 'A-202', rent: '₩1,100,000', status: 'Pending' })
      .expect(403);
  });

  it('rejects missing identity and invalid tenant input', async () => {
    await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'Jung Sora', propertyId: 'property-1', unit: 'A-202', rent: '₩1,100,000', status: 'Pending' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/tenants')
      .set('x-demo-role', 'PropertyManager')
      .send({ name: '', propertyId: 'property-1', unit: 'A-202', rent: 'bad', status: 'Pending' })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
    if (previousDemoSetting === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previousDemoSetting;
  });
});
