import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthenticatedPrincipal } from './principal.js';
import { AuthConfigService } from './auth-config.service.js';
import { getAuth0Role } from './auth0-role.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private authConfigService: AuthConfigService) {
    this.initializeJwks();
  }

  private initializeJwks(): void {
    const jwksUrl = this.authConfigService.getJwksUrl();
    if (jwksUrl) {
      try {
        this.jwksCache = createRemoteJWKSet(new URL(jwksUrl));
        this.logger.log(`JWKS initialized for provider: ${this.authConfigService.getProvider()}`);
      } catch (error) {
        this.logger.error('Failed to initialize JWKS', error);
      }
    }
  }

  async verifyBearerToken(header: string | undefined, allowUnassigned = false): Promise<AuthenticatedPrincipal> {
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A Bearer token is required');
    }

    const config = this.authConfigService.getConfig();
    if (!config) {
      throw new UnauthorizedException('JWT authentication is not configured');
    }

    try {
      if (!this.jwksCache) {
        throw new Error('JWKS is not initialized');
      }

      const { payload } = await jwtVerify(header.slice('Bearer '.length), this.jwksCache, {
        algorithms: ['RS256'],
        issuer: config.issuer,
        audience: config.audience,
      });

      const role = getAuth0Role(payload);
      if (typeof payload.sub !== 'string' || !payload.sub.trim() || (!role && !allowUnassigned)) {
        throw new UnauthorizedException('The token principal is invalid');
      }
      return { role: role ?? 'Pending', subject: payload.sub };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.debug('Bearer token verification failed', error);
      throw new UnauthorizedException('The Bearer token is invalid');
    }
  }

  getAuthProvider(): string {
    return this.authConfigService.getProvider() ?? 'unconfigured';
  }

  getEnvironment(): string {
    return this.authConfigService.getEnvironment();
  }
}
