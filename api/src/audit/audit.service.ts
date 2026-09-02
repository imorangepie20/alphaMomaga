import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema.js';
import { auditLogs } from '../database/schema.js';

type DatabaseExecutor = Pick<NodePgDatabase<typeof schema>, 'insert'>;

export type AuditEvent = {
  action: string;
  actorSubject: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
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
}