import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthConfigService } from './auth-config.service.js';

describe('AuthConfigService', () => {
  let service: AuthConfigService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('with no configuration', () => {
    beforeEach(() => {
      process.env.AUTH_JWKS_URL = undefined;
      process.env.AUTH_ISSUER = undefined;
      service = new AuthConfigService();
    });

    it('should return null config when not configured', () => {
      expect(service.getConfig()).toBeNull();
      expect(service.isConfigured()).toBe(false);
    });

    it('should return development environment', () => {
      expect(service.getEnvironment()).toBe('development');
    });

    it('should return null for provider', () => {
      expect(service.getProvider()).toBeNull();
    });
  });

  describe('with Auth0 configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH_JWKS_URL = 'https://example.auth0.com/.well-known/jwks.json';
      process.env.AUTH_ISSUER = 'https://example.auth0.com/';
      process.env.AUTH_AUDIENCE = 'my-api';
      service = new AuthConfigService();
    });

    it('should detect Auth0 provider', () => {
      expect(service.getProvider()).toBe('auth0');
    });

    it('should be configured', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return production environment', () => {
      expect(service.getEnvironment()).toBe('production');
    });

    it('should disable demo role in production', () => {
      process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
      const newService = new AuthConfigService();
      expect(newService.isDemoModeEnabled()).toBe(false);
    });

    it('should return Auth0 configuration', () => {
      const config = service.getConfig();
      expect(config).toMatchObject({
        provider: 'auth0',
        jwksUrl: 'https://example.auth0.com/.well-known/jwks.json',
        issuer: 'https://example.auth0.com/',
        audience: 'my-api',
        environment: 'production',
      });
    });
  });

  describe('with Keycloak configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'staging';
      process.env.AUTH_JWKS_URL = 'https://keycloak.example.com/auth/realms/myrealm/.well-known/openid-configuration';
      process.env.AUTH_ISSUER = 'https://keycloak.example.com/auth/realms/myrealm';
      process.env.AUTH_AUDIENCE = 'myrealm';
      process.env.AUTH_ALLOW_DEMO_ROLE = 'true';
      service = new AuthConfigService();
    });

    it('should detect Keycloak provider', () => {
      expect(service.getProvider()).toBe('keycloak');
    });

    it('should enable demo role in staging', () => {
      expect(service.isDemoModeEnabled()).toBe(true);
    });

    it('should return staging environment', () => {
      expect(service.getEnvironment()).toBe('staging');
    });
  });

  describe('with Google configuration', () => {
    beforeEach(() => {
      process.env.AUTH_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
      process.env.AUTH_ISSUER = 'https://accounts.google.com';
      service = new AuthConfigService();
    });

    it('should detect Google provider', () => {
      expect(service.getProvider()).toBe('google');
    });
  });

  describe('with custom provider', () => {
    beforeEach(() => {
      process.env.AUTH_JWKS_URL = 'https://custom-auth.example.com/jwks';
      process.env.AUTH_ISSUER = 'https://custom-auth.example.com/';
      service = new AuthConfigService();
    });

    it('should detect as custom provider', () => {
      expect(service.getProvider()).toBe('custom');
    });

    it('should return default audience', () => {
      expect(service.getAudience()).toBe('default');
    });
  });
});
