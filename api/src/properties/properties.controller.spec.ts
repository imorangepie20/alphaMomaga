import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { AuthService } from '../auth/auth.service.js';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let service: PropertiesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: {
            findAll: vi.fn().mockResolvedValue([
              {
                id: 'property-1',
                name: 'Seoul Heights Tower',
                location: 'Seoul, KR',
                type: 'Apartment',
                occupancy: '96%',
                status: 'Occupied',
              },
            ]),
            create: vi.fn().mockResolvedValue({
              id: 'property-new',
              name: 'New Property',
              location: 'Seoul, KR',
              type: 'Apartment',
              occupancy: '50%',
              status: 'Active',
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

    controller = moduleRef.get(PropertiesController);
    service = moduleRef.get(PropertiesService);
  });

  describe('findAll', () => {
    it('should return all properties', async () => {
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const input = {
        name: 'New Property',
        location: 'Seoul, KR',
        type: 'Apartment',
        occupancy: 50,
        status: 'Active' as const,
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.create(input, mockRequest);
      expect(result).toMatchObject({
        id: 'property-new',
        name: 'New Property',
      });
      expect(service.create).toHaveBeenCalledWith(input, mockRequest.user);
    });

    it('should throw BadRequestException when name is missing', async () => {
      const input = {
        name: '',
        location: 'Seoul, KR',
        type: 'Apartment',
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      expect(async () => {
        await controller.create(input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when location is missing', async () => {
      const input = {
        name: 'New Property',
        location: '',
        type: 'Apartment',
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      expect(async () => {
        await controller.create(input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when type is missing', async () => {
      const input = {
        name: 'New Property',
        location: 'Seoul, KR',
        type: '',
      };
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      expect(async () => {
        await controller.create(input, mockRequest);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a property', async () => {
      const mockRequest = { user: { subject: 'user-1', role: 'admin' } } as any;

      const result = await controller.delete('property-1', mockRequest);
      expect(result).toEqual({ message: '부동산이 삭제되었습니다' });
      expect(service.delete).toHaveBeenCalledWith('property-1', mockRequest.user);
    });
  });
});
