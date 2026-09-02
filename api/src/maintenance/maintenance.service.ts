import { Injectable } from '@nestjs/common';
import type { Maintenance } from './maintenance.js';
import { validateMaintenance } from './maintenance.js';

@Injectable()
export class MaintenanceService {
  private readonly maintenance: Maintenance[] = [
    { id: 'maintenance-1', propertyId: 'property-1', task: '승강기 정기 점검', dueDate: '2026-09-07', status: 'Scheduled' },
    { id: 'maintenance-2', propertyId: 'property-2', task: '누수 보수', dueDate: '2026-09-09', status: 'InProgress' },
    { id: 'maintenance-3', propertyId: 'property-4', task: '냉난방기 정비', dueDate: '2026-08-14', status: 'Completed' },
    { id: 'maintenance-4', propertyId: 'property-3', task: '외벽 상태 점검', dueDate: '2026-09-22', status: 'Pending' },
  ];

  findAll(): Maintenance[] {
    this.maintenance.forEach(validateMaintenance);
    return this.maintenance;
  }
}