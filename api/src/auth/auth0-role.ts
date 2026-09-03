import type { JWTPayload } from 'jose';
import type { RoleName } from '../roles/role.js';

const claimName = 'https://alpha-momega.app/role';
const allowedRoles: RoleName[] = ['Admin', 'PropertyManager', 'Finance', 'Inspector'];

export function getAuth0Role(payload: JWTPayload): RoleName | null {
  const roles = payload[claimName];
  if (!Array.isArray(roles)) return null;
  return roles.find((value): value is RoleName =>
    typeof value === 'string' && allowedRoles.includes(value as RoleName),
  ) ?? null;
}
