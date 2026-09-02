import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { desc, and, eq, gte, lte } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema.js';
import { auditLogs } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';

type DatabaseExecutor = Pick<NodePgDatabase<typeof schema>, 'insert'>;

export type AuditEvent = {
  action: string;
  actorSubject: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  action: string;
  actorSubject: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

@Injectable()
export class AuditService {
  constructor(@Optional() private databaseService?: DatabaseService) {}

  async record(database: DatabaseExecutor, event: AuditEvent): Promise<void> {
    await database.insert(auditLogs).values({
      id: `audit-${randomUUID()}`,
      action: event.action,
      actorSubject: event.actorSubject,
      actorRole: event.actorRole,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  async findAll(filters?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    actorSubject?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const database = this.databaseService?.client;
    if (!database) {
      return [];
    }

    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.actorSubject) {
      conditions.push(eq(auditLogs.actorSubject, filters.actorSubject));
    }

    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    let records: any[];
    if (conditions.length > 0) {
      records = await database
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      records = await database
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return records.map((row) => ({
      id: row.id,
      action: row.action,
      actorSubject: row.actorSubject,
      actorRole: row.actorRole,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
    }));
  }
}