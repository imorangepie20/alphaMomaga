import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Contracts API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/contracts (GET) returns lease lifecycle records', async () => {
    const response = await request(app.getHttpServer()).get('/contracts').expect(200);

    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      propertyId: expect.any(String),
      tenantId: expect.any(String),
      startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      status: 'Active',
    }));
  });

  afterEach(async () => {
    await app.close();
  });
});