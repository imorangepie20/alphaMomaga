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
});