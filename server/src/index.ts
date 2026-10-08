/**
 * CloudVault Server Entry Point
 * 
 * Express.js server with:
 * - Session-based authentication
 * - File management API
 * - Storage abstraction
 * - PostgreSQL metadata
 * - Audit logging
 * 
 * Designed for future migration to Go service
 * without changing API contract.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { initializeDatabase, closePool, healthCheck } from './db/pool.js';
import authRouter from './api/auth.js';
import filesRouter from './api/files.js';
import versionsRouter from './api/versions.js';
import sharingRouter from './api/sharing.js';
import statsRouter from './api/stats.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (development)
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint (no auth required)
app.get('/api/health', async (_req, res) => {
  const dbHealthy = await healthCheck();
  const storageHealthy = true; // Will be implemented with storage router
  
  const status = dbHealthy && storageHealthy ? 'healthy' : 'degraded';
  const httpStatus = status === 'healthy' ? 200 : 503;
  
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy ? 'ok' : 'error',
      storage: storageHealthy ? 'ok' : 'error',
    },
    version: '1.0.0-alpha',
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/sharing', sharingRouter);
app.use('/api/stats', statsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    console.log('[Server] Starting CloudVault API...');
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    
    // Initialize database
    await initializeDatabase();
    
    // Start listening
    app.listen(config.port, config.host, () => {
      console.log(`[Server] Listening on ${config.host}:${config.port}`);
      console.log(`[Server] Storage root: ${config.storage.localRoot}`);
    });
  } catch (err: any) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down...');
  await closePool();
  process.exit(0);
});

// Start if run directly
start();

export { app };
