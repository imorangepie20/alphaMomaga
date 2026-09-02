import { Injectable, Optional } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { Contract } from './contract.js';
import { validateContract } from './contract.js';
import { contracts } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

type ContractRow = typeof contracts.$inferSelect;

export function mapContractRow(row: ContractRow): Contract {
  const contract: Contract = {
    id: row.id,
    propertyId: row.propertyId,
    tenantId: row.tenantId,
    unit: row.unit,
    monthlyRent: `₩${row.monthlyRentWon.toLocaleString('en-US')}`,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
  };
  if (row.terminatedAt) contract.terminatedAt = row.terminatedAt;
  return contract;
}

@Injectable()
export class ContractsService {
  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

  private readonly contracts: Contract[] = [
    { id: 'contract-1', propertyId: 'property-1', tenantId: 'tenant-1', unit: 'A-101', monthlyRent: '₩1,200,000', startDate: '2026-01-01', endDate: '2027-08-31', status: 'Active' },
    { id: 'contract-2', propertyId: 'property-2', tenantId: 'tenant-2', unit: 'B-302', monthlyRent: '₩980,000', startDate: '2025-12-16', endDate: '2026-12-15', status: 'Active' },
    { id: 'contract-3', propertyId: 'property-3', tenantId: 'tenant-3', unit: 'C-205', monthlyRent: '₩1,540,000', startDate: '2026-03-10', endDate: '2027-03-09', status: 'Active' },
    { id: 'contract-4', propertyId: 'property-4', tenantId: 'tenant-4', unit: 'D-408', monthlyRent: '₩1,020,000', startDate: '2025-10-03', endDate: '2026-10-02', status: 'Active' },
  ];

  async findAll(): Promise<Contract[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(contracts).orderBy(asc(contracts.id))).map(mapContractRow)
      : this.contracts;
    records.forEach((contract) => validateContract(contract));
    return records;
  }
}