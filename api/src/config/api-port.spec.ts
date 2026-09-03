import { describe, expect, it } from 'vitest';
import { getApiPort } from './api-port.js';

describe('getApiPort', () => {
  it('uses the Cloudflare API origin port when PORT is not set', () => {
    expect(getApiPort(undefined)).toBe(3100);
  });

  it('preserves an explicitly configured deployment port', () => {
    expect(getApiPort('8080')).toBe(8080);
  });
});
