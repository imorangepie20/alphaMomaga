export type TenantPaymentStatus = 'Paid' | 'Overdue' | 'Pending';

export type Tenant = {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  rent: string;
  status: TenantPaymentStatus;
};