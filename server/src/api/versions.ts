/**
 * Versions API Routes
 * 
 * Handles file version history:
 * - List versions for a file
 * - Get specific version
 * - Restore to previous version
 * - Compare versions
 * - Delete old versions (retention policy)
 */

import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, verifyOwnership, logAuditEvent } from '../auth/middleware.js';
import { storageRouter } from '../storage/router.js';
import { createHash } from 'crypto';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/versions/:fileId
 * List all versions of a file
 */
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const fileId = req.params.fileId;

    // Verify file ownership
    const hasAccess = await verifyOwnership(userId, tenantId, 'file', fileId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get file metadata
    const fileResult = await query(
      `SELECT id, name, version, size_bytes, sha256_hash, storage_key, storage_pool, updated_at
       FROM files WHERE id = $1`,
      [fileId]
    );

    if (fileResult.rows.length === 0) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const currentFile = fileResult.rows[0];

    // Get version history
    const versionsResult = await query(
      `SELECT id, version, size_bytes, sha256_hash, storage_key, created_at
       FROM file_versions
       WHERE file_id = $1
       ORDER BY version DESC`,
      [fileId]
    );

    // Combine current version with history
    const versions = [
      {
        id: currentFile.id,
        version: currentFile.version,
        size: currentFile.size_bytes,
        sha256: currentFile.sha256_hash,
        storageKey: currentFile.storage_key,
        createdAt: currentFile.updated_at,
        isCurrent: true,
      },
      ...versionsResult.rows.map(v => ({
        id: v.id,
        version: v.version,
        size: v.size_bytes,
        sha256: v.sha256_hash,
        storageKey: v.storage_key,
        createdAt: v.created_at,
        isCurrent: false,
      })),
    ];

    res.json({
      fileId: currentFile.id,
      fileName: currentFile.name,
      versions,
    });
  } catch (err: any) {
    console.error('[Versions] List error:', err.message);
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

/**
 * GET /api/versions/:fileId/:versionId/download
 * Download a specific version
 */
router.get('/:fileId/:versionId/download', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const fileId = req.params.fileId;
    const versionId = req.params.versionId;

    // Verify file ownership
    const hasAccess = await verifyOwnership(userId, tenantId, 'file', fileId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get version info
    let storageKey: string;
    let fileName: string;
    let sha256: string;

    if (versionId === 'current') {
      // Download current version
      const fileResult = await query(
        `SELECT name, storage_key, sha256_hash FROM files WHERE id = $1`,
        [fileId]
      );
      if (fileResult.rows.length === 0) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      const file = fileResult.rows[0];
      storageKey = file.storage_key;
      fileName = file.name;
      sha256 = file.sha256_hash;
    } else {
      // Download specific version
      const versionResult = await query(
        `SELECT fv.storage_key, f.name, fv.sha256_hash
         FROM file_versions fv
         JOIN files f ON f.id = fv.file_id
         WHERE fv.id = $1 AND fv.file_id = $2`,
        [versionId, fileId]
      );
      if (versionResult.rows.length === 0) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }
      const version = versionResult.rows[0];
      storageKey = version.storage_key;
      fileName = version.name;
      sha256 = version.sha256_hash;
    }

    // Stream file
    const backend = storageRouter.getDefaultBackend();
    const { stream, size } = await backend.getObject(storageKey);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('X-File-Hash', sha256);

    stream.pipe(res);
  } catch (err: any) {
    console.error('[Versions] Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

/**
 * POST /api/versions/:fileId/:versionId/restore
 * Restore file to a previous version
 */
router.post('/:fileId/:versionId/restore', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const fileId = req.params.fileId;
    const versionId = req.params.versionId;

    // Verify file ownership
    const hasAccess = await verifyOwnership(userId, tenantId, 'file', fileId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get current file info
    const currentFile = await query(
      `SELECT * FROM files WHERE id = $1`,
      [fileId]
    );

    if (currentFile.rows.length === 0) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const file = currentFile.rows[0];

    // Save current version to history before restoring
    await query(
      `INSERT INTO file_versions (file_id, version, size_bytes, sha256_hash, storage_key)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileId, file.version, file.size_bytes, file.sha256_hash, file.storage_key]
    );

    if (versionId === 'current') {
      // No-op if restoring to current
      res.json({ message: 'Already at current version' });
      return;
    }

    // Get target version
    const versionResult = await query(
      `SELECT * FROM file_versions WHERE id = $1 AND file_id = $2`,
      [versionId, fileId]
    );

    if (versionResult.rows.length === 0) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    const targetVersion = versionResult.rows[0];

    // Update file to point to target version
    await query(
      `UPDATE files SET 
       storage_key = $1, 
       size_bytes = $2, 
       sha256_hash = $3,
       version = version + 1,
       updated_at = NOW()
       WHERE id = $4`,
      [targetVersion.storage_key, targetVersion.size_bytes, targetVersion.sha256_hash, fileId]
    );

    // Delete the restored version from history (it's now current)
    await query('DELETE FROM file_versions WHERE id = $1', [versionId]);

    await logAuditEvent(userId, 'version_restored', 'file', fileId, { 
      fromVersion: file.version,
      toVersion: targetVersion.version 
    }, req.ip);

    res.json({ message: 'Version restored successfully' });
  } catch (err: any) {
    console.error('[Versions] Restore error:', err.message);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

/**
 * GET /api/versions/:fileId/:versionId/verify
 * Verify integrity of a specific version
 */
router.get('/:fileId/:versionId/verify', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const tenantId = req.tenantId!;
    const fileId = req.params.fileId;
    const versionId = req.params.versionId;

    // Verify file ownership
    const hasAccess = await verifyOwnership(userId, tenantId, 'file', fileId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    let storageKey: string;
    let expectedHash: string;

    if (versionId === 'current') {
      const fileResult = await query(
        `SELECT storage_key, sha256_hash FROM files WHERE id = $1`,
        [fileId]
      );
      if (fileResult.rows.length === 0) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      storageKey = fileResult.rows[0].storage_key;
      expectedHash = fileResult.rows[0].sha256_hash;
    } else {
      const versionResult = await query(
        `SELECT storage_key, sha256_hash FROM file_versions WHERE id = $1 AND file_id = $2`,
        [versionId, fileId]
      );
      if (versionResult.rows.length === 0) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }
      storageKey = versionResult.rows[0].storage_key;
      expectedHash = versionResult.rows[0].sha256_hash;
    }

    // Verify hash
    const backend = storageRouter.getDefaultBackend();
    const { stream } = await backend.getObject(storageKey);
    const hash = createHash('sha256');
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }

    const actualHash = hash.digest('hex');
    const isValid = actualHash === expectedHash;

    res.json({
      fileId,
      versionId,
      expectedHash,
      actualHash,
      isValid,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Versions] Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
