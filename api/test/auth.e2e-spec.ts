import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Auth boundary (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('returns the authenticated development principal', async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    await request(app.getHttpServer()).get('/auth/me').set('x-demo-role', 'PropertyManager').expect(200).expect({ role: 'PropertyManager', subject: 'demo:PropertyManager' });
  });

  it('rejects requests without a development principal', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});