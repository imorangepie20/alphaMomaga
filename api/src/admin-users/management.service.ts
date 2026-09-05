import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

type RemoteRole = { id: string; name: string };
type RemoteUser = { user_id: string; name?: string; email?: string; blocked?: boolean; email_verified?: boolean; last_login?: string };
const allowedRoles = ['Admin', 'PropertyManager', 'Finance', 'Inspector'];

@Injectable()
export class ManagementService {
  private token?: { value: string; expires: number };
  private tokenRequest?: Promise<string>;
  private mutations = new Set<string>();

  private async exclusive<T>(id: string, work: () => Promise<T>): Promise<T> {
    if (this.mutations.has(id)) throw new ConflictException('이 계정은 변경 중입니다. 완료 후 다시 조회해 주세요.');
    this.mutations.add(id);
    try { return await work(); } finally { this.mutations.delete(id); }
  }

  private config() {
    const domain = process.env.AUTH0_MANAGEMENT_DOMAIN;
    const client = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
    const secret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
    if (!domain || !/^[a-z0-9][a-z0-9.-]+\.auth0\.com$/i.test(domain) || !client || !secret) throw new ServiceUnavailableException('Auth0 Management API 설정이 필요합니다.');
    return { domain, client, secret };
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires > Date.now()) return this.token.value;
    if (this.tokenRequest) return this.tokenRequest;
    this.tokenRequest = (async () => {
      const { domain, client, secret } = this.config();
      const response = await fetch(`https://${domain}/oauth/token`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: client, client_secret: secret, audience: `https://${domain}/api/v2/` }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new ServiceUnavailableException('Auth0 관리 앱 자격 증명과 권한을 확인해 주세요.');
      const data = await response.json() as { access_token: string; expires_in: number };
      if (!data.access_token || !Number.isFinite(data.expires_in)) throw new BadGatewayException('Auth0 토큰 응답이 올바르지 않습니다.');
      this.token = { value: data.access_token, expires: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
      return data.access_token;
    })();
    try { return await this.tokenRequest; } finally { this.tokenRequest = undefined; }
  }

  private async call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    try {
      const { domain } = this.config();
      const options: RequestInit = { method, headers: { authorization: `Bearer ${await this.accessToken()}`, 'content-type': 'application/json' }, signal: AbortSignal.timeout(10000) };
      if (body !== undefined && method !== 'GET') options.body = JSON.stringify(body);
      const response = await fetch(`https://${domain}/api/v2/${path}`, options);
      if (!response.ok) {
        if (response.status === 401) this.token = undefined;
        if (response.status === 429) throw new HttpException('Auth0 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.', 429);
        if (response.status === 409) throw new ConflictException('이미 존재하는 계정입니다. 이메일로 조회해 주세요.');
        throw new BadGatewayException('Auth0 요청에 실패했습니다. 관리 앱 권한과 대상 계정을 확인해 주세요.');
      }
      return response.status === 204 ? undefined as T : await response.json() as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadGatewayException('Auth0 연결에 실패했습니다. 변경 결과를 다시 조회해 주세요.');
    }
  }

  private userPath(id: string) {
    if (typeof id !== 'string' || !id || id.length > 256) throw new BadRequestException('계정 식별자가 올바르지 않습니다.');
    return `users/${encodeURIComponent(id)}`;
  }

  private async userRoles(id: string): Promise<RemoteRole[]> {
    const roles = await this.call<RemoteRole[]>(`${this.userPath(id)}/roles?per_page=100`);
    if (roles.length >= 100) throw new ConflictException('역할이 많은 계정은 Auth0 콘솔에서 관리해 주세요.');
    return roles;
  }

  private async actor(subject: string) {
    const user = await this.call<RemoteUser>(this.userPath(subject));
    const roles = await this.userRoles(subject);
    if (user.blocked || !roles.some((role) => role.name === 'Admin')) throw new ForbiddenException('현재 Auth0 관리자 권한이 필요합니다.');
  }

  private async editable(subject: string, id: string) {
    if (subject === id) throw new ForbiddenException('본인 계정은 이 화면에서 변경할 수 없습니다.');
    const roles = await this.userRoles(id);
    if (roles.some((role) => role.name === 'Admin')) throw new ForbiddenException('기존 관리자 계정 변경은 Auth0 관리 콘솔에서 처리해 주세요.');
    return roles;
  }

  async roles(subject: string) {
    await this.actor(subject);
    const result: RemoteRole[] = [];
    for (let page = 0; page < 10; page++) {
      const batch = await this.call<RemoteRole[]>(`roles?per_page=100&page=${page}`);
      result.push(...batch);
      if (batch.length < 100) return result.filter((role) => allowedRoles.includes(role.name));
    }
    throw new ServiceUnavailableException('역할이 너무 많아 안전하게 조회할 수 없습니다.');
  }

  async list(subject: string, page: number, email?: string) {
    await this.actor(subject);
    if (!Number.isInteger(page) || page < 0 || page > 49) throw new BadRequestException('페이지 범위를 벗어났습니다. 이메일로 조회해 주세요.');
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new BadRequestException('정확한 이메일 주소를 입력해 주세요.');
    const data = email
      ? { users: await this.call<RemoteUser[]>(`users-by-email?email=${encodeURIComponent(email)}`), total: 0 }
      : await this.call<{ users: RemoteUser[]; total: number }>(`users?include_totals=true&page=${page}&per_page=20&sort=created_at:-1&fields=user_id,name,email,blocked,email_verified,last_login&include_fields=true`);
    const users = [];
    for (const user of data.users) users.push({ user_id: user.user_id, name: user.name, email: user.email, blocked: user.blocked === true, email_verified: user.email_verified === true, last_login: user.last_login, roles: await this.userRoles(user.user_id) });
    return { users, total: email ? users.length : data.total, page, pageSize: 20, subject };
  }

  async block(subject: string, id: string, blocked: unknown) {
    return this.exclusive(id, () => this.changeBlock(subject, id, blocked));
  }

  private async changeBlock(subject: string, id: string, blocked: unknown) {
    await this.actor(subject);
    if (typeof blocked !== 'boolean') throw new BadRequestException('차단 상태가 올바르지 않습니다.');
    await this.editable(subject, id);
    await this.call(this.userPath(id), 'PATCH', { blocked });
    return { ok: true };
  }

  async setRole(subject: string, id: string, roleId: unknown) {
    return this.exclusive(id, () => this.changeRole(subject, id, roleId));
  }

  private async changeRole(subject: string, id: string, roleId: unknown) {
    const available = await this.roles(subject);
    if (typeof roleId !== 'string' || !available.some((role) => role.id === roleId && role.name !== 'Admin')) throw new BadRequestException('운영 역할을 선택해 주세요. 관리자 승격은 Auth0 콘솔에서 처리합니다.');
    const oldRoles = await this.editable(subject, id);
    if (oldRoles.length === 1 && oldRoles[0].id === roleId) return { ok: true };
    if (oldRoles.some((role) => !allowedRoles.includes(role.name))) throw new ConflictException('다른 앱의 역할이 있는 계정은 Auth0 콘솔에서 변경해 주세요.');
    const user = await this.call<RemoteUser>(this.userPath(id));
    await this.call(this.userPath(id), 'PATCH', { blocked: true });
    try {
      if (oldRoles.length) await this.call(`${this.userPath(id)}/roles`, 'DELETE', { roles: oldRoles.map((role) => role.id) });
      await this.call(`${this.userPath(id)}/roles`, 'POST', { roles: [roleId] });
      await this.call(this.userPath(id), 'PATCH', { blocked: user.blocked === true });
    } catch {
      throw new BadGatewayException('역할 변경이 완결되지 않았습니다. 계정을 차단 상태로 유지합니다. Auth0 콘솔에서 역할을 확인한 뒤 차단 해제해 주세요.');
    }
    return { ok: true };
  }

  async invite(subject: string, input: { email?: unknown; roleId?: unknown }) {
    const roles = await this.roles(subject);
    const connection = process.env.AUTH0_MANAGEMENT_CONNECTION;
    const clientId = process.env.AUTH0_INVITATION_CLIENT_ID;
    if (!connection || !clientId) throw new ServiceUnavailableException('초대용 데이터베이스 연결과 웹 앱 Client ID 설정이 필요합니다.');
    if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new BadRequestException('이메일 주소를 확인해 주세요.');
    if (!roles.some((role) => role.id === input.roleId && role.name !== 'Admin')) throw new BadRequestException('초대할 운영 역할을 선택해 주세요.');
    const user = await this.call<RemoteUser>('users', 'POST', { connection, email: input.email, password: `Aa1!${randomBytes(32).toString('base64url')}`, email_verified: false, verify_email: false, blocked: true });
    try {
      await this.call(`${this.userPath(user.user_id)}/roles`, 'POST', { roles: [input.roleId] });
      const ticket = await this.call<{ ticket: string }>('tickets/password-change', 'POST', { user_id: user.user_id, client_id: clientId, ttl_sec: 86400, mark_email_as_verified: false });
      await this.call(this.userPath(user.user_id), 'PATCH', { blocked: false });
      return { ticket: ticket.ticket, userId: user.user_id };
    } catch { throw new BadGatewayException('계정은 생성되었으나 초대 준비에 실패했습니다. 같은 이메일로 다시 생성하지 말고 Auth0 콘솔에서 계정을 확인해 주세요.'); }
  }
}
