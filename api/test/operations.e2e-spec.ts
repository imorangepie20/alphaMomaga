import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Operations API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it.each(['/maintenance', '/inspections'])('%s returns operational records', async (route) => {
    const response = await request(app.getHttpServer()).get(route).expect(200);
    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      propertyId: expect.any(String),
      status: expect.any(String),
    }));
  });

  afterEach(async () => {
    await app.close();
  });
});