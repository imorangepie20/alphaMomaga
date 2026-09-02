import { Injectable } from '@nestjs/common';
import type { Contract } from './contract.js';
import { validateContract } from './contract.js';

@Injectable()
export class ContractsService {
  private readonly contracts: Contract[] = [
    { id: 'contract-1', propertyId: 'property-1', tenantId: 'tenant-1', unit: 'A-101', monthlyRent: '₩1,200,000', startDate: '2026-01-01', endDate: '2027-08-31', status: 'Active' },
    { id: 'contract-2', propertyId: 'property-2', tenantId: 'tenant-2', unit: 'B-302', monthlyRent: '₩980,000', startDate: '2025-12-16', endDate: '2026-12-15', status: 'Active' },
    { id: 'contract-3', propertyId: 'property-3', tenantId: 'tenant-3', unit: 'C-205', monthlyRent: '₩1,540,000', startDate: '2026-03-10', endDate: '2027-03-09', status: 'Active' },
    { id: 'contract-4', propertyId: 'property-4', tenantId: 'tenant-4', unit: 'D-408', monthlyRent: '₩1,020,000', startDate: '2025-10-03', endDate: '2026-10-02', status: 'Active' },
  ];

  findAll(): Contract[] {
    this.contracts.forEach((contract) => validateContract(contract));
    return this.contracts;
  }
}