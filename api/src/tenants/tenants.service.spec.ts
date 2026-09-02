import { TenantsService } from './tenants.service.js';

describe('TenantsService', () => {
  it('returns tenant records with payment status', () => {
    const tenants = new TenantsService().findAll();

    expect(tenants).toHaveLength(4);
    expect(tenants[1]).toEqual({
      id: 'tenant-2',
      name: 'Park Minseo',
      propertyId: 'property-2',
      unit: 'B-302',
      rent: '₩980,000',
      status: 'Overdue',
    });
  });
});