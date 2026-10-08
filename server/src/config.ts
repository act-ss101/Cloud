/**
 * CloudVault Server Configuration
 * 
 * Environment variables should be set before starting the server.
 * Never hardcode credentials.
 */

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  
  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  
  // Storage
  storage: {
    localRoot: string;
    maxFileSize: number; // bytes
    trashRetentionDays: number;
  };
  
  // Session
  session: {
    secret: string;
    maxAge: number; // ms
    secure: boolean;
  };
  
  // Security
  security: {
    corsOrigins: string[];
    rateLimitWindow: number; // ms
    rateLimitMax: number;
    bcryptRounds: number;
  };
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT ?? '4000', 10),
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      name: process.env.DB_NAME ?? 'cloudvault',
      user: process.env.DB_USER ?? 'cloudvault',
      password: requireEnv('DB_PASSWORD', ''),
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONN ?? '20', 10),
    },
    
    storage: {
      localRoot: process.env.STORAGE_ROOT ?? './data/storage',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? String(5 * 1024 * 1024 * 1024), 10), // 5GB default
      trashRetentionDays: parseInt(process.env.TRASH_RETENTION_DAYS ?? '30', 10),
    },
    
    session: {
      secret: requireEnv('SESSION_SECRET', 'dev-secret-change-me'),
      maxAge: parseInt(process.env.SESSION_MAX_AGE ?? String(24 * 60 * 60 * 1000), 10), // 24h
      secure: process.env.SESSION_SECURE === 'true',
    },
    
    security: {
      corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173').split(','),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW ?? String(15 * 60 * 1000), 10), // 15min
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    },
  };
}

export const config = loadConfig();
