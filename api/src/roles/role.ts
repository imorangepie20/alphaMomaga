export type RoleName = 'Admin' | 'PropertyManager' | 'Finance' | 'Inspector';
export type Permission = 'portfolio:read' | 'property:manage' | 'tenant:manage' | 'contract:manage' | 'payment:manage' | 'billing:manage' | 'maintenance:manage' | 'inspection:manage' | 'user:manage' | 'report:read';

export type RoleDefinition = {
  name: RoleName;
  permissions: Permission[];
};

export const roleDefinitions: RoleDefinition[] = [
  { name: 'Admin', permissions: ['portfolio:read', 'property:manage', 'tenant:manage', 'contract:manage', 'payment:manage', 'billing:manage', 'maintenance:manage', 'inspection:manage', 'user:manage', 'report:read'] },
  { name: 'PropertyManager', permissions: ['portfolio:read', 'property:manage', 'tenant:manage', 'contract:manage', 'payment:manage', 'billing:manage', 'maintenance:manage', 'inspection:manage', 'report:read'] },
  { name: 'Finance', permissions: ['portfolio:read', 'payment:manage', 'report:read'] },
  { name: 'Inspector', permissions: ['portfolio:read', 'inspection:manage', 'report:read'] },
];
