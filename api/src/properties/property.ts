export type PropertyStatus = 'Occupied' | 'Active' | 'Pending';

export type Property = {
  id: string;
  name: string;
  location: string;
  type: string;
  occupancy: string;
  status: PropertyStatus;
};

export type CreatePropertyInput = {
  name: string;
  location: string;
  type: string;
  occupancy?: number; // 0-100, default 0
  status?: PropertyStatus; // default 'Active'
};

export type UpdatePropertyInput = {
  name?: string;
  location?: string;
  type?: string;
  occupancy?: number;
  status?: PropertyStatus;
};

export function validateProperty(property: Property | (CreatePropertyInput & { id?: string })): void {
  if (!property.name || typeof property.name !== 'string' || property.name.trim().length === 0) {
    throw new Error('Property name is required');
  }
  if (!property.location || typeof property.location !== 'string' || property.location.trim().length === 0) {
    throw new Error('Property location is required');
  }
  if (!property.type || typeof property.type !== 'string' || property.type.trim().length === 0) {
    throw new Error('Property type is required');
  }
  if ('occupancy' in property && property.occupancy !== undefined) {
    const occupancy = typeof property.occupancy === 'string' 
      ? parseInt(property.occupancy.replace('%', ''), 10) 
      : property.occupancy;
    if (isNaN(occupancy) || occupancy < 0 || occupancy > 100) {
      throw new Error('Property occupancy must be between 0 and 100');
    }
  }
  if ('status' in property && property.status !== undefined) {
    const validStatuses: PropertyStatus[] = ['Occupied', 'Active', 'Pending'];
    if (!validStatuses.includes(property.status)) {
      throw new Error(`Property status must be one of: ${validStatuses.join(', ')}`);
    }
  }
}