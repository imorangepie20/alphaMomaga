export type TenantPaymentStatus = 'Paid' | 'Overdue' | 'Pending';

export type Tenant = {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  rent: string;
  status: TenantPaymentStatus;
};

export type CreateTenantInput = Omit<Tenant, 'id' | 'status' | 'rent'> & { rent: number | string };

export type UpdateTenantInput = {
  name?: string;
  unit?: string;
  rent?: number;
};
