export type MaintenanceStatus = 'Pending' | 'Scheduled' | 'InProgress' | 'Completed';

export type Maintenance = {
  id: string;
  propertyId: string;
  task: string;
  dueDate: string;
  status: MaintenanceStatus;
  completedAt?: string;
  resolution?: string;
};

export type CreateMaintenanceInput = {
  propertyId: string;
  task: string;
  dueDate: string;
  status: MaintenanceStatus;
  completedAt?: string;
  resolution?: string;
};

export type UpdateMaintenanceInput = {
  status?: MaintenanceStatus;
  dueDate?: string;
  completedAt?: string;
  resolution?: string;
};

export function validateMaintenance(item: Maintenance, requireCompletion = false, referenceDate = new Date()): void {
  const date = new Date(`${item.dueDate}T00:00:00.000Z`);
  if (!item.id || !item.propertyId || !item.task) throw new Error(`Maintenance ${item.id} is incomplete`);
  if (!['Pending', 'Scheduled', 'InProgress', 'Completed'].includes(item.status)) throw new Error('Invalid maintenance status');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== item.dueDate) {
    throw new Error(`Maintenance ${item.id} must use a valid ISO due date`);
  }
  if (item.status !== 'Completed' && (item.completedAt !== undefined || item.resolution !== undefined)) throw new Error('Only completed maintenance can have completion evidence');
  if (item.status === 'Completed' && (requireCompletion || item.completedAt !== undefined || item.resolution !== undefined)) {
    const date = new Date(`${item.completedAt}T00:00:00.000Z`);
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(referenceDate);
    const today = ['year', 'month', 'day'].map((key) => parts.find((part) => part.type === key)?.value).join('-');
    if (!item.completedAt || !/^\d{4}-\d{2}-\d{2}$/.test(item.completedAt) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== item.completedAt || item.completedAt > today) throw new Error('A valid completion date no later than today is required');
    if (typeof item.resolution !== 'string' || !item.resolution.trim() || item.resolution.length > 4000) throw new Error('Completion result must contain 1 to 4000 characters');
  }
}

export function applyMaintenanceUpdate(item: Maintenance, input: UpdateMaintenanceInput): Maintenance {
  const updated: Maintenance = {
    ...item,
    ...(input.status !== undefined && { status: input.status }),
    ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    ...(input.completedAt !== undefined && { completedAt: input.completedAt }),
    ...(input.resolution !== undefined && { resolution: typeof input.resolution === 'string' ? input.resolution.trim() : input.resolution }),
  };
  if (input.status !== undefined && input.status !== 'Completed' && item.status === 'Completed') {
    delete updated.completedAt;
    delete updated.resolution;
  }
  validateMaintenance(updated, true);
  return updated;
}
