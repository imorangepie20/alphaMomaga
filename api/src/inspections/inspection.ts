export type InspectionStatus = 'Pending' | 'Scheduled' | 'InReview' | 'Completed';
export type InspectionPriority = 'Routine' | 'Urgent';

export type Inspection = {
  id: string;
  propertyId: string;
  type: string;
  scheduledDate: string;
  status: InspectionStatus;
  priority: InspectionPriority;
  completedAt?: string;
};

export type CreateInspectionInput = {
  propertyId: string;
  type: string;
  scheduledDate: string;
  status: InspectionStatus;
  priority: InspectionPriority;
};

export type UpdateInspectionInput = {
  status?: InspectionStatus;
  completedAt?: string;
};

export function validateInspection(item: Inspection, referenceDate = new Date()): void {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const scheduledDate = new Date(`${item.scheduledDate}T00:00:00.000Z`);
  if (!item.id || !item.propertyId || !item.type || !datePattern.test(item.scheduledDate) || Number.isNaN(scheduledDate.getTime()) || scheduledDate.toISOString().slice(0, 10) !== item.scheduledDate) {
    throw new Error(`Inspection ${item.id} is invalid`);
  }
  if (item.status === 'Completed') {
    const completedAt = item.completedAt
      ? new Date(`${item.completedAt}T00:00:00.000Z`)
      : undefined;
    const today = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
    if (!item.completedAt || !datePattern.test(item.completedAt) || !completedAt || Number.isNaN(completedAt.getTime()) || completedAt < scheduledDate || completedAt > today) {
      throw new Error(`Inspection ${item.id} has an invalid completion date`);
    }
  }
}