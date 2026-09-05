import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthConfigService } from '../src/auth/auth-config.service.js';
import { DatabaseService } from '../src/database/database.service.js';

describe('Account approval with signed tokens', () => {
  let app: INestApplication;
  let jwks: Server;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
  const issuer = 'https://approval-test.invalid/';
  const audience = 'approval-test-api';

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey;
    const key = { ...await exportJWK(keys.publicKey), kid: 'approval-test', alg: 'RS256', use: 'sig' };
    jwks = createServer((_req, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ keys: [key] }));
    });
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    const jwksUrl = `http://127.0.0.1:${(jwks.address() as AddressInfo).port}/jwks`;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue({ client: undefined })
      .overrideProvider(AuthConfigService).useValue({
        getJwksUrl: () => jwksUrl,
        getConfig: () => ({ issuer, audience }),
        getProvider: () => 'custom',
        getEnvironment: () => 'test',
      }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
    if (jwks) await new Promise<void>((resolve, reject) => jwks.close((error) => error ? reject(error) : resolve()));
  });

  function token(roles: string[] = [], options: { issuer?: string; audience?: string; expires?: string; key?: typeof privateKey } = {}) {
    return new SignJWT({ 'https://alpha-momega.app/role': roles })
      .setProtectedHeader({ alg: 'RS256', kid: 'approval-test' })
      .setSubject('auth0|approval-test-user').setIssuer(options.issuer ?? issuer)
      .setAudience(options.audience ?? audience).setIssuedAt()
      .setExpirationTime(options.expires ?? '5m').sign(options.key ?? privateKey);
  }

  it('allows a pending user to check status but not read or mutate business data', async () => {
    const bearer = `Bearer ${await token()}`;
    await request(app.getHttpServer()).get('/auth/status').set('authorization', bearer).expect(200).expect({ status: 'pending' });
    for (const path of ['/properties', '/tenants', '/contracts', '/payments', '/monthly-charges', '/billing-summary', '/payment-receipts', '/maintenance', '/inspections', '/auth/me']) {
      await request(app.getHttpServer()).get(path).set('authorization', bearer).expect(401);
    }
    await request(app.getHttpServer()).post('/maintenance').set('authorization', bearer)
      .send({ propertyId: 'property-1', task: 'Must not be created', dueDate: '2026-09-10', status: 'Pending' }).expect(401);
  });

  it('accepts a newly issued approved token while the older token remains pending', async () => {
    const oldToken = await token();
    const approved = `Bearer ${await token(['PropertyManager'])}`;
    await request(app.getHttpServer()).get('/auth/status').set('authorization', approved).expect(200).expect({ status: 'approved' });
    await request(app.getHttpServer()).get('/properties').set('authorization', approved).expect(200);
    await request(app.getHttpServer()).get('/auth/status').set('authorization', `Bearer ${oldToken}`).expect(200).expect({ status: 'pending' });
  });

  it('rejects forged, expired and incorrectly scoped tokens even for status checks', async () => {
    const other = await generateKeyPair('RS256');
    for (const invalid of [await token([], { key: other.privateKey }), await token([], { expires: '-1m' }), await token([], { audience: 'other-api' }), await token([], { issuer: 'https://other.invalid/' })]) {
      await request(app.getHttpServer()).get('/auth/status').set('authorization', `Bearer ${invalid}`).expect(401);
    }
    await request(app.getHttpServer()).get('/auth/status').expect(401);
  });
});
