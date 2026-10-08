/**
 * Stats API Routes
 * 
 * Provides statistics and metrics:
 * - Storage usage
 * - File counts
 * - Upload/download stats
 * - Backup status
 * - System health
 */

import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/stats/overview
 * Get overview statistics
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;

    // Get storage usage
    const storageResult = await query(
      `SELECT 
       COALESCE(SUM(size_bytes), 0) as total_size,
       COUNT(*) as file_count
       FROM files
       WHERE owner_id = $1 AND tenant_id = $2 AND is_trashed = false`,
      [userId, tenantId]
    );

    // Get folder count
    const folderResult = await query(
      `SELECT COUNT(*) as folder_count
       FROM folders
       WHERE owner_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    // Get trashed items
    const trashResult = await query(
      `SELECT 
       COUNT(*) as trashed_count,
       COALESCE(SUM(size_bytes), 0) as trashed_size
       FROM files
       WHERE owner_id = $1 AND tenant_id = $2 AND is_trashed = true`,
      [userId, tenantId]
    );

    // Get share count
    const shareResult = await query(
      `SELECT COUNT(*) as share_count
       FROM share_links
       WHERE owner_id = $1 AND tenant_id = $2 AND is_active = true`,
      [userId, tenantId]
    );

    // Get tenant quota
    const quotaResult = await query(
      `SELECT storage_quota_bytes FROM tenants WHERE id = $1`,
      [tenantId]
    );

    const storage = storageResult.rows[0];
    const folders = folderResult.rows[0];
    const trash = trashResult.rows[0];
    const shares = shareResult.rows[0];
    const quota = quotaResult.rows[0];

    res.json({
      storage: {
        used: parseInt(storage.total_size),
        quota: quota?.storage_quota_bytes || 10737418240, // 10GB default
        percentage: quota ? (parseInt(storage.total_size) / quota.storage_quota_bytes) * 100 : 0,
      },
      files: {
        count: parseInt(storage.file_count),
      },
      folders: {
        count: parseInt(folders.folder_count),
      },
      trash: {
        count: parseInt(trash.trashed_count),
        size: parseInt(trash.trashed_size),
      },
      shares: {
        active: parseInt(shares.share_count),
      },
    });
  } catch (err: any) {
    console.error('[Stats] Overview error:', err.message);
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
});

/**
 * GET /api/stats/activity
 * Get recent activity
 */
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await query(
      `SELECT 
       event_type,
       resource_type,
       resource_id,
       details,
       created_at
       FROM audit_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const activities = result.rows.map(a => ({
      type: a.event_type,
      resourceType: a.resource_type,
      resourceId: a.resource_id,
      details: a.details,
      timestamp: a.created_at,
    }));

    res.json({ activities });
  } catch (err: any) {
    console.error('[Stats] Activity error:', err.message);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

/**
 * GET /api/stats/storage
 * Get detailed storage breakdown
 */
router.get('/storage', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;

    // Get storage by file type
    const typeResult = await query(
      `SELECT 
       COALESCE(SPLIT_PART(mime_type, '/', 1), 'unknown') as file_type,
       COUNT(*) as count,
       COALESCE(SUM(size_bytes), 0) as total_size
       FROM files
       WHERE owner_id = $1 AND tenant_id = $2 AND is_trashed = false
       GROUP BY file_type
       ORDER BY total_size DESC`,
      [userId, tenantId]
    );

    // Get storage by pool
    const poolResult = await query(
      `SELECT 
       storage_pool,
       COUNT(*) as count,
       COALESCE(SUM(size_bytes), 0) as total_size
       FROM files
       WHERE owner_id = $1 AND tenant_id = $2 AND is_trashed = false
       GROUP BY storage_pool`,
      [userId, tenantId]
    );

    // Get recent uploads
    const recentResult = await query(
      `SELECT 
       id,
       name,
       size_bytes,
       mime_type,
       created_at
       FROM files
       WHERE owner_id = $1 AND tenant_id = $2 AND is_trashed = false
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, tenantId]
    );

    res.json({
      byType: typeResult.rows.map(r => ({
        type: r.file_type,
        count: parseInt(r.count),
        size: parseInt(r.total_size),
      })),
      byPool: poolResult.rows.map(r => ({
        pool: r.storage_pool,
        count: parseInt(r.count),
        size: parseInt(r.total_size),
      })),
      recentUploads: recentResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        size: r.size_bytes,
        mimeType: r.mime_type,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[Stats] Storage error:', err.message);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

export default router;
