import type { Contract } from './contract.js';
import { validateContract } from './contract.js';
import { ContractsService } from './contracts.service.js';

const referenceDate = new Date('2026-09-02T12:00:00.000Z');

const contract = (overrides: Partial<Contract> = {}): Contract => ({
  id: 'contract-test', propertyId: 'property-1', tenantId: 'tenant-1', unit: 'A-101',
  monthlyRent: '₩1,000,000', startDate: '2026-01-01', endDate: '2027-01-01', status: 'Active',
  ...overrides,
});

describe('ContractsService', () => {
  it('returns valid lease records', () => {
    expect(new ContractsService().findAll()).toHaveLength(4);
  });
});

describe('validateContract', () => {
  it('accepts upcoming, active, expired, and terminated lifecycle states', () => {
    expect(() => validateContract(contract({ startDate: '2026-10-01', endDate: '2027-10-01', status: 'Upcoming' }), referenceDate)).not.toThrow();
    expect(() => validateContract(contract(), referenceDate)).not.toThrow();
    expect(() => validateContract(contract({ startDate: '2025-01-01', endDate: '2026-01-01', status: 'Expired' }), referenceDate)).not.toThrow();
    expect(() => validateContract(contract({ status: 'Terminated', terminatedAt: '2026-06-01' }), referenceDate)).not.toThrow();
  });

  it.each([
    [{ startDate: '2026-09-02', endDate: '2026-09-02' }],
    [{ startDate: '2027-01-01', endDate: '2026-01-01' }],
    [{ startDate: '2026-02-30' }],
    [{ status: 'Terminated' }],
    [{ status: 'Terminated', terminatedAt: '2027-01-01' }],
  ])('rejects invalid contract data: %s', (overrides) => {
    expect(() => validateContract(contract(overrides), referenceDate)).toThrow();
  });
});