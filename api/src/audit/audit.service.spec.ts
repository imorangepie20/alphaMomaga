import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from './audit.service.js';
import { DatabaseService } from '../database/database.service.js';

describe('AuditService', () => {
  let service: AuditService;

  describe('record', () => {
    it('writes a tenant creation event through the supplied database executor', async () => {
      const insert = () => ({
        values: async (value: Record<string, unknown>) => value,
      });
      const database = { insert } as never;

      await expect(new AuditService().record(database, {
        action: 'tenant.created',
        actorSubject: 'user-1',
        actorRole: 'PropertyManager',
        entityType: 'tenant',
        entityId: 'tenant-1',
      })).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          AuditService,
          {
            provide: DatabaseService,
            useValue: {
              client: undefined, // Simulates no database connection
            },
          },
        ],
      }).compile();

      service = moduleRef.get(AuditService);
    });

    it('should return empty array when database is not configured', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return empty array with filters when database is not configured', async () => {
      const result = await service.findAll({
        entityType: 'property',
        limit: 10,
      });
      expect(result).toEqual([]);
    });
  });
});