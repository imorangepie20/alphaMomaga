import { describe, expect, it } from 'vitest';
import { getAuth0Role } from './auth0-role.js';

describe('getAuth0Role', () => {
  it('returns the first allowed namespaced Auth0 role', () => {
    expect(getAuth0Role({ 'https://alpha-momega.app/role': ['Admin'] })).toBe('Admin');
  });

  it('returns null for missing and unapproved roles', () => {
    expect(getAuth0Role({})).toBeNull();
    expect(getAuth0Role({ 'https://alpha-momega.app/role': ['Owner'] })).toBeNull();
  });
});
