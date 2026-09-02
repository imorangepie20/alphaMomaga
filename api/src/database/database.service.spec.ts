import { DatabaseService } from './database.service.js';

describe('DatabaseService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('reports an unconfigured database without opening a connection', async () => {
    delete process.env.DATABASE_URL;
    const service = new DatabaseService();

    expect(service.configured).toBe(false);
    await expect(service.health()).resolves.toEqual({ status: 'unconfigured' });
  });

  it('recognizes configured database settings without connecting at construction', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/property_manager';
    const service = new DatabaseService();

    expect(service.configured).toBe(true);
  });
});