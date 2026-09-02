import { Injectable, Optional } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { Inspection } from './inspection.js';
import { validateInspection } from './inspection.js';
import { inspections } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

type InspectionRow = typeof inspections.$inferSelect;

export function mapInspectionRow(row: InspectionRow): Inspection {
  const inspection: Inspection = {
    id: row.id,
    propertyId: row.propertyId,
    type: row.type,
    scheduledDate: row.scheduledDate,
    status: row.status,
    priority: row.priority,
  };
  if (row.completedAt) inspection.completedAt = row.completedAt;
  return inspection;
}

@Injectable()
export class InspectionsService {
  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

  private readonly inspections: Inspection[] = [
    { id: 'inspection-1', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-06', status: 'Scheduled', priority: 'Routine' },
    { id: 'inspection-2', propertyId: 'property-2', type: '냉난방 설비', scheduledDate: '2026-08-09', status: 'Completed', priority: 'Routine', completedAt: '2026-08-10' },
    { id: 'inspection-3', propertyId: 'property-4', type: '전기 안전', scheduledDate: '2026-09-12', status: 'InReview', priority: 'Urgent' },
    { id: 'inspection-4', propertyId: 'property-3', type: '외벽 점검', scheduledDate: '2026-09-18', status: 'Pending', priority: 'Routine' },
  ];

  async findAll(): Promise<Inspection[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(inspections).orderBy(asc(inspections.id))).map(mapInspectionRow)
      : this.inspections;
    records.forEach((inspection) => validateInspection(inspection));
    return records;
  }
}