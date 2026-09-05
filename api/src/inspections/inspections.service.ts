import { Injectable, Optional } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Inspection, CreateInspectionInput, UpdateInspectionInput } from './inspection.js';
import { validateInspection } from './inspection.js';
import { inspections, properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedPrincipal } from '../auth/principal.js';
import { randomUUID } from 'node:crypto';
import { InMemoryReferenceRegistry } from '../domain/in-memory-reference-registry.service.js';

type InspectionRow = typeof inspections.$inferSelect;

export function mapInspectionRow(row: InspectionRow): Inspection {
  const inspection: Inspection = {
    id: row.id,
    propertyId: row.propertyId,
    type: row.type,
    scheduledDate: row.scheduledDate,
    status: row.status,
    priority: row.priority,
  };
  if (row.completedAt) inspection.completedAt = row.completedAt;
  return inspection;
}

@Injectable()
export class InspectionsService {
  constructor(
    @Optional() private readonly databaseService?: DatabaseService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly references?: InMemoryReferenceRegistry,
  ) {}

  private readonly inspections: Inspection[] = [
    { id: 'inspection-1', propertyId: 'property-1', type: '소방 안전', scheduledDate: '2026-09-06', status: 'Scheduled', priority: 'Routine' },
    { id: 'inspection-2', propertyId: 'property-2', type: '냉난방 설비', scheduledDate: '2026-08-09', status: 'Completed', priority: 'Routine', completedAt: '2026-08-10' },
    { id: 'inspection-3', propertyId: 'property-4', type: '전기 안전', scheduledDate: '2026-09-12', status: 'InReview', priority: 'Urgent' },
    { id: 'inspection-4', propertyId: 'property-3', type: '외벽 점검', scheduledDate: '2026-09-18', status: 'Pending', priority: 'Routine' },
  ];

  async findAll(): Promise<Inspection[]> {
    const database = this.databaseService?.client;
    const records = database
      ? (await database.select().from(inspections).orderBy(asc(inspections.id))).map(mapInspectionRow)
      : this.inspections;
    records.forEach((inspection) => validateInspection(inspection));
    return records;
  }

  async create(input: CreateInspectionInput, principal?: AuthenticatedPrincipal): Promise<Inspection> {
    if (!input.propertyId || !input.type || !input.scheduledDate || !input.status || !input.priority) {
      throw new Error('Inspection requires propertyId, type, scheduledDate, status, and priority');
    }

    const item: Inspection = {
      id: `inspection-temp`,
      ...input,
    };
    validateInspection(item);

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        // 외래키 검증: propertyId 존재 확인
        const [propertyExists] = await transaction.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
        if (!propertyExists) {
          throw new Error(`Property ${input.propertyId}을(를) 찾을 수 없습니다`);
        }

        const [row] = await transaction.insert(inspections).values({
          id: `inspection-${randomUUID()}`,
          propertyId: input.propertyId,
          type: input.type,
          scheduledDate: input.scheduledDate,
          status: input.status,
          priority: input.priority,
        }).returning();

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'inspection.created',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'inspection',
            entityId: row.id,
            metadata: { propertyId: input.propertyId, type: input.type, priority: input.priority },
          });
        }

        return mapInspectionRow(row);
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
    const item2: Inspection = {
      id: `inspection-${this.inspections.length + 1}`,
      ...input,
    };
    this.inspections.push(item2);
    return item2;
  }

  async update(id: string, input: UpdateInspectionInput, principal?: AuthenticatedPrincipal): Promise<Inspection> {
    if (Object.keys(input).length === 0) {
      throw new Error('At least one field is required to update');
    }

    const database = this.databaseService?.client;
    if (database) {
      return database.transaction(async (transaction) => {
        const [current] = await transaction.select().from(inspections).where(eq(inspections.id, id)).for('update');
        if (!current) throw new Error(`Inspection ${id} not found`);
        const [row] = await transaction
          .update(inspections)
          .set({
            ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate }),
            ...(input.priority !== undefined && { priority: input.priority }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.completedAt !== undefined && { completedAt: input.completedAt }),
            ...(input.status !== undefined && input.status !== 'Completed' && { completedAt: null }),
          })
          .where(eq(inspections.id, id))
          .returning();

        if (!row) {
          throw new Error(`Inspection ${id} not found`);
        }

        const item = mapInspectionRow(row);
        validateInspection(item);

        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'inspection.updated',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'inspection',
            entityId: id,
            metadata: { changes: input, previousCompletion: { completedAt: current.completedAt } },
          });
        }

        return item;
      });
    }

    const item = this.inspections.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Inspection ${id} not found`);
    }

    const updated: Inspection = {
      ...item,
      ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.completedAt !== undefined && { completedAt: input.completedAt }),
    };
    if (input.status !== undefined && input.status !== 'Completed') delete updated.completedAt;
    validateInspection(updated);

    this.inspections[this.inspections.indexOf(item)] = updated;
    return updated;
  }

  async delete(id: string, principal?: AuthenticatedPrincipal): Promise<void> {
    const database = this.databaseService?.client;
    if (database) {
      await database.transaction(async (transaction) => {
        const [row] = await transaction
          .delete(inspections)
          .where(eq(inspections.id, id))
          .returning();
        if (!row) {
          throw new Error('Inspection ' + id + ' not found');
        }
        if (this.auditService) {
          await this.auditService.record(transaction, {
            action: 'inspection.deleted',
            actorSubject: principal?.subject ?? 'system',
            actorRole: principal?.role ?? 'system',
            entityType: 'inspection',
            entityId: id,
            metadata: {},
          });
        }
      });
      return;
    }

    const index = this.inspections.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Inspection ' + id + ' not found');
    }
    this.inspections.splice(index, 1);
  }
}
