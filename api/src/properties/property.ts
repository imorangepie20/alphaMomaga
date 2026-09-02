export type PropertyStatus = 'Occupied' | 'Active' | 'Pending';

export type Property = {
  id: string;
  name: string;
  location: string;
  type: string;
  occupancy: string;
  status: PropertyStatus;
};