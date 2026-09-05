import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';
import type { AuditLog } from './audit.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesModule } from '../roles/roles.module.js';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditLogs: AuditLog[] = [
    {
      id: 'audit-1',
      action: 'property.created',
      actorSubject: 'user-1',
      actorRole: 'admin',
      entityType: 'property',
      entityId: 'property-1',
      metadata: { address: '123 Main St' },
      createdAt: new Date('2025-01-01T10:00:00Z'),
    },
    {
      id: 'audit-2',
      action: 'tenant.created',
      actorSubject: 'user-1',
      actorRole: 'admin',
      entityType: 'tenant',
      entityId: 'tenant-1',
      metadata: { name: 'John Doe' },
      createdAt: new Date('2025-01-01T11:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, RolesModule],
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: vi.fn().mockResolvedValue(mockAuditLogs),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuditController);
    service = moduleRef.get(AuditService);
  });

  describe('findAll', () => {
    it('should return all audit logs', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockAuditLogs);
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: undefined,
        entityId: undefined,
        action: undefined,
        actorSubject: undefined,
        limit: 100,
        offset: 0,
      });
    });

    it('should filter by entityType', async () => {
      await controller.findAll('property', undefined, undefined, undefined, '10', '0');
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: 'property',
        entityId: undefined,
        action: undefined,
        actorSubject: undefined,
        limit: 10,
        offset: 0,
      });
    });

    it('should filter by entityId', async () => {
      await controller.findAll(undefined, 'tenant-1', undefined, undefined, '20', '0');
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: undefined,
        entityId: 'tenant-1',
        action: undefined,
        actorSubject: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by action', async () => {
      await controller.findAll(undefined, undefined, 'tenant.created', undefined, '10', '0');
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: undefined,
        entityId: undefined,
        action: 'tenant.created',
        actorSubject: undefined,
        limit: 10,
        offset: 0,
      });
    });

    it('should filter by actorSubject', async () => {
      await controller.findAll(undefined, undefined, undefined, 'user-1', '10', '0');
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: undefined,
        entityId: undefined,
        action: undefined,
        actorSubject: 'user-1',
        limit: 10,
        offset: 0,
      });
    });

    it('should support pagination', async () => {
      await controller.findAll(undefined, undefined, undefined, undefined, '25', '50');
      expect(service.findAll).toHaveBeenCalledWith({
        entityType: undefined,
        entityId: undefined,
        action: undefined,
        actorSubject: undefined,
        limit: 25,
        offset: 50,
      });
    });
  });
});
