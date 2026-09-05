import { DatabaseService } from './database.service.js';
import { Pool } from 'pg';

vi.mock('pg', () => ({
  Pool: vi.fn(class {
    query = vi.fn().mockResolvedValue({ rows: [] });
    end = vi.fn().mockResolvedValue(undefined);
  }),
}));

describe('DatabaseService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    vi.clearAllMocks();
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
    expect(Pool).not.toHaveBeenCalled();
  });

  it('queries the database on the first health check and reuses the pool for the client', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/property_manager';
    const service = new DatabaseService();

    await expect(service.health()).resolves.toEqual({ status: 'ok' });
    expect(Pool).toHaveBeenCalledTimes(1);
    const pool = vi.mocked(Pool).mock.results[0].value as Pool;
    expect(pool.query).toHaveBeenCalledWith('select 1');
    expect(service.client).toBeDefined();
    await service.health();
    expect(Pool).toHaveBeenCalledTimes(1);
    await service.onApplicationShutdown();
    expect(pool.end).toHaveBeenCalledOnce();
  });

  it('does not report a healthy database when the first connection fails', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/property_manager';
    vi.mocked(Pool).mockImplementationOnce(class {
      query = vi.fn().mockRejectedValue(new Error('private connection details'));
      end = vi.fn().mockResolvedValue(undefined);
    } as unknown as typeof Pool);
    const service = new DatabaseService();

    await expect(service.health()).resolves.toEqual({
      status: 'error', message: 'Database connection failed',
    });
    await service.onApplicationShutdown();
  });
});
