import { Injectable, Optional } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type {
  Contract,
  ContractStatus,
  CreateContractInput,
  RenewContractInput,
  UpdateContractInput,
} from './contract.js';
import { validateContract } from './contract.js';
import { contracts, properties, tenants } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';
import { InMemoryReferenceRegistry } from '../domain/in-memory-reference-registry.service.js';

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

function utcCalendarDay(referenceDate: Date): string {
  return referenceDate.toISOString().slice(0, 10);
}

function calendarDayAfter(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function synchronizedStatus(
  contract: Contract,
  referenceDate: Date,
): ContractStatus {
  const today = utcCalendarDay(referenceDate);
  let status = contract.status;
  if (status === 'Upcoming' && contract.startDate <= today) {
    status = 'Active';
  }
  if (status === 'Active' && contract.endDate < today) {
    status = 'Expired';
  }
  return status;
}

@Injectable()
export class ContractsService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly references?: InMemoryReferenceRegistry,
  ) {}

  private readonly contracts: Contract[] = [
    {
      id: 'contract-1',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      unit: 'A-101',
      monthlyRent: '₩1,200,000',
      startDate: '2026-01-01',
      endDate: '2027-08-31',
      status: 'Active',
    },
    {
      id: 'contract-2',
      propertyId: 'property-2',
      tenantId: 'tenant-2',
      unit: 'B-302',
      monthlyRent: '₩980,000',
      startDate: '2025-12-16',
      endDate: '2026-12-15',
      status: 'Active',
    },
    {
      id: 'contract-3',
      propertyId: 'property-3',
      tenantId: 'tenant-3',
      unit: 'C-205',
      monthlyRent: '₩1,540,000',
      startDate: '2026-03-10',
      endDate: '2027-03-09',
      status: 'Active',
    },
    {
      id: 'contract-4',
      propertyId: 'property-4',
      tenantId: 'tenant-4',
      unit: 'D-408',
      monthlyRent: '₩1,020,000',
      startDate: '2025-10-03',
      endDate: '2026-10-02',
      status: 'Active',
    },
  ];

  async findAll(referenceDate = new Date()): Promise<Contract[]> {
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) =>
        this.synchronizeDatabaseContracts(transaction, referenceDate),
      );
    }

    this.synchronizeInMemoryContracts(referenceDate);
    return this.contracts;
  }

  async create(
    input: CreateContractInput,
    principal?: AuthenticatedPrincipal,
    referenceDate = new Date(),
  ): Promise<Contract> {
    this.assertCreateInput(input);
    const contractToCreate = this.buildContract(input, referenceDate);
    const database = this.databaseService?.client;

    if (database) {
      return database.transaction(async (transaction) => {
        await this.lockContractInterval(transaction, contractToCreate);
        const currentContracts = await this.synchronizeDatabaseContracts(
          transaction,
          referenceDate,
        );
        this.assertNoOverlappingContract(contractToCreate, currentContracts);

        const [propertyExists] = await transaction
          .select()
          .from(properties)
          .where(eq(properties.id, input.propertyId))
          .limit(1);
        if (!propertyExists) {
          throw new Error(`Property ${input.propertyId} not found`);
        }

        const [tenantExists] = await transaction
          .select()
          .from(tenants)
          .where(eq(tenants.id, input.tenantId))
          .limit(1);
        if (!tenantExists) {
          throw new Error(`Tenant ${input.tenantId} not found`);
        }

        const [row] = await transaction
          .insert(contracts)
          .values(this.toContractRow(contractToCreate))
          .returning();

        await this.recordAudit(transaction, {
          action: 'contract.created',
          principal,
          entityId: row.id,
          metadata: {
            propertyId: input.propertyId,
            tenantId: input.tenantId,
            unit: input.unit,
          },
        });

        return mapContractRow(row);
      });
    }

    this.synchronizeInMemoryContracts(referenceDate);
    if (this.references) {
      this.references.assertContractReference(input.propertyId, input.tenantId);
    } else {
      this.assertFixtureReferences(input);
    }
    this.assertNoOverlappingContract(contractToCreate, this.contracts);
    this.contracts.push(contractToCreate);
    this.references?.registerContract(contractToCreate.id, contractToCreate.propertyId);
    return contractToCreate;
  }

  async update(
    id: string,
    input: UpdateContractInput,
    principal?: AuthenticatedPrincipal,
    referenceDate = new Date(),
  ): Promise<Contract> {
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const currentContracts = await this.synchronizeDatabaseContracts(
          transaction,
          referenceDate,
        );
        const existing = this.findRequiredContract(id, currentContracts);
        const updated = {
          ...existing,
          ...(input.status !== undefined && { status: input.status }),
          ...(input.terminatedAt !== undefined && {
            terminatedAt: input.terminatedAt,
          }),
        };
        validateContract(updated, referenceDate);

        const [row] = await transaction
          .update(contracts)
          .set({
            ...(input.status !== undefined && { status: input.status }),
            ...(input.terminatedAt !== undefined && {
              terminatedAt: input.terminatedAt,
            }),
          })
          .where(eq(contracts.id, id))
          .returning();

        await this.recordAudit(transaction, {
          action: 'contract.updated',
          principal,
          entityId: id,
          metadata: { changes: input },
        });

        return mapContractRow(row);
      });
    }

    this.synchronizeInMemoryContracts(referenceDate);
    const existing = this.findRequiredContract(id, this.contracts);
    const updated = {
      ...existing,
      ...(input.status !== undefined && { status: input.status }),
      ...(input.terminatedAt !== undefined && {
        terminatedAt: input.terminatedAt,
      }),
    };
    validateContract(updated, referenceDate);
    Object.assign(existing, updated);
    return existing;
  }

  async renew(
    id: string,
    input: RenewContractInput,
    principal?: AuthenticatedPrincipal,
    referenceDate = new Date(),
  ): Promise<Contract> {
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [sourceRow] = await transaction
          .select()
          .from(contracts)
          .where(eq(contracts.id, id))
          .limit(1);
        if (!sourceRow) {
          throw new Error(`Contract ${id} not found`);
        }
        await this.lockContractInterval(transaction, mapContractRow(sourceRow));
        const currentContracts = await this.synchronizeDatabaseContracts(
          transaction,
          referenceDate,
        );
        const source = this.findRequiredContract(id, currentContracts);
        const renewed = this.buildRenewedContract(source, input, referenceDate);
        this.assertNoOverlappingContract(renewed, currentContracts, source.id);

        const [row] = await transaction
          .insert(contracts)
          .values(this.toContractRow(renewed))
          .returning();

        await this.recordAudit(transaction, {
          action: 'contract.renewed',
          principal,
          entityId: row.id,
          metadata: { sourceContractId: source.id },
        });

        return mapContractRow(row);
      });
    }

    this.synchronizeInMemoryContracts(referenceDate);
    const source = this.findRequiredContract(id, this.contracts);
    const renewed = this.buildRenewedContract(source, input, referenceDate);
    this.assertNoOverlappingContract(renewed, this.contracts, source.id);
    this.contracts.push(renewed);
    return renewed;
  }

  async delete(
    id: string,
    principal?: AuthenticatedPrincipal,
  ): Promise<void> {
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        const [row] = await transaction
          .delete(contracts)
          .where(eq(contracts.id, id))
          .returning();
        if (!row) {
          throw new Error('Contract ' + id + ' not found');
        }
        await this.recordAudit(transaction, {
          action: 'contract.deleted',
          principal,
          entityId: id,
          metadata: {},
        });
      });
      return;
    }

    const index = this.contracts.findIndex((contract) => contract.id === id);
    if (index === -1) {
      throw new Error('Contract ' + id + ' not found');
    }
    this.contracts.splice(index, 1);
    this.references?.removeContract(id);
  }

  private async synchronizeDatabaseContracts(
    database: any,
    referenceDate: Date,
  ): Promise<Contract[]> {
    const rows = await database
      .select()
      .from(contracts)
      .orderBy(asc(contracts.id));
    const synchronized: Contract[] = [];

    for (const row of rows) {
      const contract = mapContractRow(row);
      const status = synchronizedStatus(contract, referenceDate);
      if (status !== contract.status) {
        const [updatedRow] = await database
          .update(contracts)
          .set({ status })
          .where(eq(contracts.id, contract.id))
          .returning();
        synchronized.push(mapContractRow(updatedRow));
      } else {
        synchronized.push(contract);
      }
    }

    return synchronized;
  }

  private async lockContractInterval(
    database: any,
    contract: Pick<Contract, 'propertyId' | 'unit'>,
  ): Promise<void> {
    await database.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${contract.propertyId} || ':' || ${contract.unit}))`,
    );
  }

  private synchronizeInMemoryContracts(referenceDate: Date): void {
    for (const contract of this.contracts) {
      contract.status = synchronizedStatus(contract, referenceDate);
    }
  }

  private buildContract(
    input: CreateContractInput,
    referenceDate: Date,
  ): Contract {
    const monthlyRentWon = this.parseRent(input.monthlyRent);
    const contract: Contract = {
      id: `contract-${randomUUID()}`,
      ...input,
      monthlyRent: `₩${monthlyRentWon.toLocaleString('en-US')}`,
    };
    validateContract(contract, referenceDate);
    return contract;
  }

  private buildRenewedContract(
    source: Contract,
    input: RenewContractInput,
    referenceDate: Date,
  ): Contract {
    if (source.status === 'Terminated') {
      throw new Error(
        `Contract ${source.id} cannot be renewed after termination`,
      );
    }
    if (source.status !== 'Active' && source.status !== 'Expired') {
      throw new Error(
        `Contract ${source.id} must be active or expired to renew`,
      );
    }

    const expectedStartDate = calendarDayAfter(source.endDate);
    if (input.startDate !== expectedStartDate) {
      throw new Error(
        `Renewed contract must start on the day after ${source.id} ends`,
      );
    }
    if (input.startDate < utcCalendarDay(referenceDate)) {
      throw new Error('Renewed contract cannot start before today');
    }

    const monthlyRentWon = this.parseRent(input.monthlyRent);
    const status: ContractStatus =
      input.startDate > utcCalendarDay(referenceDate) ? 'Upcoming' : 'Active';
    const renewed: Contract = {
      id: `contract-${randomUUID()}`,
      propertyId: source.propertyId,
      tenantId: source.tenantId,
      unit: source.unit,
      monthlyRent: `₩${monthlyRentWon.toLocaleString('en-US')}`,
      startDate: input.startDate,
      endDate: input.endDate,
      status,
    };
    validateContract(renewed, referenceDate);
    return renewed;
  }

  private assertNoOverlappingContract(
    candidate: Contract,
    currentContracts: Contract[],
    excludedId?: string,
  ): void {
    const overlapping = currentContracts.find((existing) => {
      if (existing.id === excludedId) return false;
      if (
        existing.propertyId !== candidate.propertyId ||
        existing.unit !== candidate.unit
      ) {
        return false;
      }

      const effectiveEndDate =
        existing.status === 'Terminated' && existing.terminatedAt
          ? existing.terminatedAt
          : existing.endDate;
      return (
        candidate.startDate <= effectiveEndDate &&
        existing.startDate <= candidate.endDate
      );
    });

    if (overlapping) {
      throw new Error(
        `Contract ${candidate.id} overlaps an existing contract ${overlapping.id}`,
      );
    }
  }

  private findRequiredContract(id: string, records: Contract[]): Contract {
    const contract = records.find((item) => item.id === id);
    if (!contract) {
      throw new Error(`Contract ${id} not found`);
    }
    return contract;
  }

  private assertCreateInput(input: CreateContractInput): void {
    if (
      !input.propertyId ||
      !input.tenantId ||
      !input.unit ||
      !input.monthlyRent ||
      !input.startDate ||
      !input.endDate ||
      !input.status
    ) {
      throw new Error(
        'Contract requires propertyId, tenantId, unit, monthlyRent, startDate, endDate, and status',
      );
    }
  }

  private assertFixtureReferences(input: CreateContractInput): void {
    const propertyIds = new Set([
      'property-1',
      'property-2',
      'property-3',
      'property-4',
    ]);
    const tenantIds = new Set(['tenant-1', 'tenant-2', 'tenant-3', 'tenant-4']);
    if (!propertyIds.has(input.propertyId)) {
      throw new Error(`Property ${input.propertyId} not found`);
    }
    if (!tenantIds.has(input.tenantId)) {
      throw new Error(`Tenant ${input.tenantId} not found`);
    }
  }

  private toContractRow(contract: Contract) {
    return {
      id: contract.id,
      propertyId: contract.propertyId,
      tenantId: contract.tenantId,
      unit: contract.unit,
      monthlyRentWon: this.parseRent(contract.monthlyRent),
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      ...(contract.terminatedAt && { terminatedAt: contract.terminatedAt }),
    };
  }

  private async recordAudit(
    database: any,
    event: {
      action: string;
      principal?: AuthenticatedPrincipal;
      entityId: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!this.auditService) return;
    await this.auditService.record(database, {
      action: event.action,
      actorSubject: event.principal?.subject ?? 'system',
      actorRole: event.principal?.role ?? 'system',
      entityType: 'contract',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private parseRent(rent: string): number {
    if (!/^₩(?:0|[1-9]\d{0,2}(?:,\d{3})+)$/.test(rent)) {
      throw new Error(
        'Contract monthly rent must be a positive won amount such as ₩1,200,000',
      );
    }

    const rentWon = Number.parseInt(rent.replaceAll(',', '').slice(1), 10);
    if (!Number.isSafeInteger(rentWon) || rentWon <= 0) {
      throw new Error('Contract monthly rent must be a positive won amount');
    }
    return rentWon;
  }
}
