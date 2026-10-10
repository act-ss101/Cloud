/**
 * PostgreSQL Connection Pool
 * 
 * Uses pg (node-postgres) for connection management.
 * Supports connection pooling, prepared statements, and transactions.
 * 
 * Future: Can be replaced with Go service using same schema
 * without changing API contract.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config.js';
import { runMigrations } from './migrations.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await getPool().query<T>(text, params);
  const duration = Date.now() - start;
  
  if (config.nodeEnv === 'development') {
    console.log(`[DB] ${text.substring(0, 60)}... (${duration}ms, ${result.rowCount} rows)`);
  }
  
  return result;
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing database...');
  await runMigrations(getPool());
  console.log('[DB] Database initialized successfully');
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Connection pool closed');
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1');
    return result.rowCount !== null && result.rowCount > 0;
  } catch {
    return false;
  }
}
