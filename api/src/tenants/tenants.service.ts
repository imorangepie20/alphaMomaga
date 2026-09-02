import { Injectable } from '@nestjs/common';
import type { CreateTenantInput, Tenant } from './tenant.js';

@Injectable()
export class TenantsService {
  private readonly tenants: Tenant[] = [
    { id: 'tenant-1', name: 'Kim Jihoon', propertyId: 'property-1', unit: 'A-101', rent: '₩1,200,000', status: 'Paid' },
    { id: 'tenant-2', name: 'Park Minseo', propertyId: 'property-2', unit: 'B-302', rent: '₩980,000', status: 'Overdue' },
    { id: 'tenant-3', name: 'Lee Daeho', propertyId: 'property-3', unit: 'C-205', rent: '₩1,540,000', status: 'Paid' },
    { id: 'tenant-4', name: 'Choi Yuna', propertyId: 'property-4', unit: 'D-408', rent: '₩1,020,000', status: 'Pending' },
  ];

  findAll(): Tenant[] {
    return this.tenants;
  }

  create(input: CreateTenantInput): Tenant {
    if (!input.name || !input.propertyId || !input.unit || !/^₩[\d,]+$/.test(input.rent)) {
      throw new Error('Tenant name, property, unit, and a valid rent are required');
    }

    const tenant: Tenant = { id: `tenant-${this.tenants.length + 1}`, ...input };
    this.tenants.push(tenant);
    return tenant;
  }
}