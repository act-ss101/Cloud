/**
 * Authentication API Routes
 * 
 * Handles user registration, login, logout, and session management.
 * Uses bcrypt for password hashing.
 * Sessions stored in database with hashed tokens.
 */

import { Router, Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import { query } from '../db/pool.js';
import { createSession, destroySession, requireAuth, logAuditEvent } from '../auth/middleware.js';
import { config } from '../config.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await hash(password, config.security.bcryptRounds);

    // Create tenant for user (personal tenant)
    const tenantResult = await query(
      `INSERT INTO tenants (name) VALUES ($1) RETURNING id`,
      [`${displayName}'s Vault`]
    );
    const tenantId = tenantResult.rows[0].id;

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, display_name, tenant_id, role)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id, email, display_name, tenant_id, role`,
      [email.toLowerCase(), passwordHash, displayName, tenantId]
    );

    // Update tenant owner
    await query('UPDATE tenants SET owner_id = $1 WHERE id = $2', [userResult.rows[0].id, tenantId]);

    const user = userResult.rows[0];

    // Create session
    const token = await createSession(
      user.id,
      user.tenant_id,
      user.role,
      req.ip,
      req.headers['user-agent']
    );

    // Set session cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: config.session.secure,
      sameSite: 'lax',
      maxAge: config.session.maxAge,
      path: '/',
    });

    await logAuditEvent(user.id, 'user_registered', 'user', user.id, { email }, req.ip);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, display_name, tenant_id, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Verify password
    const validPassword = await compare(password, user.password_hash);
    if (!validPassword) {
      await logAuditEvent(user.id, 'login_failed', 'user', user.id, { reason: 'bad_password' }, req.ip);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Create session
    const token = await createSession(
      user.id,
      user.tenant_id,
      user.role,
      req.ip,
      req.headers['user-agent']
    );

    // Set session cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: config.session.secure,
      sameSite: 'lax',
      maxAge: config.session.maxAge,
      path: '/',
    });

    await logAuditEvent(user.id, 'login_success', 'user', user.id, undefined, req.ip);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy current session
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session_token || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await destroySession(token);
    }

    await logAuditEvent(req.userId, 'logout', 'user', req.userId, undefined, req.ip);

    res.clearCookie('session_token');
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('[Auth] Logout error:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, display_name, tenant_id, role FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        tenantId: user.tenant_id,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
