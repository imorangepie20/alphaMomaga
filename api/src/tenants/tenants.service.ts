import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { asc, and, eq } from 'drizzle-orm';
import type { CreateTenantInput, Tenant } from './tenant.js';
import type { UpdateTenantInput } from './tenant.js';
import { tenants } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { InMemoryReferenceRegistry } from '../domain/in-memory-reference-registry.service.js';

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
    @Optional() private readonly references?: InMemoryReferenceRegistry,
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
        // 중복 검증: 같은 propertyId와 unit으로 이미 있는 임차인 확인
        const existing = await transaction
          .select()
          .from(tenants)
          .where(and(eq(tenants.propertyId, input.propertyId), eq(tenants.unit, input.unit)))
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`같은 부동산의 ${input.unit}에 이미 임차인이 있습니다`);
        }

        const [row] = await transaction.insert(tenants).values({
          id: `tenant-${randomUUID()}`,
          name: input.name,
          propertyId: input.propertyId,
          unit: input.unit,
          rentWon,
          // Tenant payment status is legacy metadata. The billing ledger is authoritative.
          status: 'Pending',
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

    // 인-메모리 중복 검증
    this.references?.assertProperty(input.propertyId);
    const existing = this.tenants.find((t) => t.propertyId === input.propertyId && t.unit === input.unit);
    if (existing) {
      throw new Error(`같은 부동산의 ${input.unit}에 이미 임차인이 있습니다`);
    }

    const tenant: Tenant = { id: `tenant-${this.tenants.length + 1}`, ...input, rent: `₩${rentWon.toLocaleString('en-US')}`, status: 'Pending' };
    this.tenants.push(tenant);
    this.references?.registerTenant(tenant.id, tenant.propertyId);
    return tenant;
  }

  async delete(id: string, principal?: AuthenticatedPrincipal): Promise<void> {
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        await transaction.delete(tenants).where(eq(tenants.id, id));

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'tenant.deleted',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'tenant',
            entityId: id,
            metadata: {},
          });
        }
      });
      return;
    }

    const index = this.tenants.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tenants.splice(index, 1);
      this.references?.removeTenant(id);
    }
  }

    async update(id: string, input: UpdateTenantInput, principal?: AuthenticatedPrincipal): Promise<Tenant> {
      if (Object.keys(input).length === 0) {
        throw new Error('At least one field is required to update');
      }

      if (input.rent !== undefined) {
        parseRent(`₩${input.rent.toLocaleString('en-US')}`);
      }

      const database = this.databaseService?.client;
      if (database) {
        return database.transaction(async (transaction) => {
          const existing = await transaction.select().from(tenants).where(eq(tenants.id, id));
          if (existing.length === 0) {
            throw new Error(`Tenant ${id}을(를) 찾을 수 없습니다`);
          }

          // 임차인이 다른 unit으로 옮기는 경우 중복 검증
          if (input.unit !== undefined && input.unit !== existing[0].unit) {
            const duplicateCheck = await transaction
              .select()
              .from(tenants)
              .where(
                and(
                  eq(tenants.propertyId, existing[0].propertyId),
                  eq(tenants.unit, input.unit),
                ),
              )
              .limit(1);
            if (duplicateCheck.length > 0) {
              throw new Error(`같은 부동산의 ${input.unit}에 이미 임차인이 있습니다`);
            }
          }

          const updateData: Record<string, unknown> = {};
          if (input.name !== undefined) updateData.name = input.name;
          if (input.unit !== undefined) updateData.unit = input.unit;
          if (input.rent !== undefined) updateData.rentWon = input.rent;

          const [row] = await transaction.update(tenants)
            .set(updateData)
            .where(eq(tenants.id, id))
            .returning();

          if (this.auditService) {
            await this.auditService.record(transaction, {
              action: 'tenant.updated',
              actorSubject: principal?.subject ?? 'system',
              actorRole: principal?.role ?? 'system',
              entityType: 'tenant',
              entityId: id,
              metadata: { changes: updateData },
            });
          }

          return mapTenantRow(row);
        });
      }

      // 인-메모리 업데이트
      const index = this.tenants.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Tenant ${id}을(를) 찾을 수 없습니다`);
      }

      const existing = this.tenants[index];

      // 임차인이 다른 unit으로 옮기는 경우 중복 검증
      if (input.unit !== undefined && input.unit !== existing.unit) {
        const duplicate = this.tenants.find((t) => t.propertyId === existing.propertyId && t.unit === input.unit);
        if (duplicate) {
          throw new Error(`같은 부동산의 ${input.unit}에 이미 임차인이 있습니다`);
        }
      }

      const rentWon = input.rent !== undefined ? input.rent : parseRent(existing.rent);
      const updated: Tenant = {
        id,
        name: input.name ?? existing.name,
        propertyId: existing.propertyId,
        unit: input.unit ?? existing.unit,
        rent: `₩${rentWon.toLocaleString('en-US')}`,
        status: existing.status,
      };

      this.tenants[index] = updated;
      return updated;
    }
}
