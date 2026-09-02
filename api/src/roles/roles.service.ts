import { Injectable } from '@nestjs/common';
import { roleDefinitions, type Permission, type RoleName } from './role.js';

@Injectable()
export class RolesService {
  findAll() {
    return roleDefinitions;
  }

  can(role: RoleName, permission: Permission): boolean {
    return roleDefinitions.find((definition) => definition.name === role)?.permissions.includes(permission) ?? false;
  }
}