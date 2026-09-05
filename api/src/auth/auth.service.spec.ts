import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { AuthService } from './auth.service.js';
import { AuthConfigService } from './auth-config.service.js';

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => vi.fn()),
  jwtVerify: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let configService: AuthConfigService;

  beforeEach(() => {
    const originalEnv = process.env;
    process.env.NODE_ENV = 'development';
    process.env.AUTH_JWKS_URL = 'https://example.auth0.com/.well-known/jwks.json';
    process.env.AUTH_ISSUER = 'https://example.auth0.com/';
    process.env.AUTH_AUDIENCE = 'test-api';
    
    configService = new AuthConfigService();
    service = new AuthService(configService);
    
    process.env = originalEnv;
  });

  describe('verifyBearerToken', () => {
    it('allows unassigned identity only for approval status checks', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({ payload: { sub: 'auth0|new-user' } } as Awaited<ReturnType<typeof jwtVerify>>);
      await expect(service.verifyBearerToken('Bearer signed', true)).resolves.toEqual({ role: 'Pending', subject: 'auth0|new-user' });
      await expect(service.verifyBearerToken('Bearer signed')).rejects.toThrow(UnauthorizedException);
    });
    it('still rejects invalid signatures and missing subjects during approval checks', async () => {
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid signature'));
      await expect(service.verifyBearerToken('Bearer forged', true)).rejects.toThrow(UnauthorizedException);
      vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {} } as Awaited<ReturnType<typeof jwtVerify>>);
      await expect(service.verifyBearerToken('Bearer no-subject', true)).rejects.toThrow(UnauthorizedException);
    });
    it('maps a verified Auth0 namespaced role to an authenticated principal', async () => {
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: {
          sub: 'auth0|user-123',
          'https://alpha-momega.app/role': ['PropertyManager'],
        },
      } as Awaited<ReturnType<typeof jwtVerify>>);

      await expect(service.verifyBearerToken('Bearer signed.jwt.token')).resolves.toEqual({
        subject: 'auth0|user-123',
        role: 'PropertyManager',
      });
    });

    it('should throw UnauthorizedException when no Bearer token', async () => {
      expect(async () => {
        await service.verifyBearerToken(undefined);
      }).rejects.toThrow(UnauthorizedException);

      expect(async () => {
        await service.verifyBearerToken('Basic xyz');
      }).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      expect(async () => {
        await service.verifyBearerToken('Bearer invalid.token.format');
      }).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAuthProvider', () => {
    it('should return detected provider', () => {
      expect(service.getAuthProvider()).toBe('auth0');
    });
  });

  describe('getEnvironment', () => {
    it('should return current environment', () => {
      expect(service.getEnvironment()).toBe('development');
    });
  });

  describe('with unconfigured auth', () => {
    beforeEach(() => {
      const originalEnv = process.env;
      delete process.env.AUTH_JWKS_URL;
      delete process.env.AUTH_ISSUER;
      
      configService = new AuthConfigService();
      service = new AuthService(configService);
      
      process.env = originalEnv;
    });

    it('should throw UnauthorizedException when auth not configured', async () => {
      expect(async () => {
        await service.verifyBearerToken('Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQWRtaW4ifQ');
      }).rejects.toThrow(UnauthorizedException);
    });

    it('should return unconfigured provider', () => {
      expect(service.getAuthProvider()).toBe('unconfigured');
    });
  });
});
