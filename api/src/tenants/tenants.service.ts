import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { asc } from 'drizzle-orm';
import type { CreateTenantInput, Tenant } from './tenant.js';
import { tenants } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';

type TenantRow = typeof tenants.$inferSelect;

export function parseRent(rent: string): number {
  if (!/^₩(?:0|[1-9]\d{0,2}(?:,\d{3})+)$/.test(rent)) {
    throw new Error('Tenant rent must be a positive won amount such as ₩1,200,000');
  }

  const rentWon = Number.parseInt(rent.replaceAll(',', '').slice(1), 10);
  if (!Number.isSafeInteger(rentWon) || rentWon <= 0) {
    throw new Error('Tenant rent must be a positive won amount');
  }
  return rentWon;
}

export function mapTenantRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    propertyId: row.propertyId,
    unit: row.unit,
    rent: `₩${row.rentWon.toLocaleString('en-US')}`,
    status: row.status,
  };
}

@Injectable()
export class TenantsService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  private readonly tenants: Tenant[] = [
    { id: 'tenant-1', name: 'Kim Jihoon', propertyId: 'property-1', unit: 'A-101', rent: '₩1,200,000', status: 'Paid' },
    { id: 'tenant-2', name: 'Park Minseo', propertyId: 'property-2', unit: 'B-302', rent: '₩980,000', status: 'Overdue' },
    { id: 'tenant-3', name: 'Lee Daeho', propertyId: 'property-3', unit: 'C-205', rent: '₩1,540,000', status: 'Paid' },
    { id: 'tenant-4', name: 'Choi Yuna', propertyId: 'property-4', unit: 'D-408', rent: '₩1,020,000', status: 'Pending' },
  ];

  async findAll(): Promise<Tenant[]> {
    const database = this.databaseService?.client;
    if (database) {
      const rows = await database.select().from(tenants).orderBy(asc(tenants.id));
      return rows.map(mapTenantRow);
    }
    return this.tenants;
  }

  async create(input: CreateTenantInput, principal?: AuthenticatedPrincipal): Promise<Tenant> {
    if (!input.name || !input.propertyId || !input.unit) {
      throw new Error('Tenant name, property, unit, and a valid rent are required');
    }
    const rentWon = parseRent(input.rent);
    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction.insert(tenants).values({
          id: `tenant-${randomUUID()}`,
          name: input.name,
          propertyId: input.propertyId,
          unit: input.unit,
          rentWon,
          status: input.status,
        }).returning();
        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'tenant.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'tenant',
            entityId: row.id,
            metadata: { propertyId: input.propertyId, unit: input.unit },
          });
        }
        return mapTenantRow(row);
      });
    }

    const tenant: Tenant = { id: `tenant-${this.tenants.length + 1}`, ...input, rent: `₩${rentWon.toLocaleString('en-US')}` };
    this.tenants.push(tenant);
    return tenant;
  }
}