import { Injectable, Optional } from '@nestjs/common';
import type { Property } from './property.js';
import { asc } from 'drizzle-orm';
import { properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

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
  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

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
}