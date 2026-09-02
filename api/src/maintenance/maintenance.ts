export type MaintenanceStatus = 'Pending' | 'Scheduled' | 'InProgress' | 'Completed';

export type Maintenance = {
  id: string;
  propertyId: string;
  task: string;
  dueDate: string;
  status: MaintenanceStatus;
};

export function validateMaintenance(item: Maintenance): void {
  const date = new Date(`${item.dueDate}T00:00:00.000Z`);
  if (!item.id || !item.propertyId || !item.task) throw new Error(`Maintenance ${item.id} is incomplete`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== item.dueDate) {
    throw new Error(`Maintenance ${item.id} must use a valid ISO due date`);
  }
}