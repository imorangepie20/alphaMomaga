import { Injectable, Optional } from '@nestjs/common';
import type { Property, CreatePropertyInput } from './property.js';
import { validateProperty } from './property.js';
import { asc, eq } from 'drizzle-orm';
import { properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';

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
    return newProperty;
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
    }
  }
}