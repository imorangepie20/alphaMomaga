import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ManagementService } from './management.service.js';

beforeEach(() => {
  vi.stubEnv('AUTH0_MANAGEMENT_DOMAIN', 'example.us.auth0.com');
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_ID', 'client');
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_SECRET', 'secret');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function mockRemote(failAssignment = false) {
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/oauth/token')) return Response.json({ access_token: 'private-management-token', expires_in: 3600 });
    if (url.endsWith('/users/actor')) return Response.json({ user_id: 'actor', blocked: false });
    if (url.includes('/users/actor/roles')) return Response.json([{ id: 'admin', name: 'Admin' }]);
    if (url.includes('/api/v2/roles?')) return Response.json([{ id: 'admin', name: 'Admin' }, { id: 'finance', name: 'Finance' }]);
    if (url.includes('/users/target/roles?')) return Response.json([{ id: 'old', name: 'Inspector' }]);
    if (url.endsWith('/users/target/roles') && init?.method === 'POST' && failAssignment) return Response.json({}, { status: 500 });
    if (url.endsWith('/users/target') && (!init?.method || init.method === 'GET')) return Response.json({ user_id: 'target', blocked: false });
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

it('fails safely without Management credentials', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_SECRET', '');
  await expect(new ManagementService().roles('actor')).rejects.toThrow('설정이 필요');
});
it('does not allow self blocking', async () => {
  const remote = mockRemote();
  await expect(new ManagementService().block('actor', 'actor', true)).rejects.toThrow('본인');
  expect(remote.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
});
it('does not permit administrator promotion', async () => {
  mockRemote();
  await expect(new ManagementService().setRole('actor', 'target', 'admin')).rejects.toThrow('관리자 승격');
});
it('replaces the role while blocked then restores the previous block state', async () => {
  const remote = mockRemote();
  await new ManagementService().setRole('actor', 'target', 'finance');
  const writes = remote.mock.calls.filter(([, init]) => ['PATCH', 'DELETE', 'POST'].includes(init?.method ?? '') && !String(init?.body).includes('client_credentials'));
  expect(writes.map(([, init]) => init?.method)).toEqual(['PATCH', 'DELETE', 'POST', 'PATCH']);
  expect(writes.at(-1)?.[1]?.body).toBe(JSON.stringify({ blocked: false }));
  expect(remote.mock.calls.filter(([url]) => url.endsWith('/oauth/token'))).toHaveLength(1);
});
it('does not unblock a partially failed role replacement', async () => {
  const remote = mockRemote(true);
  await expect(new ManagementService().setRole('actor', 'target', 'finance')).rejects.toThrow('차단 상태');
  expect(remote.mock.calls.some(([, init]) => init?.body === JSON.stringify({ blocked: false }))).toBe(false);
});
it('rechecks live administrator state rather than trusting an old JWT', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/oauth/token') ? Response.json({ access_token: 'token', expires_in: 3600 }) : url.includes('/roles?') ? Response.json([]) : Response.json({ blocked: true })));
  await expect(new ManagementService().roles('actor')).rejects.toThrow('관리자 권한');
});
it('protects existing administrator targets', async () => {
  const remote = mockRemote();
  const original = remote.getMockImplementation()!;
  remote.mockImplementation(async (url, init) => url.includes('/users/target/roles?') ? Response.json([{ id: 'admin', name: 'Admin' }]) : original(url, init));
  await expect(new ManagementService().block('actor', 'target', true)).rejects.toThrow('기존 관리자');
  expect(remote.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
});
it('creates invitation without asserting email verification or sending an email', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_CONNECTION', 'database');
  vi.stubEnv('AUTH0_INVITATION_CLIENT_ID', 'web-client');
  const remote = mockRemote();
  const original = remote.getMockImplementation()!;
  remote.mockImplementation(async (url, init) => {
    if (url.endsWith('/api/v2/users') && init?.method === 'POST') return Response.json({ user_id: 'new-user' });
    if (url.endsWith('/tickets/password-change')) return Response.json({ ticket: 'https://example.us.auth0.com/reset/example' });
    return original(url, init);
  });
  const result = await new ManagementService().invite('actor', { email: 'new@example.test', roleId: 'finance' });
  expect(result.ticket).toContain('/reset/');
  const create = remote.mock.calls.find(([url]) => url.endsWith('/api/v2/users'));
  expect(JSON.parse(String(create?.[1]?.body))).toMatchObject({ blocked: true, email_verified: false, verify_email: false });
  const ticket = remote.mock.calls.find(([url]) => url.endsWith('/tickets/password-change'));
  expect(JSON.parse(String(ticket?.[1]?.body))).toMatchObject({ client_id: 'web-client', ttl_sec: 86400, mark_email_as_verified: false });
});
