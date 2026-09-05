import { Injectable, Optional } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Maintenance, CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.js';
import { applyMaintenanceUpdate, validateMaintenance } from './maintenance.js';
import { maintenance, properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';
import { InMemoryReferenceRegistry } from '../domain/in-memory-reference-registry.service.js';

type MaintenanceRow = typeof maintenance.$inferSelect;

export function mapMaintenanceRow(row: MaintenanceRow): Maintenance {
  return { id: row.id, propertyId: row.propertyId, task: row.task, dueDate: row.dueDate, status: row.status, ...(row.completedAt && { completedAt: row.completedAt }), ...(row.resolution && { resolution: row.resolution }) };
}

@Injectable()
export class MaintenanceService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly references?: InMemoryReferenceRegistry,
  ) {}

  private readonly maintenance: Maintenance[] = [
    { id: 'maintenance-1', propertyId: 'property-1', task: '승강기 정기 점검', dueDate: '2026-09-07', status: 'Scheduled' },
    { id: 'maintenance-2', propertyId: 'property-2', task: '누수 보수', dueDate: '2026-09-09', status: 'InProgress' },
    { id: 'maintenance-3', propertyId: 'property-4', task: '냉난방기 정비', dueDate: '2026-08-14', status: 'Completed' },
    { id: 'maintenance-4', propertyId: 'property-3', task: '외벽 상태 점검', dueDate: '2026-09-22', status: 'Pending' },
  ];

  async findAll(): Promise<Maintenance[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(maintenance).orderBy(asc(maintenance.id))).map(mapMaintenanceRow)
      : this.maintenance;
    records.forEach((item) => validateMaintenance(item));
    return records;
  }

  async create(input: CreateMaintenanceInput, principal?: AuthenticatedPrincipal): Promise<Maintenance> {
    if (!input.propertyId || !input.task || !input.dueDate || !input.status) {
      throw new Error('Maintenance requires propertyId, task, dueDate, and status');
    }

    const item: Maintenance = {
      id: `maintenance-temp`,
      ...input,
    };
    if (typeof item.resolution === 'string') item.resolution = item.resolution.trim();
    validateMaintenance(item, true);

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        // 외래키 검증: propertyId 존재 확인
        const [propertyExists] = await transaction.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
        if (!propertyExists) {
          throw new Error(`Property ${input.propertyId}을(를) 찾을 수 없습니다`);
        }

        const [row] = await transaction.insert(maintenance).values({
          id: `maintenance-${randomUUID()}`,
          propertyId: input.propertyId,
          task: input.task,
          dueDate: input.dueDate,
          status: input.status,
          completedAt: item.completedAt,
          resolution: item.resolution,
        }).returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'maintenance.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'maintenance',
            entityId: row.id,
            metadata: { propertyId: input.propertyId, task: input.task, completedAt: item.completedAt, resolution: item.resolution },
          });
        }

        return mapMaintenanceRow(row);
      });
    }

    // 인-메모리 검증 (fixtures 데이터에 hardcoded)
    if (this.references) {
      this.references.assertProperty(input.propertyId);
    } else {
    const fixtureProperties = [
      { id: 'property-1' }, { id: 'property-2' }, { id: 'property-3' }, { id: 'property-4' },
    ];

    if (!fixtureProperties.find((p) => p.id === input.propertyId)) {
      throw new Error(`Property ${input.propertyId}을(를) 찾을 수 없습니다`);
    }

    }
    const item2: Maintenance = {
      ...item,
      id: `maintenance-${randomUUID()}`,
    };
    this.maintenance.push(item2);
    return item2;
  }

  async update(id: string, input: UpdateMaintenanceInput, principal?: AuthenticatedPrincipal): Promise<Maintenance> {
    if (Object.keys(input).length === 0) {
      throw new Error('At least one field is required to update');
    }

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [current] = await transaction.select().from(maintenance).where(eq(maintenance.id, id)).for('update');
        if (!current) throw new Error(`Maintenance ${id} not found`);
        const updated = applyMaintenanceUpdate(mapMaintenanceRow(current), input);
        const [row] = await transaction
          .update(maintenance)
          .set({
            ...(input.status !== undefined && { status: input.status }),
            ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
            completedAt: updated.completedAt ?? null,
            resolution: updated.resolution ?? null,
          })
          .where(eq(maintenance.id, id))
          .returning();

        if (!row) {
          throw new Error(`Maintenance ${id} not found`);
        }

        const item = mapMaintenanceRow(row);
        validateMaintenance(item);

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'maintenance.updated',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'maintenance',
            entityId: id,
            metadata: { changes: input, previousCompletion: { completedAt: current.completedAt, resolution: current.resolution } },
          });
        }

        return item;
      });
    }

    const item = this.maintenance.find((m) => m.id === id);
    if (!item) {
      throw new Error(`Maintenance ${id} not found`);
    }

    const updated = applyMaintenanceUpdate(item, input);

    this.maintenance[this.maintenance.indexOf(item)] = updated;
    return updated;
  }

  async delete(id: string, principal?: AuthenticatedPrincipal): Promise<void> {
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        const [row] = await transaction
          .delete(maintenance)
          .where(eq(maintenance.id, id))
          .returning();
        if (!row) {
          throw new Error('Maintenance ' + id + ' not found');
        }
        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'maintenance.deleted',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'maintenance',
            entityId: id,
            metadata: {},
          });
        }
      });
      return;
    }

    const index = this.maintenance.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Maintenance ' + id + ' not found');
    }
    this.maintenance.splice(index, 1);
  }
}
