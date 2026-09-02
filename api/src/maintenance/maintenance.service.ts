import { Injectable, Optional } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { Maintenance } from './maintenance.js';
import { validateMaintenance } from './maintenance.js';
import { maintenance } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

type MaintenanceRow = typeof maintenance.$inferSelect;

export function mapMaintenanceRow(row: MaintenanceRow): Maintenance {
  return { id: row.id, propertyId: row.propertyId, task: row.task, dueDate: row.dueDate, status: row.status };
}

@Injectable()
export class MaintenanceService {
  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

  private readonly maintenance: Maintenance[] = [
    { id: 'maintenance-1', propertyId: 'property-1', task: '승강기 정기 점검', dueDate: '2026-09-07', status: 'Scheduled' },
    { id: 'maintenance-2', propertyId: 'property-2', task: '누수 보수', dueDate: '2026-09-09', status: 'InProgress' },
    { id: 'maintenance-3', propertyId: 'property-4', task: '냉난방기 정비', dueDate: '2026-08-14', status: 'Completed' },
    { id: 'maintenance-4', propertyId: 'property-3', task: '외벽 상태 점검', dueDate: '2026-09-22', status: 'Pending' },
  ];

  async findAll(): Promise<Maintenance[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(maintenance).orderBy(asc(maintenance.id))).map(mapMaintenanceRow)
      : this.maintenance;
    records.forEach(validateMaintenance);
    return records;
  }
}