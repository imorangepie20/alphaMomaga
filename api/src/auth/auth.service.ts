import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthenticatedPrincipal } from './principal.js';
import type { RoleName } from '../roles/role.js';

const roleNames: RoleName[] = ['Admin', 'PropertyManager', 'Finance', 'Inspector'];

@Injectable()
export class AuthService {
  async verifyBearerToken(header: string | undefined): Promise<AuthenticatedPrincipal> {
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A Bearer token is required');
    }

    const jwksUrl = process.env.AUTH_JWKS_URL;
    const issuer = process.env.AUTH_ISSUER;
    const audience = process.env.AUTH_AUDIENCE;
    if (!jwksUrl || !issuer || !audience) {
      throw new UnauthorizedException('JWT authentication is not configured');
    }

    try {
      const jwks = createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(header.slice('Bearer '.length), jwks, {
        algorithms: ['RS256'],
        issuer,
        audience,
      });
      const role = typeof payload.role === 'string' ? payload.role : undefined;
      if (typeof payload.sub !== 'string' || !role || !roleNames.includes(role as RoleName)) {
        throw new UnauthorizedException('The token principal is invalid');
      }
      return { role, subject: payload.sub };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('The Bearer token is invalid');
    }
  }
}