import { describe, it, expect } from 'vitest';
import { mapPropertyRow, PropertiesService } from './properties.service.js';

describe('PropertiesService', () => {
  describe('findAll', () => {
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
  });

  describe('create', () => {
    it('creates a new property with in-memory storage', async () => {
      const service = new PropertiesService();
      const created = await service.create({
        name: 'New Property',
        location: 'Seoul, KR',
        type: 'Apartment',
        occupancy: 50,
        status: 'Active',
      });

      expect(created).toMatchObject({
        name: 'New Property',
        location: 'Seoul, KR',
        type: 'Apartment',
        occupancy: '50%',
        status: 'Active',
      });
      expect(created.id).toBeDefined();
    });

    it('uses default occupancy and status if not provided', async () => {
      const service = new PropertiesService();
      const created = await service.create({
        name: 'Default Property',
        location: 'Busan, KR',
        type: 'Townhouse',
      });

      expect(created).toMatchObject({
        name: 'Default Property',
        location: 'Busan, KR',
        type: 'Townhouse',
        occupancy: '0%',
        status: 'Active',
      });
    });

    it('throws error when name is missing', async () => {
      const service = new PropertiesService();
      expect(async () => {
        await service.create({
          name: '',
          location: 'Seoul, KR',
          type: 'Apartment',
        });
      }).rejects.toThrow();
    });

    it('throws error when location is missing', async () => {
      const service = new PropertiesService();
      expect(async () => {
        await service.create({
          name: 'Test',
          location: '',
          type: 'Apartment',
        });
      }).rejects.toThrow();
    });

    it('throws error when type is missing', async () => {
      const service = new PropertiesService();
      expect(async () => {
        await service.create({
          name: 'Test',
          location: 'Seoul, KR',
          type: '',
        });
      }).rejects.toThrow();
    });

    it('throws error when occupancy is out of range', async () => {
      const service = new PropertiesService();
      expect(async () => {
        await service.create({
          name: 'Test',
          location: 'Seoul, KR',
          type: 'Apartment',
          occupancy: 101,
        });
      }).rejects.toThrow();
    });

    it('throws error when status is invalid', async () => {
      const service = new PropertiesService();
      expect(async () => {
        await service.create({
          name: 'Test',
          location: 'Seoul, KR',
          type: 'Apartment',
          status: 'Invalid' as any,
        });
      }).rejects.toThrow();
    });
  });

  describe('mapPropertyRow', () => {
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
});