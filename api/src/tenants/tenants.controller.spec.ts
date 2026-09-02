import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { AuthService } from '../auth/auth.service.js';

describe('TenantsController', () => {
  let controller: TenantsController;
  let service: TenantsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: {
            findAll: vi.fn().mockResolvedValue([
              {
                id: 'tenant-1',
                name: 'Kim Jihoon',
                propertyId: 'property-1',
                unit: 'A-101',
                rent: '₩1,200,000',
                status: 'Paid',
              },
            ]),
            create: vi.fn().mockResolvedValue({
              id: 'tenant-new',
              name: 'New Tenant',
              propertyId: 'property-1',
              unit: 'A-102',
              rent: '₩1,500,000',
              status: 'Pending',
            }),
            update: vi.fn().mockResolvedValue({
              id: 'tenant-1',
              name: 'Updated Tenant',
              propertyId: 'property-1',
              unit: 'A-101',
              rent: '₩1,500,000',
              status: 'Paid',
            }),
            delete: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verify: vi.fn(),
          },
        },
        {
          provide: 'RolesService',
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({})
      .overrideGuard(PermissionsGuard)
      .useValue({})
      .compile();

    controller = moduleRef.get(TenantsController);
    service = moduleRef.get(TenantsService);
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const input = {
        name: 'New Tenant',
        propertyId: 'property-1',
        unit: 'A-102',
        rent: '₩1,500,000',
        status: 'Pending' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.create(input, mockRequest);
      expect(result).toMatchObject({
        id: 'tenant-new',
        name: 'New Tenant',
      });
      expect(service.create).toHaveBeenCalledWith(input, mockRequest.user);
    });

    it('should throw BadRequestException when name is missing', async () => {
      const input = {
        name: '',
        propertyId: 'property-1',
        unit: 'A-102',
        rent: '₩1,500,000',
        status: 'Pending' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;
      (service.create as any).mockRejectedValueOnce(new Error('Invalid tenant input'));

      expect(async () => {
        await controller.create(input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const input = {
        name: 'Updated Tenant',
        rent: 1500000,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.update('tenant-1', input, mockRequest);
      expect(result).toMatchObject({
        id: 'tenant-1',
        name: 'Updated Tenant',
      });
      expect(service.update).toHaveBeenCalledWith('tenant-1', input, mockRequest.user);
    });

    it('should throw BadRequestException when no fields provided', async () => {
      const input = {};
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      expect(async () => {
        await controller.update('tenant-1', input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a tenant', async () => {
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.delete('tenant-1', mockRequest);
      expect(result).toEqual({ message: '임차인이 삭제되었습니다' });
      expect(service.delete).toHaveBeenCalledWith('tenant-1', mockRequest.user);
    });
  });
});
