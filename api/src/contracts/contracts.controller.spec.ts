import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { AuthService } from '../auth/auth.service.js';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: ContractsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        {
          provide: ContractsService,
          useValue: {
            findAll: vi.fn().mockResolvedValue([
              {
                id: 'contract-1',
                propertyId: 'property-1',
                tenantId: 'tenant-1',
                unit: 'A-101',
                monthlyRent: '₩1,200,000',
                startDate: '2026-01-01',
                endDate: '2027-08-31',
                status: 'Active',
              },
            ]),
            create: vi.fn().mockResolvedValue({
              id: 'contract-new',
              propertyId: 'property-1',
              tenantId: 'tenant-1',
              unit: 'A-102',
              monthlyRent: '₩1,500,000',
              startDate: '2026-03-01',
              endDate: '2027-02-28',
              status: 'Upcoming',
            }),
            update: vi.fn().mockResolvedValue({
              id: 'contract-1',
              propertyId: 'property-1',
              tenantId: 'tenant-1',
              unit: 'A-101',
              monthlyRent: '₩1,200,000',
              startDate: '2026-01-01',
              endDate: '2027-08-31',
              status: 'Expired',
            }),
            renew: vi.fn().mockResolvedValue({
              id: 'contract-renewed',
              propertyId: 'property-1',
              tenantId: 'tenant-1',
              unit: 'A-101',
              monthlyRent: '??,300,000',
              startDate: '2027-09-01',
              endDate: '2028-08-31',
              status: 'Upcoming',
            }),
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

    controller = moduleRef.get(ContractsController);
    service = moduleRef.get(ContractsService);
  });

  describe('findAll', () => {
    it('should return all contracts', async () => {
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new contract', async () => {
      const input = {
        propertyId: 'property-1',
        tenantId: 'tenant-1',
        unit: 'A-102',
        monthlyRent: '₩1,500,000',
        startDate: '2026-03-01',
        endDate: '2027-02-28',
        status: 'Upcoming' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.create(input, mockRequest);
      expect(result).toMatchObject({
        id: 'contract-new',
        propertyId: 'property-1',
      });
      expect(service.create).toHaveBeenCalledWith(input, mockRequest.user);
    });

    it('should throw BadRequestException when service throws error', async () => {
      const input = {
        propertyId: 'invalid-id',
        tenantId: 'tenant-1',
        unit: 'A-102',
        monthlyRent: '₩1,500,000',
        startDate: '2026-03-01',
        endDate: '2027-02-28',
        status: 'Upcoming' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;
      (service.create as any).mockRejectedValueOnce(
        new Error('Property not found'),
      );

      expect(async () => {
        await controller.create(input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a contract', async () => {
      const input = {
        status: 'Expired' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.update('contract-1', input, mockRequest);
      expect(result).toMatchObject({
        id: 'contract-1',
        status: 'Expired',
      });
      expect(service.update).toHaveBeenCalledWith(
        'contract-1',
        input,
        mockRequest.user,
      );
    });

    it('should throw BadRequestException when service throws error', async () => {
      const input = {
        status: 'Expired' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;
      (service.update as any).mockRejectedValueOnce(
        new Error('Contract not found'),
      );

      expect(async () => {
        await controller.update('non-existent-id', input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('renew', () => {
    it('forwards the authenticated principal to the renewal service', async () => {
      const input = {
        startDate: '2027-09-01',
        endDate: '2028-08-31',
        monthlyRent: '??,300,000',
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.renew('contract-1', input, mockRequest);

      expect(result).toMatchObject({
        id: 'contract-renewed',
        status: 'Upcoming',
      });
      expect(service.renew).toHaveBeenCalledWith(
        'contract-1',
        input,
        mockRequest.user,
      );
    });
  });
});
