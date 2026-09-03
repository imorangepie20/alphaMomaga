import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Property mutations authorization (e2e)', () => {
  let app: INestApplication<App>;
  const previousDemoSetting = process.env.AUTH_ALLOW_DEMO_ROLE;

  beforeEach(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('allows a property manager to create, update, and delete a property', async () => {
    const created = await request(app.getHttpServer())
      .post('/properties')
      .set('x-demo-role', 'PropertyManager')
      .send({ name: 'Browser Test Property', location: 'Seoul, KR', type: 'Apartment', occupancy: 40, status: 'Active' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .put(`/properties/${created.body.id}`)
      .set('x-demo-role', 'PropertyManager')
      .send({ name: 'Updated Browser Test Property', occupancy: 75 })
      .expect(200);

    expect(updated.body).toEqual(expect.objectContaining({
      id: created.body.id,
      name: 'Updated Browser Test Property',
      occupancy: '75%',
    }));

    await request(app.getHttpServer())
      .delete(`/properties/${created.body.id}`)
      .set('x-demo-role', 'PropertyManager')
      .expect(200);
  });

  it('rejects unauthenticated and unauthorized property mutations', async () => {
    await request(app.getHttpServer())
      .post('/properties')
      .send({ name: 'Unauthorized Property', location: 'Seoul, KR', type: 'Apartment' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/properties')
      .set('x-demo-role', 'Finance')
      .send({ name: 'Unauthorized Property', location: 'Seoul, KR', type: 'Apartment' })
      .expect(403);
  });

  afterEach(async () => {
    await app.close();
    if (previousDemoSetting === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previousDemoSetting;
  });
});