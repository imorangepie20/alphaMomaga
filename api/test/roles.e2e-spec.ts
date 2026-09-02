import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Roles API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/admin/roles (GET) returns the server policy matrix', async () => {
    const response = await request(app.getHttpServer()).get('/admin/roles').expect(200);
    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toEqual(expect.objectContaining({ name: 'Admin', permissions: expect.arrayContaining(['user:manage']) }));
  });

  afterEach(async () => {
    await app.close();
  });
});