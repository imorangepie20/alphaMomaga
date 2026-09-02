import { validateInspection } from './inspection.js';
import type { Inspection } from './inspection.js';
import { InspectionsService } from './inspections.service.js';

const referenceDate = new Date('2026-09-02T12:00:00.000Z');
const inspection = (overrides: Partial<Inspection> = {}): Inspection => ({
  id: 'inspection-test', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-01', status: 'Pending', priority: 'Routine', ...overrides,
});

describe('InspectionsService', () => {
  it('returns validated inspection records', () => {
    expect(new InspectionsService().findAll()).toHaveLength(4);
  });

  it('requires a valid completion date for completed inspections', () => {
    expect(() => validateInspection(inspection({ status: 'Completed' }), referenceDate)).toThrow();
    expect(() => validateInspection(inspection({ status: 'Completed', completedAt: '2026-09-02' }), referenceDate)).not.toThrow();
    expect(() => validateInspection(inspection({ scheduledDate: '2026-02-30' }), referenceDate)).toThrow();
  });
});