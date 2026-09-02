import { Injectable } from '@nestjs/common';
import type { Inspection } from './inspection.js';
import { validateInspection } from './inspection.js';

@Injectable()
export class InspectionsService {
  private readonly inspections: Inspection[] = [
    { id: 'inspection-1', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-06', status: 'Scheduled', priority: 'Routine' },
    { id: 'inspection-2', propertyId: 'property-2', type: '냉난방 설비', scheduledDate: '2026-08-09', status: 'Completed', priority: 'Routine', completedAt: '2026-08-10' },
    { id: 'inspection-3', propertyId: 'property-4', type: '전기 안전', scheduledDate: '2026-09-12', status: 'InReview', priority: 'Urgent' },
    { id: 'inspection-4', propertyId: 'property-3', type: '외벽 점검', scheduledDate: '2026-09-18', status: 'Pending', priority: 'Routine' },
  ];

  findAll(): Inspection[] {
    this.inspections.forEach((inspection) => validateInspection(inspection));
    return this.inspections;
  }
}