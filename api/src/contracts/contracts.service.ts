import { Injectable, Optional } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Contract, CreateContractInput, UpdateContractInput } from './contract.js';
import { validateContract } from './contract.js';
import { contracts } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';

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
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

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

  async create(input: CreateContractInput, principal?: AuthenticatedPrincipal): Promise<Contract> {
    if (!input.propertyId || !input.tenantId || !input.unit || !input.monthlyRent || !input.startDate || !input.endDate || !input.status) {
      throw new Error('Contract requires propertyId, tenantId, unit, monthlyRent, startDate, endDate, and status');
    }

    const monthlyRentWon = this.parseRent(input.monthlyRent);
    const contractToValidate: Contract = {
      id: `contract-temp`,
      ...input,
      monthlyRent: `₩${monthlyRentWon.toLocaleString('en-US')}`,
    };
    validateContract(contractToValidate);

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction.insert(contracts).values({
          id: `contract-${randomUUID()}`,
          propertyId: input.propertyId,
          tenantId: input.tenantId,
          unit: input.unit,
          monthlyRentWon,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
        }).returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'contract.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'contract',
            entityId: row.id,
            metadata: { propertyId: input.propertyId, tenantId: input.tenantId, unit: input.unit },
          });
        }

        return mapContractRow(row);
      });
    }

    const contract: Contract = {
      id: `contract-${this.contracts.length + 1}`,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      unit: input.unit,
      monthlyRent: `₩${monthlyRentWon.toLocaleString('en-US')}`,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
    };
    this.contracts.push(contract);
    return contract;
  }

  async update(id: string, input: UpdateContractInput, principal?: AuthenticatedPrincipal): Promise<Contract> {
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction
          .update(contracts)
          .set({
            ...(input.status !== undefined && { status: input.status }),
            ...(input.terminatedAt !== undefined && { terminatedAt: input.terminatedAt }),
          })
          .where(eq(contracts.id, id))
          .returning();

        if (!row) {
          throw new Error(`Contract ${id} not found`);
        }

        const contract = mapContractRow(row);
        validateContract(contract);

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'contract.updated',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'contract',
            entityId: id,
            metadata: { changes: input },
          });
        }

        return contract;
      });
    }

    const contract = this.contracts.find((c) => c.id === id);
    if (!contract) {
      throw new Error(`Contract ${id} not found`);
    }

    if (input.status !== undefined) contract.status = input.status;
    if (input.terminatedAt !== undefined) contract.terminatedAt = input.terminatedAt;

    validateContract(contract);
    return contract;
  }

  private parseRent(rent: string): number {
    if (!/^₩(?:0|[1-9]\d{0,2}(?:,\d{3})+)$/.test(rent)) {
      throw new Error('Contract monthly rent must be a positive won amount such as ₩1,200,000');
    }

    const rentWon = Number.parseInt(rent.replaceAll(',', '').slice(1), 10);
    if (!Number.isSafeInteger(rentWon) || rentWon <= 0) {
      throw new Error('Contract monthly rent must be a positive won amount');
    }
    return rentWon;
  }
}