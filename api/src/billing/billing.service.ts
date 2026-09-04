import { Injectable, Optional } from '@nestjs/common';
import { ContractsService } from '../contracts/contracts.service.js';
import type { Contract } from '../contracts/contract.js';
import { billingMonthBounds, calculateDueDate, type MonthlyCharge } from './billing.js';

function parseWon(value: string): number {
  const digits = value.replaceAll(/[^0-9]/g, '');
  const amountWon = Number.parseInt(digits, 10);
  if (!Number.isSafeInteger(amountWon) || amountWon <= 0) {
    throw new Error(`Invalid won amount: ${value}`);
  }
  return amountWon;
}

function isEligibleForBillingMonth(contract: Contract, billingMonth: string): boolean {
  if (contract.status !== 'Active' || !contract.billingEnabled) return false;
  const { startDate, endDate } = billingMonthBounds(billingMonth);
  return contract.startDate <= endDate && contract.endDate >= startDate;
}

@Injectable()
export class BillingService {
  private readonly charges: MonthlyCharge[] = [];

  constructor(@Optional() private readonly contractsService?: ContractsService) {}

  async generateMonth(billingMonth: string, referenceDate = new Date()): Promise<MonthlyCharge[]> {
    if (!this.contractsService) {
      throw new Error('BillingService requires ContractsService');
    }

    const contracts = await this.contractsService.findAll(referenceDate);
    const generated: MonthlyCharge[] = [];
    for (const contract of contracts) {
      if (!isEligibleForBillingMonth(contract, billingMonth)) continue;
      if (this.charges.some((charge) => charge.contractId === contract.id && charge.billingMonth === billingMonth)) continue;

      const baseRentWon = parseWon(contract.monthlyRent);
      const charge: MonthlyCharge = {
        id: `charge-${contract.id}-${billingMonth}`,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        contractId: contract.id,
        billingMonth,
        dueDate: calculateDueDate(billingMonth, contract.dueDay),
        baseRentWon,
        adjustmentWon: 0,
        billedWon: baseRentWon,
        receivedWon: 0,
        outstandingWon: baseRentWon,
        status: 'Draft',
      };
      this.charges.push(charge);
      generated.push(charge);
    }
    return generated;
  }
}
