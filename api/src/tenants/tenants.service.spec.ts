import { parseRent, TenantsService } from './tenants.service.js';

describe('TenantsService', () => {
  it('returns tenant records with payment status', async () => {
    const tenants = await new TenantsService().findAll();

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

  it('creates a memory tenant with a normalized won amount', async () => {
    const tenantsService = new TenantsService();
    const tenant = await tenantsService.create({ name: 'Jung Sora', propertyId: 'property-1', unit: 'A-202', rent: '₩1,100,000', status: 'Pending' });

    expect(tenant.rent).toBe('₩1,100,000');
    expect((await tenantsService.findAll())).toHaveLength(5);
  });

  it.each(['₩1,,000', '₩1000', '₩0', '1000000'])('rejects malformed rent %s', (rent) => {
    expect(() => parseRent(rent)).toThrow();
  });
});