import { validateInspection } from './inspection.js';
import type { Inspection } from './inspection.js';
import { InspectionsService, mapInspectionRow } from './inspections.service.js';

const referenceDate = new Date('2026-09-02T12:00:00.000Z');
const inspection = (overrides: Partial<Inspection> = {}): Inspection => ({
  id: 'inspection-test', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-01', status: 'Pending', priority: 'Routine', ...overrides,
});

describe('InspectionsService', () => {
  it('creates completed work with a result at the maximum length', async () => {
    const input = { propertyId: 'property-1', type: 'Safety', scheduledDate: '2026-09-10', status: 'Completed' as const, priority: 'Routine' as const, completedAt: '2026-09-01', result: 'x'.repeat(4000) };
    expect(await new InspectionsService().create(input)).toMatchObject(input);
    await expect(new InspectionsService().create({ ...input, result: '' })).rejects.toThrow();
  });

  it('requires a result for new completion and preserves legacy reads', async () => {
    const service = new InspectionsService();
    expect((await service.findAll()).find((item) => item.id === 'inspection-2')?.completedAt).toBeDefined();
    await expect(service.update('inspection-1', { status: 'Completed', completedAt: '2026-09-01' })).rejects.toThrow();
    expect(await service.update('inspection-1', { status: 'Completed', completedAt: '2026-09-01', result: '  Tested alarm and verified  ' })).toMatchObject({ result: 'Tested alarm and verified' });
    await expect(service.update('inspection-1', { result: ' ' })).rejects.toThrow();
    await expect(service.update('inspection-1', { result: 'x'.repeat(4001) })).rejects.toThrow();
    expect(await service.update('inspection-1', { status: 'InReview' })).not.toHaveProperty('result');
    await expect(service.update('inspection-1', { result: 'Not completed' })).rejects.toThrow();
  });

  it('accepts early completion but still rejects future completion', () => {
    expect(() => validateInspection(inspection({ scheduledDate: '2026-09-10', status: 'Completed', completedAt: '2026-09-02' }), referenceDate)).not.toThrow();
    expect(() => validateInspection(inspection({ status: 'Completed', completedAt: '2026-09-03' }), referenceDate)).toThrow();
  });

  it('reschedules a pending inspection and changes its priority', async () => {
    expect(await new InspectionsService().update('inspection-1', { scheduledDate: '2026-09-15', priority: 'Urgent' })).toMatchObject({ scheduledDate: '2026-09-15', priority: 'Urgent' });
  });

  it('uses the Seoul date for completion and rejects impossible calendar dates', () => {
    expect(() => validateInspection(inspection({ scheduledDate: '2026-09-02', status: 'Completed', completedAt: '2026-09-03' }), new Date('2026-09-02T23:30:00Z'))).not.toThrow();
    expect(() => validateInspection(inspection({ scheduledDate: '2026-02-01', status: 'Completed', completedAt: '2026-02-30' }), referenceDate)).toThrow();
  });

  it('clears the completion date when reopening work', async () => {
    expect(await new InspectionsService().update('inspection-2', { status: 'InReview' })).not.toHaveProperty('completedAt');
  });

  it('returns validated inspection records', async () => {
    expect(await new InspectionsService().findAll()).toHaveLength(4);
  });

  it('maps a database inspection row and omits a null completion date', () => {
    const mapped = mapInspectionRow({ id: 'inspection-db', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-01', status: 'Pending', priority: 'Routine', completedAt: null, result: null, createdAt: new Date() });
    expect(mapped).toEqual(expect.objectContaining({ id: 'inspection-db', scheduledDate: '2026-09-01' }));
    expect(mapped).not.toHaveProperty('completedAt');
  });

  it('requires a valid completion date for completed inspections', () => {
    expect(() => validateInspection(inspection({ status: 'Completed' }), referenceDate)).toThrow();
    expect(() => validateInspection(inspection({ status: 'Completed', completedAt: '2026-09-02' }), referenceDate)).not.toThrow();
    expect(() => validateInspection(inspection({ scheduledDate: '2026-02-30' }), referenceDate)).toThrow();
  });

  it('updates an inspection status with a valid completion date', async () => {
    const service = new InspectionsService();

    const updated = await service.update('inspection-2', {
      status: 'Completed',
      completedAt: '2026-08-10',
      result: 'Inspection verified',
    });

    expect(updated).toMatchObject({
      id: 'inspection-2',
      status: 'Completed',
      completedAt: '2026-08-10',
    });
  });

  it('does not mutate an inspection when completion validation fails', async () => {
    const service = new InspectionsService();

    await expect(service.update('inspection-1', { status: 'Completed' })).rejects.toThrow();
    const inspections = await service.findAll();

    expect(inspections.find((item) => item.id === 'inspection-1')).toMatchObject({
      status: 'Scheduled',
    });
  });

  it('throws when no fields are provided', async () => {
    const service = new InspectionsService();

    await expect(service.update('inspection-1', {})).rejects.toThrow('At least one field is required');
  });

  it('throws when the inspection does not exist', async () => {
    const service = new InspectionsService();

    await expect(service.update('non-existent-id', { status: 'Completed' })).rejects.toThrow('not found');
  });
});
