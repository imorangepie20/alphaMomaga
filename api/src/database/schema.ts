import { date, integer, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const propertyStatus = pgEnum('property_status', ['Occupied', 'Active', 'Pending']);
export const tenantPaymentStatus = pgEnum('tenant_payment_status', ['Paid', 'Pending', 'Overdue']);
export const contractStatus = pgEnum('contract_status', ['Upcoming', 'Active', 'Expired', 'Terminated']);
export const paymentStatus = pgEnum('payment_status', ['Paid', 'Pending', 'Overdue', 'Cancelled']);
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

export const maintenance = pgTable('maintenance', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  task: text('task').notNull(),
  dueDate: date('due_date').notNull(),
  status: maintenanceStatus('status').notNull(),
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