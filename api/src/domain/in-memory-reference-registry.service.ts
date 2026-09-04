import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryReferenceRegistry {
  private readonly propertyIds = new Set([
    'property-1',
    'property-2',
    'property-3',
    'property-4',
  ]);

  private readonly tenantPropertyIds = new Map([
    ['tenant-1', 'property-1'],
    ['tenant-2', 'property-2'],
    ['tenant-3', 'property-3'],
    ['tenant-4', 'property-4'],
  ]);

  private readonly contractPropertyIds = new Map([
    ['contract-1', 'property-1'],
    ['contract-2', 'property-2'],
    ['contract-3', 'property-3'],
    ['contract-4', 'property-4'],
  ]);

  assertProperty(propertyId: string): void {
    if (!this.propertyIds.has(propertyId)) {
      throw new Error(`Property ${propertyId} not found`);
    }
  }

  assertContractReference(propertyId: string, tenantId: string): void {
    this.assertProperty(propertyId);
    const tenantPropertyId = this.tenantPropertyIds.get(tenantId);
    if (!tenantPropertyId) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    if (tenantPropertyId !== propertyId) {
      throw new Error(`Tenant ${tenantId} does not belong to property ${propertyId}`);
    }
  }

  assertPaymentReference(propertyId: string, contractId: string): void {
    this.assertProperty(propertyId);
    const contractPropertyId = this.contractPropertyIds.get(contractId);
    if (!contractPropertyId) {
      throw new Error(`Contract ${contractId} not found`);
    }
    if (contractPropertyId !== propertyId) {
      throw new Error(`Contract ${contractId} does not belong to property ${propertyId}`);
    }
  }

  registerProperty(propertyId: string): void {
    this.propertyIds.add(propertyId);
  }

  registerTenant(tenantId: string, propertyId: string): void {
    this.assertProperty(propertyId);
    this.tenantPropertyIds.set(tenantId, propertyId);
  }

  registerContract(contractId: string, propertyId: string): void {
    this.assertProperty(propertyId);
    this.contractPropertyIds.set(contractId, propertyId);
  }

  removeProperty(propertyId: string): void {
    this.propertyIds.delete(propertyId);
  }

  removeTenant(tenantId: string): void {
    this.tenantPropertyIds.delete(tenantId);
  }

  removeContract(contractId: string): void {
    this.contractPropertyIds.delete(contractId);
  }
}
