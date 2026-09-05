import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type DatabaseHealth = {
  status: 'ok' | 'unconfigured' | 'error';
  message?: string;
};

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly connectionString = process.env.DATABASE_URL;
  private pool?: Pool;
  private db?: NodePgDatabase<typeof schema>;

  get configured(): boolean {
    return Boolean(this.connectionString);
  }

  private getPool(): Pool {
    this.pool ??= new Pool({ connectionString: this.connectionString });
    return this.pool;
  }

  get client(): NodePgDatabase<typeof schema> | undefined {
    if (!this.connectionString) return undefined;
    if (!this.db) {
      this.db = drizzle(this.getPool(), { schema });
    }
    return this.db;
  }

  async health(): Promise<DatabaseHealth> {
    if (!this.connectionString) return { status: 'unconfigured' };

    try {
      await this.getPool().query('select 1');
      return { status: 'ok' };
    } catch {
      return { status: 'error', message: 'Database connection failed' };
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
