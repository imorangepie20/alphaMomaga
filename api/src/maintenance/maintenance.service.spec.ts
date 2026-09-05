import { MaintenanceService, mapMaintenanceRow } from './maintenance.service.js';
import { validateMaintenance } from './maintenance.js';

describe('MaintenanceService', () => {
  it('returns validated work orders', async () => {
    expect(await new MaintenanceService().findAll()).toHaveLength(4);
  });

  it('maps a database work order row to the API contract', () => {
    expect(mapMaintenanceRow({ id: 'maintenance-db', propertyId: 'property-1', task: '누수 보수', dueDate: '2026-09-10', status: 'Pending', createdAt: new Date() })).toEqual({ id: 'maintenance-db', propertyId: 'property-1', task: '누수 보수', dueDate: '2026-09-10', status: 'Pending' });
  });

  it('rejects missing fields and invalid dates', () => {
    expect(() => validateMaintenance({ id: '', propertyId: 'property-1', task: '수리', dueDate: '2026-09-01', status: 'Pending' })).toThrow();
    expect(() => validateMaintenance({ id: 'bad', propertyId: 'property-1', task: '수리', dueDate: '2026-02-30', status: 'Pending' })).toThrow();
  });

  it('updates maintenance status', async () => {
    const service = new MaintenanceService();
    const updated = await service.update('maintenance-1', { status: 'Completed', completedAt: '2026-09-01', resolution: 'Replaced valve and tested for leaks' });

    expect(updated).toMatchObject({ id: 'maintenance-1', status: 'Completed' });
  });

  it('requires completion evidence without changing the existing status on failure', async () => {
    const service = new MaintenanceService();
    await expect(service.update('maintenance-2', { status: 'Completed' })).rejects.toThrow();
    expect((await service.findAll()).find((item) => item.id === 'maintenance-2')?.status).toBe('InProgress');
  });

  it('stores completion evidence, allows early completion, and clears it on reopening', async () => {
    const service = new MaintenanceService();
    expect(await service.update('maintenance-2', { status: 'Completed', completedAt: '2026-09-01', resolution: '  Valve replaced  ' })).toMatchObject({ completedAt: '2026-09-01', resolution: 'Valve replaced' });
    const reopened = await service.update('maintenance-2', { status: 'InProgress' });
    expect(reopened.completedAt).toBeUndefined();
    expect(reopened.resolution).toBeUndefined();
  });

  it.each(['2026-02-30', '2999-01-01'])('rejects invalid completion date %s', async (completedAt) => {
    await expect(new MaintenanceService().update('maintenance-2', { status: 'Completed', completedAt, resolution: 'Fixed' })).rejects.toThrow();
  });

  it('rejects blank completion results and evidence on unfinished work', async () => {
    const service = new MaintenanceService();
    await expect(service.update('maintenance-2', { status: 'Completed', completedAt: '2026-09-01', resolution: '  ' })).rejects.toThrow();
    await expect(service.create({ propertyId: 'property-1', task: 'Fix', dueDate: '2026-09-07', status: 'Pending', completedAt: '2026-09-01', resolution: 'Fixed' })).rejects.toThrow();
  });

  it('updates due date without mutating on invalid input', async () => {
    const service = new MaintenanceService();

    await expect(service.update('maintenance-1', { dueDate: '2026-02-30' })).rejects.toThrow();
    const items = await service.findAll();

    expect(items.find((item) => item.id === 'maintenance-1')?.dueDate).not.toBe('2026-02-30');
  });

  it('throws when no fields are provided', async () => {
    const service = new MaintenanceService();

    await expect(service.update('maintenance-1', {})).rejects.toThrow('At least one field is required');
  });

  it('throws when maintenance does not exist', async () => {
    const service = new MaintenanceService();

    await expect(service.update('non-existent-id', { status: 'Completed' })).rejects.toThrow('not found');
  });
});
