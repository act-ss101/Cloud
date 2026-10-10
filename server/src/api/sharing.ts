/**
 * Sharing API Routes
 * 
 * Handles file/folder sharing:
 * - Create share links
 * - List share links
 * - Update share permissions
 * - Revoke share links
 * - Access shared files (public)
 */

import { Router, Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { query } from '../db/pool.js';
import { requireAuth, verifyOwnership, logAuditEvent } from '../auth/middleware.js';
import bcrypt from 'bcryptjs';

const router = Router();

// All routes require authentication (except public access)
router.use(requireAuth);

/**
 * POST /api/sharing
 * Create a new share link
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const { resourceId, resourceType, password, expiresAt, permission } = req.body;

    if (!resourceId || !resourceType) {
      res.status(400).json({ error: 'resourceId and resourceType are required' });
      return;
    }

    if (!['file', 'folder'].includes(resourceType)) {
      res.status(400).json({ error: 'resourceType must be "file" or "folder"' });
      return;
    }

    // Verify ownership
    const hasAccess = await verifyOwnership(userId, tenantId, resourceType, resourceId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Generate share token
    const shareToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(shareToken).digest('hex');

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create share link
    const result = await query(
      `INSERT INTO share_links (
        token_hash, resource_id, resource_type, owner_id, tenant_id,
        password_hash, expires_at, permission, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, resource_id, resource_type, permission, expires_at, created_at`,
      [tokenHash, resourceId, resourceType, userId, tenantId, passwordHash, expiresAt || null, permission || 'view']
    );

    const share = result.rows[0];

    await logAuditEvent(userId, 'share_created', resourceType, resourceId, {
      shareId: share.id,
      permission: share.permission,
    }, req.ip);

    res.status(201).json({
      share: {
        id: share.id,
        token: shareToken, // Return token only once
        resourceId: share.resource_id,
        resourceType: share.resource_type,
        permission: share.permission,
        expiresAt: share.expires_at,
        createdAt: share.created_at,
        url: `/s/${shareToken}`,
      },
    });
  } catch (err: any) {
    console.error('[Sharing] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * GET /api/sharing
 * List all share links for current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;

    const result = await query(
      `SELECT sl.*, 
       CASE WHEN sl.resource_type = 'file' THEN f.name ELSE fo.name END as resource_name
       FROM share_links sl
       LEFT JOIN files f ON f.id = sl.resource_id AND sl.resource_type = 'file'
       LEFT JOIN folders fo ON fo.id = sl.resource_id AND sl.resource_type = 'folder'
       WHERE sl.owner_id = $1 AND sl.tenant_id = $2
       ORDER BY sl.created_at DESC`,
      [userId, tenantId]
    );

    const shares = result.rows.map(s => ({
      id: s.id,
      resourceId: s.resource_id,
      resourceName: s.resource_name,
      resourceType: s.resource_type,
      permission: s.permission,
      expiresAt: s.expires_at,
      isActive: s.is_active,
      viewCount: s.view_count,
      downloadCount: s.download_count,
      createdAt: s.created_at,
    }));

    res.json({ shares });
  } catch (err: any) {
    console.error('[Sharing] List error:', err.message);
    res.status(500).json({ error: 'Failed to list shares' });
  }
});

/**
 * PATCH /api/sharing/:id
 * Update share link
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const shareId = req.params.id;
    const { permission, expiresAt, isActive, password } = req.body;

    // Verify ownership
    const shareResult = await query(
      `SELECT * FROM share_links WHERE id = $1 AND owner_id = $2 AND tenant_id = $3`,
      [shareId, userId, tenantId]
    );

    if (shareResult.rows.length === 0) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }

    // Update fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (permission !== undefined) {
      updates.push(`permission = $${paramCount++}`);
      values.push(permission);
    }

    if (expiresAt !== undefined) {
      updates.push(`expires_at = $${paramCount++}`);
      values.push(expiresAt);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (password !== undefined) {
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(passwordHash);
      } else {
        updates.push(`password_hash = NULL`);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(shareId);

    await query(
      `UPDATE share_links SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    await logAuditEvent(userId, 'share_updated', 'share', shareId, { updates: req.body }, req.ip);

    res.json({ message: 'Share link updated' });
  } catch (err: any) {
    console.error('[Sharing] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update share link' });
  }
});

/**
 * DELETE /api/sharing/:id
 * Revoke share link
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const shareId = req.params.id;

    // Verify ownership
    const shareResult = await query(
      `SELECT * FROM share_links WHERE id = $1 AND owner_id = $2 AND tenant_id = $3`,
      [shareId, userId, tenantId]
    );

    if (shareResult.rows.length === 0) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }

    await query('DELETE FROM share_links WHERE id = $1', [shareId]);

    await logAuditEvent(userId, 'share_revoked', 'share', shareId, undefined, req.ip);

    res.json({ message: 'Share link revoked' });
  } catch (err: any) {
    console.error('[Sharing] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

export default router;
