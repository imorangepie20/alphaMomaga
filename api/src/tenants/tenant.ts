export type TenantPaymentStatus = 'Paid' | 'Overdue' | 'Pending';

export type Tenant = {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  rent: string;
  status: TenantPaymentStatus;
};

export type CreateTenantInput = Omit<Tenant, 'id'>;

export type UpdateTenantInput = {
  name?: string;
  unit?: string;
  rent?: number;
  status?: TenantPaymentStatus;
};