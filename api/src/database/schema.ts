import { boolean, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const propertyStatus = pgEnum('property_status', ['Occupied', 'Active', 'Pending']);
export const tenantPaymentStatus = pgEnum('tenant_payment_status', ['Paid', 'Pending', 'Overdue']);
export const contractStatus = pgEnum('contract_status', ['Upcoming', 'Active', 'Expired', 'Terminated']);
export const paymentStatus = pgEnum('payment_status', ['Paid', 'Pending', 'Overdue', 'Cancelled']);
export const monthlyChargeStatus = pgEnum('monthly_charge_status', ['Draft', 'Approved', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled']);
export const paymentMethod = pgEnum('payment_method', ['BankTransfer', 'Cash', 'Card', 'Other']);
export const maintenanceStatus = pgEnum('maintenance_status', ['Pending', 'Scheduled', 'InProgress', 'Completed']);
export const inspectionStatus = pgEnum('inspection_status', ['Pending', 'Scheduled', 'InReview', 'Completed']);
export const inspectionPriority = pgEnum('inspection_priority', ['Routine', 'Urgent']);

export const properties = pgTable('properties', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  location: varchar('location', { length: 200 }).notNull(),
  type: varchar('type', { length: 80 }).notNull(),
  occupancy: integer('occupancy').notNull(),
  status: propertyStatus('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  unit: varchar('unit', { length: 40 }).notNull(),
  rentWon: integer('rent_won').notNull(),
  status: tenantPaymentStatus('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contracts = pgTable('contracts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id).notNull(),
  unit: varchar('unit', { length: 40 }).notNull(),
  monthlyRentWon: integer('monthly_rent_won').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  billingDay: integer('billing_day').notNull().default(1),
  dueDay: integer('due_day').notNull().default(5),
  billingEnabled: boolean('billing_enabled').notNull().default(true),
  status: contractStatus('status').notNull(),
  terminatedAt: date('terminated_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  contractId: varchar('contract_id', { length: 64 }).references(() => contracts.id).notNull(),
  amountWon: integer('amount_won').notNull(),
  dueDate: date('due_date').notNull(),
  status: paymentStatus('status').notNull(),
  paidAt: date('paid_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const monthlyCharges = pgTable('monthly_charges', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id).notNull(),
  contractId: varchar('contract_id', { length: 64 }).references(() => contracts.id).notNull(),
  billingMonth: varchar('billing_month', { length: 7 }).notNull(),
  dueDate: date('due_date').notNull(),
  baseRentWon: integer('base_rent_won').notNull(),
  adjustmentWon: integer('adjustment_won').notNull().default(0),
  billedWon: integer('billed_won').notNull(),
  receivedWon: integer('received_won').notNull().default(0),
  outstandingWon: integer('outstanding_won').notNull(),
  status: monthlyChargeStatus('status').notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: varchar('approved_by', { length: 255 }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: varchar('cancelled_by', { length: 255 }),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  contractMonthUnique: uniqueIndex('monthly_charges_contract_month_unique').on(table.contractId, table.billingMonth),
  propertyMonthIndex: index('monthly_charges_property_month_idx').on(table.propertyId, table.billingMonth),
  tenantMonthIndex: index('monthly_charges_tenant_month_idx').on(table.tenantId, table.billingMonth),
}));

export const paymentReceipts = pgTable('payment_receipts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id).notNull(),
  receivedDate: date('received_date').notNull(),
  amountWon: integer('amount_won').notNull(),
  method: paymentMethod('method').notNull(),
  reference: varchar('reference', { length: 160 }),
  memo: text('memo'),
  recordedBy: varchar('recorded_by', { length: 255 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: varchar('voided_by', { length: 255 }),
  voidReason: text('void_reason'),
}, (table) => ({
  propertyTenantIndex: index('payment_receipts_property_tenant_idx').on(table.propertyId, table.tenantId),
}));

export const paymentAllocations = pgTable('payment_allocations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  receiptId: varchar('receipt_id', { length: 64 }).references(() => paymentReceipts.id).notNull(),
  chargeId: varchar('charge_id', { length: 64 }).references(() => monthlyCharges.id).notNull(),
  amountWon: integer('amount_won').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  receiptIndex: index('payment_allocations_receipt_idx').on(table.receiptId),
  chargeIndex: index('payment_allocations_charge_idx').on(table.chargeId),
}));

export const maintenance = pgTable('maintenance', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  task: text('task').notNull(),
  dueDate: date('due_date').notNull(),
  status: maintenanceStatus('status').notNull(),
  completedAt: date('completed_at'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inspections = pgTable('inspections', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  type: varchar('type', { length: 120 }).notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  status: inspectionStatus('status').notNull(),
  priority: inspectionPriority('priority').notNull(),
  completedAt: date('completed_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  action: varchar('action', { length: 80 }).notNull(),
  actorSubject: varchar('actor_subject', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 40 }).notNull(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: varchar('entity_id', { length: 64 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityIndex: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actorIndex: index('audit_logs_actor_created_idx').on(table.actorSubject, table.createdAt),
}));
