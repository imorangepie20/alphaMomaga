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
  result?: string;
};

export type CreateInspectionInput = {
  propertyId: string;
  type: string;
  scheduledDate: string;
  status: InspectionStatus;
  priority: InspectionPriority;
  completedAt?: string;
  result?: string;
};

export type UpdateInspectionInput = {
  scheduledDate?: string;
  priority?: InspectionPriority;
  status?: InspectionStatus;
  completedAt?: string;
  result?: string;
};

export function validateInspection(item: Inspection, referenceDate = new Date(), requireResult = false): void {
  if (!['Pending', 'Scheduled', 'InReview', 'Completed'].includes(item.status) || !['Routine', 'Urgent'].includes(item.priority)) throw new Error(`Inspection ${item.id} has invalid status or priority`);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const scheduledDate = new Date(`${item.scheduledDate}T00:00:00.000Z`);
  if (!item.id || !item.propertyId || !item.type || !datePattern.test(item.scheduledDate) || Number.isNaN(scheduledDate.getTime()) || scheduledDate.toISOString().slice(0, 10) !== item.scheduledDate) {
    throw new Error(`Inspection ${item.id} is invalid`);
  }
  if (item.status === 'Completed') {
    if ((requireResult || item.result !== undefined) && (typeof item.result !== 'string' || !item.result.trim() || item.result.length > 4000)) throw new Error('Inspection result must contain 1 to 4000 characters');
    const completedAt = item.completedAt
      ? new Date(`${item.completedAt}T00:00:00.000Z`)
      : undefined;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(referenceDate);
    if (!item.completedAt || !datePattern.test(item.completedAt) || !completedAt || Number.isNaN(completedAt.getTime()) || completedAt.toISOString().slice(0, 10) !== item.completedAt || item.completedAt > today) {
      throw new Error(`Inspection ${item.id} has an invalid completion date`);
    }
  }
  if (item.status !== 'Completed' && (item.result !== undefined || (requireResult && item.completedAt !== undefined))) throw new Error('Only completed inspections can have completion evidence');
}
