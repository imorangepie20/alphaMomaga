import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Operational read authentication', () => {
  let app: INestApplication;
  const originalDemo = process.env.AUTH_ALLOW_DEMO_ROLE;
  beforeAll(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    if (originalDemo === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = originalDemo;
  });
  it.each(['properties', 'tenants', 'contracts', 'payments', 'maintenance', 'inspections'])(
    'protects GET and HEAD /%s while allowing an authenticated reader', async (resource) => {
      await request(app.getHttpServer()).get(`/${resource}`).expect(401);
      await request(app.getHttpServer()).head(`/${resource}`).expect(401);
      await request(app.getHttpServer()).get(`/${resource}`).set('x-demo-role', 'PropertyManager').expect(200);
    },
  );
});
