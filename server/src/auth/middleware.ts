/**
 * Authentication & Authorization Middleware
 * 
 * Session-based authentication using secure cookies.
 * Every file operation MUST verify ownership through the database.
 * NEVER trust userId from client - always derive from session.
 * 
 * Security principles:
 * - No anonymous file access
 * - Tenant isolation enforced at database level
 * - Session tokens stored as hashed values
 * - Automatic session cleanup
 */

import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import { query } from '../db/pool.js';
import { config } from '../config.js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      userRole?: string;
    }
  }
}

interface SessionData {
  userId: string;
  tenantId: string;
  role: string;
  expiresAt: Date;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Hash a session token for storage
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token + config.session.secret).digest('hex');
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  tenantId: string,
  role: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + config.session.maxAge);

  await query(
    `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, ipAddress, userAgent, expiresAt]
  );

  return token;
}

/**
 * Validate a session token and return session data
 */
export async function validateSession(token: string): Promise<SessionData | null> {
  const tokenHash = hashSessionToken(token);
  
  const result = await query(
    `SELECT s.*, u.tenant_id, u.role, u.is_active
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = true`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    expiresAt: row.expires_at,
  };
}

/**
 * Destroy a session
 */
export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
  return result.rowCount ?? 0;
}

/**
 * Authentication middleware
 * Extracts session from cookie or Authorization header
 * Sets req.userId, req.tenantId, req.userRole
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check for session token in cookie or header
  const token = req.cookies?.session_token || 
                req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Validate session asynchronously
  validateSession(token)
    .then((session) => {
      if (!session) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }

      req.userId = session.userId;
      req.tenantId = session.tenantId;
      req.userRole = session.role;
      next();
    })
    .catch((err) => {
      console.error('[Auth] Session validation error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
}

/**
 * Verify that the authenticated user owns the resource
 * Called within route handlers after requireAuth
 */
export async function verifyOwnership(
  userId: string,
  tenantId: string,
  resourceType: 'file' | 'folder',
  resourceId: string
): Promise<boolean> {
  const table = resourceType === 'file' ? 'files' : 'folders';
  
  const result = await query(
    `SELECT owner_id, tenant_id FROM ${table} WHERE id = $1`,
    [resourceId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const row = result.rows[0];
  return row.owner_id === userId && row.tenant_id === tenantId;
}

/**
 * Audit logging for security events
 */
export async function logAuditEvent(
  userId: string | undefined,
  eventType: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_events (user_id, event_type, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, eventType, resourceType, resourceId, details ? JSON.stringify(details) : null, ipAddress]
    );
  } catch (err) {
    console.error('[Audit] Failed to log event:', err);
  }
}
