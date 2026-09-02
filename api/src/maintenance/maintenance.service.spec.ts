import { MaintenanceService } from './maintenance.service.js';
import { validateMaintenance } from './maintenance.js';

describe('MaintenanceService', () => {
  it('returns validated work orders', () => {
    expect(new MaintenanceService().findAll()).toHaveLength(4);
  });

  it('rejects missing fields and invalid dates', () => {
    expect(() => validateMaintenance({ id: '', propertyId: 'property-1', task: '수리', dueDate: '2026-09-01', status: 'Pending' })).toThrow();
    expect(() => validateMaintenance({ id: 'bad', propertyId: 'property-1', task: '수리', dueDate: '2026-02-30', status: 'Pending' })).toThrow();
  });
});