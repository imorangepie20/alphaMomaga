const billingMonthPattern = /^(\d{4})-(\d{2})$/;

export type MonthlyChargeStatus = 'Draft' | 'Approved' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';

export type MonthlyCharge = {
  id: string;
  propertyId: string;
  tenantId: string;
  contractId: string;
  billingMonth: string;
  dueDate: string;
  baseRentWon: number;
  adjustmentWon: number;
  billedWon: number;
  receivedWon: number;
  outstandingWon: number;
  status: MonthlyChargeStatus;
};

export type PaymentMethod = 'BankTransfer' | 'Cash' | 'Card' | 'Other';

export type PaymentAllocationInput = {
  chargeId: string;
  amountWon: number;
};

export type PaymentReceiptInput = {
  propertyId: string;
  tenantId: string;
  receivedDate: string;
  amountWon: number;
  method: PaymentMethod;
  reference?: string;
  memo?: string;
  allocations: PaymentAllocationInput[];
};

export type PaymentReceipt = Omit<PaymentReceiptInput, 'allocations'> & {
  id: string;
  allocations: PaymentAllocationInput[];
};

export function parseBillingMonth(value: string): { year: number; month: number } {
  const match = billingMonthPattern.exec(value);
  if (!match) {
    throw new Error('billingMonth must use YYYY-MM format');
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (month < 1 || month > 12) {
    throw new Error('billingMonth must contain a calendar month');
  }
  return { year, month };
}

export function billingMonthBounds(billingMonth: string): { startDate: string; endDate: string } {
  const { year, month } = parseBillingMonth(billingMonth);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    startDate: `${billingMonth}-01`,
    endDate: `${billingMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function calculateDueDate(billingMonth: string, dueDay: number): string {
  const { year, month } = parseBillingMonth(billingMonth);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new Error('dueDay must be an integer between 1 and 31');
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${billingMonth}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`;
}

export function getBillingMonth(referenceDate: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(referenceDate);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  if (!year || !month) {
    throw new Error('Unable to derive the Seoul billing month');
  }
  return `${year}-${month}`;
}
