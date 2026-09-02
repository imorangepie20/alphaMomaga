import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthConfigService } from './auth-config.service.js';

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
