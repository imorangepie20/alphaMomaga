import { afterEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadEnvironmentFile } from './load-environment.js';

const fixturePath = fileURLToPath(new URL('../../test/fixtures/auth.env', import.meta.url));
const authKeys = ['AUTH_JWKS_URL', 'AUTH_ISSUER', 'AUTH_AUDIENCE', 'AUTH_ALLOW_DEMO_ROLE'] as const;

describe('loadEnvironmentFile', () => {
  afterEach(() => {
    for (const key of authKeys) {
      delete process.env[key];
    }
  });

  it('loads Auth0 configuration from the supplied env file', () => {
    loadEnvironmentFile(fixturePath);

    expect(process.env.AUTH_JWKS_URL).toBe('https://dev-u1feezhev3peemey.us.auth0.com/.well-known/jwks.json');
    expect(process.env.AUTH_ISSUER).toBe('https://dev-u1feezhev3peemey.us.auth0.com/');
    expect(process.env.AUTH_AUDIENCE).toBe('https://api.approid.team/');
    expect(process.env.AUTH_ALLOW_DEMO_ROLE).toBe('false');
  });

  it('does not override values supplied by the process environment', () => {
    process.env.AUTH_AUDIENCE = 'deployment-value';

    loadEnvironmentFile(fixturePath);

    expect(process.env.AUTH_AUDIENCE).toBe('deployment-value');
  });
});
