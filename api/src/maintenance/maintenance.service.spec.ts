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
    const updated = await service.update('maintenance-1', { status: 'Completed' });

    expect(updated).toMatchObject({ id: 'maintenance-1', status: 'Completed' });
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