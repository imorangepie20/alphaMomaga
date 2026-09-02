import { mapPropertyRow, PropertiesService } from './properties.service.js';

describe('PropertiesService', () => {
  it('returns the property records needed by the portfolio screen when the database is unconfigured', async () => {
    const properties = await new PropertiesService().findAll();

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

  it('maps database occupancy integers to the public percentage contract', () => {
    expect(mapPropertyRow({
      id: 'property-db',
      name: 'DB Asset',
      location: 'Seoul, KR',
      type: 'Apartment',
      occupancy: 96,
      status: 'Occupied',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })).toEqual(expect.objectContaining({ id: 'property-db', occupancy: '96%' }));
  });
});