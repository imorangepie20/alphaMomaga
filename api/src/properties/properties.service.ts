import { Injectable, Optional } from '@nestjs/common';
import type { Property, CreatePropertyInput, UpdatePropertyInput } from './property.js';
import { validateProperty } from './property.js';
import { asc, eq } from 'drizzle-orm';
import { properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';
import { InMemoryReferenceRegistry } from '../domain/in-memory-reference-registry.service.js';

type PropertyRow = typeof properties.$inferSelect;

export function mapPropertyRow(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    type: row.type,
    occupancy: `${row.occupancy}%`,
    status: row.status,
  };
}

@Injectable()
export class PropertiesService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly references?: InMemoryReferenceRegistry,
  ) {}

  private readonly properties: Property[] = [
    {
      id: 'property-1',
      name: 'Seoul Heights Tower',
      location: 'Seoul, KR',
      type: 'Apartment',
      occupancy: '96%',
      status: 'Occupied',
    },
    {
      id: 'property-2',
      name: 'Hana Village',
      location: 'Busan, KR',
      type: 'Townhouse',
      occupancy: '88%',
      status: 'Active',
    },
    {
      id: 'property-3',
      name: 'Blue Park Residences',
      location: 'Incheon, KR',
      type: 'Officetel',
      occupancy: '82%',
      status: 'Pending',
    },
    {
      id: 'property-4',
      name: 'Riverside Point',
      location: 'Daegu, KR',
      type: 'Commercial',
      occupancy: '91%',
      status: 'Occupied',
    },
  ];

  async findAll(): Promise<Property[]> {
    const database = this.databaseService?.client;
    if (database) {
      const rows = await database.select().from(properties).orderBy(asc(properties.id));
      return rows.map(mapPropertyRow);
    }

    return this.properties;
  }

  async create(input: CreatePropertyInput, principal?: AuthenticatedPrincipal): Promise<Property> {
    if (!input.name || !input.location || !input.type) {
      throw new Error('Property requires name, location, and type');
    }

    const item: Property = {
      id: 'property-temp',
      ...input,
      occupancy: `${input.occupancy ?? 0}%`,
      status: input.status ?? 'Active',
    };
    validateProperty(item);

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [row] = await transaction.insert(properties).values({
          id: `property-${randomUUID()}`,
          name: input.name,
          location: input.location,
          type: input.type,
          occupancy: input.occupancy ?? 0,
          status: input.status ?? 'Active',
        }).returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'property.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'property',
            entityId: row.id,
            metadata: { name: input.name, location: input.location, type: input.type },
          });
        }

        return mapPropertyRow(row);
      });
    }

    const newProperty: Property = {
      id: `property-${this.properties.length + 1}`,
      ...input,
      occupancy: `${input.occupancy ?? 0}%`,
      status: input.status ?? 'Active',
    };
    this.properties.push(newProperty);
    this.references?.registerProperty(newProperty.id);
    return newProperty;
  }

  async update(id: string, input: UpdatePropertyInput, principal?: AuthenticatedPrincipal): Promise<Property> {
    if (Object.keys(input).length === 0) {
      throw new Error('At least one field is required to update');
    }

    if (input.occupancy !== undefined && (input.occupancy < 0 || input.occupancy > 100)) {
      throw new Error('Occupancy must be between 0 and 100');
    }

    if (input.status !== undefined && !['Occupied', 'Active', 'Pending'].includes(input.status)) {
      throw new Error('Invalid status value');
    }

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const existing = await transaction.select().from(properties).where(eq(properties.id, id));
        if (existing.length === 0) {
          throw new Error(`Property ${id}을(를) 찾을 수 없습니다`);
        }

        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.location !== undefined) updateData.location = input.location;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.occupancy !== undefined) updateData.occupancy = input.occupancy;
        if (input.status !== undefined) updateData.status = input.status;

        const [row] = await transaction.update(properties)
          .set(updateData)
          .where(eq(properties.id, id))
          .returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'property.updated',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'property',
            entityId: id,
            metadata: { changes: updateData },
          });
        }

        return mapPropertyRow(row);
      });
    }

    // 인-메모리 업데이트
    const index = this.properties.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Property ${id}을(를) 찾을 수 없습니다`);
    }

    const existing = this.properties[index];
    const updated: Property = {
      id,
      name: input.name ?? existing.name,
      location: input.location ?? existing.location,
      type: input.type ?? existing.type,
      occupancy: input.occupancy !== undefined ? `${input.occupancy}%` : existing.occupancy,
      status: input.status ?? existing.status,
    };
      validateProperty(updated);

    this.properties[index] = updated;
    return updated;
  }

  async delete(id: string, principal?: AuthenticatedPrincipal): Promise<void> {
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        await transaction.delete(properties).where(eq(properties.id, id));

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'property.deleted',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'property',
            entityId: id,
            metadata: {},
          });
        }
      });
      return;
    }

    const index = this.properties.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.properties.splice(index, 1);
      this.references?.removeProperty(id);
    }
  }
}
