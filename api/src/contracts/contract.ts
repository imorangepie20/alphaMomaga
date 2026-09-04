export type ContractStatus = 'Upcoming' | 'Active' | 'Expired' | 'Terminated';

export type Contract = {
  id: string;
  propertyId: string;
  tenantId: string;
  unit: string;
  monthlyRent: string;
  startDate: string;
  endDate: string;
  billingDay: number;
  dueDay: number;
  billingEnabled: boolean;
  status: ContractStatus;
  terminatedAt?: string;
};

export type CreateContractInput = {
  propertyId: string;
  tenantId: string;
  unit: string;
  monthlyRent: string;
  startDate: string;
  endDate: string;
  billingDay?: number;
  dueDay?: number;
  billingEnabled?: boolean;
  status: ContractStatus;
};

export type UpdateContractInput = {
  status?: ContractStatus;
  terminatedAt?: string;
};

export type RenewContractInput = {
  startDate: string;
  endDate: string;
  monthlyRent: string;
};

export function validateContract(
  contract: Contract,
  referenceDate = new Date(),
): void {
  validateBillingDay(contract.billingDay);
  validateDueDay(contract.dueDay);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (
    !datePattern.test(contract.startDate) ||
    !datePattern.test(contract.endDate)
  ) {
    throw new Error(`Contract ${contract.id} must use ISO calendar dates`);
  }

  const startDate = new Date(`${contract.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${contract.endDate}T00:00:00.000Z`);
  const startIsValid =
    !Number.isNaN(startDate.getTime()) &&
    startDate.toISOString().slice(0, 10) === contract.startDate;
  const endIsValid =
    !Number.isNaN(endDate.getTime()) &&
    endDate.toISOString().slice(0, 10) === contract.endDate;
  if (!startIsValid || !endIsValid || contract.startDate >= contract.endDate) {
    throw new Error(
      `Contract ${contract.id} must have a valid start date before its end date`,
    );
  }

  const today = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  if (contract.status === 'Upcoming' && today >= startDate) {
    throw new Error(
      `Contract ${contract.id} cannot be upcoming after its start date`,
    );
  }
  if (contract.status === 'Active' && (today < startDate || today > endDate)) {
    throw new Error(
      `Contract ${contract.id} must be within its active lease dates`,
    );
  }
  if (contract.status === 'Expired' && today <= endDate) {
    throw new Error(
      `Contract ${contract.id} cannot be expired before its end date`,
    );
  }
  if (contract.status === 'Terminated') {
    if (!contract.terminatedAt || !datePattern.test(contract.terminatedAt)) {
      throw new Error(`Contract ${contract.id} requires a termination date`);
    }
    const terminatedAt = new Date(`${contract.terminatedAt}T00:00:00.000Z`);
    if (
      Number.isNaN(terminatedAt.getTime()) ||
      terminatedAt < startDate ||
      terminatedAt > today
    ) {
      throw new Error(
        `Contract ${contract.id} has an invalid termination date`,
      );
    }
  }
}

export function validateBillingDay(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error('Contract billingDay must be an integer between 1 and 31');
  }
}

export function validateDueDay(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error('Contract dueDay must be an integer between 1 and 31');
  }
}
