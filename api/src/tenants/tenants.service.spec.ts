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

  it('assigns a neutral legacy status when creating a tenant without a payment status', async () => {
    const tenantsService = new TenantsService();

    const tenant = await tenantsService.create({ name: 'Han Areum', propertyId: 'property-2', unit: 'B-401', rent: '₩1,050,000' } as unknown as Parameters<TenantsService['create']>[0]);

    expect(tenant.status).toBe('Pending');
  });

  it.each(['₩1,,000', '₩1000', '₩0', '1000000'])('rejects malformed rent %s', (rent) => {
    expect(() => parseRent(rent)).toThrow();
  });

  describe('update', () => {
    it('updates tenant name', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Original Name',
        propertyId: 'property-99',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      const updated = await service.update(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.rent).toBe('₩1,000,000');
    });

    it('updates tenant rent', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Test Tenant',
        propertyId: 'property-98',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      const updated = await service.update(created.id, { rent: 1500000 });

      expect(updated.rent).toBe('₩1,500,000');
    });

    it('ignores legacy tenant payment status updates', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Test Tenant',
        propertyId: 'property-97',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      const updated = await service.update(created.id, { status: 'Paid' } as unknown as Parameters<TenantsService['update']>[1]);

      expect(updated.status).toBe('Pending');
    });

    it('updates multiple fields at once', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Test',
        propertyId: 'property-96',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      const updated = await service.update(created.id, {
        name: 'Updated Test',
        rent: 2000000,
      });

      expect(updated.name).toBe('Updated Test');
      expect(updated.rent).toBe('₩2,000,000');
      expect(updated.status).toBe('Pending');
    });

    it('throws error when tenant not found', async () => {
      const service = new TenantsService();
      expect(service.update('non-existent-id', { name: 'Test' })).rejects.toThrow('찾을 수 없습니다');
    });

    it('throws error when no fields provided for update', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Test',
        propertyId: 'property-95',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      expect(service.update(created.id, {})).rejects.toThrow('At least one field is required');
    });

    it('does not treat a legacy status update as an operational payment change', async () => {
      const service = new TenantsService();
      const created = await service.create({
        name: 'Test',
        propertyId: 'property-94',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      await expect(service.update(created.id, { status: 'Invalid' } as unknown as Parameters<TenantsService['update']>[1])).resolves.toMatchObject({ status: 'Pending' });
    });

    it('prevents duplicate unit in same property', async () => {
      const service = new TenantsService();
      await service.create({
        name: 'Tenant 1',
        propertyId: 'property-93',
        unit: 'A-101',
        rent: '₩1,000,000',
        status: 'Pending',
      });
      const tenant2 = await service.create({
        name: 'Tenant 2',
        propertyId: 'property-93',
        unit: 'A-102',
        rent: '₩1,000,000',
        status: 'Pending',
      });

      expect(service.update(tenant2.id, { unit: 'A-101' })).rejects.toThrow('이미 임차인이 있습니다');
    });
  });
});
