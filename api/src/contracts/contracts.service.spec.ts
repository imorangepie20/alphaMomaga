import type { Contract } from './contract.js';
import { validateBillingDay, validateContract, validateDueDay } from './contract.js';
import { ContractsService, mapContractRow } from './contracts.service.js';

const referenceDate = new Date('2026-09-02T12:00:00.000Z');

const contract = (overrides: Partial<Contract> = {}): Contract => ({
  id: 'contract-test',
  propertyId: 'property-1',
  tenantId: 'tenant-1',
  unit: 'A-101',
  monthlyRent: '₩1,000,000',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
  billingDay: 1,
  dueDay: 5,
  billingEnabled: true,
  status: 'Active',
  ...overrides,
});

describe('ContractsService', () => {
  it('returns valid lease records', async () => {
    expect(await new ContractsService().findAll()).toHaveLength(4);
  });

  it('synchronizes due lifecycle states when listing contracts', async () => {
    const service = new ContractsService();

    const records = await service.findAll(new Date('2027-09-01T00:00:00.000Z'));

    expect(records.find((item) => item.id === 'contract-1')?.status).toBe(
      'Expired',
    );
  });

  it('synchronizes a past upcoming contract directly to expired', async () => {
    const service = new ContractsService();
    (service as unknown as { contracts: Contract[] }).contracts.push(
      contract({
        id: 'contract-past-upcoming',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        status: 'Upcoming',
      }),
    );

    const records = await service.findAll(new Date('2026-09-02T00:00:00.000Z'));

    expect(
      records.find((item) => item.id === 'contract-past-upcoming')?.status,
    ).toBe('Expired');
  });

  it('creates an upcoming successor using source identity fields', async () => {
    const service = new ContractsService();

    const renewed = await service.renew(
      'contract-1',
      {
        startDate: '2027-09-01',
        endDate: '2028-08-31',
        monthlyRent: '₩1,300,000',
      },
      undefined,
      new Date('2026-09-04T00:00:00.000Z'),
    );

    expect(renewed).toEqual(
      expect.objectContaining({
        propertyId: 'property-1',
        tenantId: 'tenant-1',
        unit: 'A-101',
        status: 'Upcoming',
      }),
    );
  });

  it('rejects a renewal that does not start the day after the source end date', async () => {
    const service = new ContractsService();

    await expect(
      service.renew(
        'contract-1',
        {
          startDate: '2027-09-02',
          endDate: '2028-09-01',
          monthlyRent: '₩1,300,000',
        },
        undefined,
        new Date('2026-09-04T00:00:00.000Z'),
      ),
    ).rejects.toThrow('must start on the day after');
  });

  it('rejects a new contract that overlaps an occupied unit period', async () => {
    const service = new ContractsService();

    await expect(
      service.create(
        {
          propertyId: 'property-1',
          tenantId: 'tenant-2',
          unit: 'A-101',
          monthlyRent: '₩1,300,000',
          startDate: '2027-06-01',
          endDate: '2027-12-31',
          status: 'Upcoming',
        },
        undefined,
        new Date('2026-09-04T00:00:00.000Z'),
      ),
    ).rejects.toThrow('overlaps an existing contract');
  });

  it('maps database rent and nullable termination values to the public contract', () => {
    const mapped = mapContractRow({
      id: 'contract-db',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      unit: 'A-101',
      monthlyRentWon: 1200000,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      billingDay: 1,
      dueDay: 5,
      billingEnabled: true,
      status: 'Active',
      terminatedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(mapped).toEqual(
      expect.objectContaining({ monthlyRent: '₩1,200,000' }),
    );
    expect(mapped).not.toHaveProperty('terminatedAt');
  });
});

describe('validateContract', () => {
  it('accepts upcoming, active, expired, and terminated lifecycle states', () => {
    expect(() =>
      validateContract(
        contract({
          startDate: '2026-10-01',
          endDate: '2027-10-01',
          status: 'Upcoming',
        }),
        referenceDate,
      ),
    ).not.toThrow();
    expect(() => validateContract(contract(), referenceDate)).not.toThrow();
    expect(() =>
      validateContract(
        contract({
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          status: 'Expired',
        }),
        referenceDate,
      ),
    ).not.toThrow();
    expect(() =>
      validateContract(
        contract({ status: 'Terminated', terminatedAt: '2026-06-01' }),
        referenceDate,
      ),
    ).not.toThrow();
  });

  it.each([
    [{ startDate: '2026-09-02', endDate: '2026-09-02' }],
    [{ startDate: '2027-01-01', endDate: '2026-01-01' }],
    [{ startDate: '2026-02-30' }],
    [{ status: 'Terminated' }],
    [{ status: 'Terminated', terminatedAt: '2027-01-01' }],
  ])('rejects invalid contract data: %s', (overrides) => {
    expect(() =>
      validateContract(contract(overrides), referenceDate),
    ).toThrow();
  });
});

describe('ContractsService.update', () => {
  it('updates a contract to terminated with a valid termination date', async () => {
    const service = new ContractsService();
    const contracts = await service.findAll();
    const original = contracts[0];

    const updated = await service.update(original.id, {
      status: 'Terminated',
      terminatedAt: '2026-06-15',
    });

    expect(updated.status).toBe('Terminated');
    expect(updated.id).toBe(original.id);
  });

  it('updates contract terminatedAt when status is Terminated', async () => {
    const service = new ContractsService();
    const contracts = await service.findAll();
    const original = contracts[0];

    const updated = await service.update(original.id, {
      status: 'Terminated',
      terminatedAt: '2026-06-15',
    });

    expect(updated.status).toBe('Terminated');
    expect(updated.terminatedAt).toBe('2026-06-15');
  });

  it('rejects an invalid lifecycle status update', async () => {
    const service = new ContractsService();
    const contracts = await service.findAll();
    const original = contracts[0];

    await expect(
      service.update(original.id, { status: 'Expired' }),
    ).rejects.toThrow('cannot be expired before its end date');
  });

  it('throws error when contract not found', async () => {
    const service = new ContractsService();
    expect(
      service.update('non-existent-id', { status: 'Expired' }),
    ).rejects.toThrow('not found');
  });
});

describe('ContractsService billing rules', () => {
  it('defaults a new contract to first-day drafting and fifth-day due dates', async () => {
    const service = new ContractsService();

    const created = await service.create(
      {
        propertyId: 'property-1',
        tenantId: 'tenant-1',
        unit: 'A-102',
        monthlyRent: '₩1,200,000',
        startDate: '2026-10-01',
        endDate: '2027-09-30',
        status: 'Upcoming',
      },
      undefined,
      new Date('2026-09-04T00:00:00.000Z'),
    );

    expect(created).toMatchObject({
      billingDay: 1,
      dueDay: 5,
      billingEnabled: true,
    });
  });

  it.each([0, 32, 1.5])('rejects an invalid billing day: %s', (billingDay) => {
    expect(() => validateBillingDay(billingDay)).toThrow('billingDay');
  });

  it.each([0, 32, 1.5])('rejects an invalid due day: %s', (dueDay) => {
    expect(() => validateDueDay(dueDay)).toThrow('dueDay');
  });
});
