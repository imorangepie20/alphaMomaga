import { PropertiesService } from './properties.service.js';

describe('PropertiesService', () => {
  it('returns the property records needed by the portfolio screen', () => {
    const properties = new PropertiesService().findAll();

    expect(properties).toHaveLength(4);
    expect(properties[0]).toEqual({
      id: 'property-1',
      name: 'Seoul Heights Tower',
      location: 'Seoul, KR',
      type: 'Apartment',
      occupancy: '96%',
      status: 'Occupied',
    });
  });
});