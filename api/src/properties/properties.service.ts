import { Injectable } from '@nestjs/common';
import type { Property } from './property.js';

@Injectable()
export class PropertiesService {
  private readonly properties: Property[] = [
    {
      id: 'property-1',
      name: 'Seoul Heights Tower',
      location: 'Seoul, KR',
      type: 'Apartment',
      occupancy: '96%',
      status: 'Occupied',
    },
    {
      id: 'property-2',
      name: 'Hana Village',
      location: 'Busan, KR',
      type: 'Townhouse',
      occupancy: '88%',
      status: 'Active',
    },
    {
      id: 'property-3',
      name: 'Blue Park Residences',
      location: 'Incheon, KR',
      type: 'Officetel',
      occupancy: '82%',
      status: 'Pending',
    },
    {
      id: 'property-4',
      name: 'Riverside Point',
      location: 'Daegu, KR',
      type: 'Commercial',
      occupancy: '91%',
      status: 'Occupied',
    },
  ];

  findAll(): Property[] {
    return this.properties;
  }
}