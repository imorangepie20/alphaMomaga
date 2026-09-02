import { Injectable } from '@nestjs/common';
import type { Tenant } from './tenant.js';

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
}