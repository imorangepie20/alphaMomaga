import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Payments API (e2e)', () => {
  let app: INestApplication<App>;
  const previousDemo = process.env.AUTH_ALLOW_DEMO_ROLE;

  beforeEach(async () => {
    process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/payments (GET) returns validated collection records', async () => {
    const response = await request(app.getHttpServer()).get('/payments').set('x-demo-role', 'PropertyManager').expect(200);

    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      propertyId: expect.any(String),
      contractId: expect.any(String),
      amount: expect.stringMatching(/^₩[\d,]+$/),
      dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      status: 'Paid',
    }));
  });

  afterEach(async () => {
    await app.close();
    if (previousDemo === undefined) delete process.env.AUTH_ALLOW_DEMO_ROLE;
    else process.env.AUTH_ALLOW_DEMO_ROLE = previousDemo;
  });
});
