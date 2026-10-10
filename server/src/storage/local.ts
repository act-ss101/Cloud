/**
 * Local Filesystem Storage Backend
 * 
 * Implements StorageBackend interface using local filesystem.
 * Features:
 * - Streaming read/write (no full file load into RAM)
 * - SHA-256 integrity verification during write
 * - Path traversal protection
 * - Atomic writes with temp files
 * - Directory structure: root/pool/userId/fileKey
 */

import { Readable } from 'stream';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync, unlinkSync, readdirSync, copyFileSync, renameSync } from 'fs';
import { join, resolve, dirname, relative, normalize, sep } from 'path';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { tmpdir } from 'os';
import type { StorageBackend, StorageObject } from './interface.js';

export class LocalStorageBackend implements StorageBackend {
  readonly type = 'local';
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = resolve(rootPath);
    if (!existsSync(this.rootPath)) {
      mkdirSync(this.rootPath, { recursive: true });
    }
  }

  /**
   * Resolve a key to a safe filesystem path.
   * Prevents path traversal attacks by:
   * 1. Rejecting keys with '..' or absolute paths
   * 2. Verifying resolved path is within root
   */
  private safePath(key: string): string {
    // Reject suspicious keys
    if (key.includes('..') || key.startsWith('/') || key.startsWith('\\')) {
      throw new Error(`Invalid storage key: ${key}`);
    }

    // Normalize and resolve
    const normalized = normalize(key).replace(/\.\./g, '');
    const fullPath = resolve(this.rootPath, normalized);
    
    // Verify containment
    const relativePath = relative(this.rootPath, fullPath);
    if (relativePath.startsWith('..') || resolve(this.rootPath, relativePath) !== fullPath) {
      throw new Error(`Path traversal detected: ${key}`);
    }

    return fullPath;
  }

  async healthCheck(): Promise<boolean> {
    try {
      return existsSync(this.rootPath);
    } catch {
      return false;
    }
  }

  /**
   * Write object from stream with SHA-256 verification.
   * Uses atomic write pattern: write to temp file, then rename.
   * Never loads entire file into memory.
   */
  async putObject(
    key: string,
    stream: Readable,
    _size: number,
    metadata?: Record<string, string>
  ): Promise<{ sha256: string; size: number }> {
    const targetPath = this.safePath(key);
    const dir = dirname(targetPath);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write to temp file first (atomic write pattern)
    const tempPath = join(tmpdir(), `cv-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const hash = createHash('sha256');
    let totalSize = 0;

    try {
      // Create write stream
      const writeStream = createWriteStream(tempPath);
      
      // Pipe through hash calculator
      const hashStream = new (await import('stream')).Transform({
        transform(chunk, _encoding, callback) {
          hash.update(chunk);
          totalSize += chunk.length;
          callback(null, chunk);
        },
      });

      await pipeline(stream, hashStream, writeStream);

      // Atomic rename
      renameSync(tempPath, targetPath);

      // Store metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        const metaPath = targetPath + '.meta.json';
        const { writeFileSync } = await import('fs');
        writeFileSync(metaPath, JSON.stringify(metadata));
      }

      return {
        sha256: hash.digest('hex'),
        size: totalSize,
      };
    } catch (err) {
      // Cleanup temp file on error
      if (existsSync(tempPath)) {
        try { unlinkSync(tempPath); } catch { /* ignore */ }
      }
      throw err;
    }
  }

  /**
   * Get object as readable stream.
   * Does not load entire file into memory.
   */
  async getObject(key: string): Promise<{
    stream: Readable;
    size: number;
    metadata?: Record<string, string>;
  }> {
    const filePath = this.safePath(key);
    
    if (!existsSync(filePath)) {
      throw new Error(`Object not found: ${key}`);
    }

    const stat = statSync(filePath);
    const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks

    // Load metadata if exists
    let metadata: Record<string, string> | undefined;
    const metaPath = filePath + '.meta.json';
    if (existsSync(metaPath)) {
      try {
        const { readFileSync } = await import('fs');
        metadata = JSON.parse(readFileSync(metaPath, 'utf-8'));
      } catch { /* ignore metadata read errors */ }
    }

    return { stream, size: stat.size, metadata };
  }

  async headObject(key: string): Promise<StorageObject | null> {
    const filePath = this.safePath(key);
    
    if (!existsSync(filePath)) {
      return null;
    }

    const stat = statSync(filePath);
    return {
      key,
      size: stat.size,
      lastModified: stat.mtime,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.safePath(key);
    
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // Also remove metadata file
    const metaPath = filePath + '.meta.json';
    if (existsSync(metaPath)) {
      unlinkSync(metaPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.safePath(key);
    return existsSync(filePath);
  }

  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const sourcePath = this.safePath(sourceKey);
    const destPath = this.safePath(destKey);
    
    const dir = dirname(destPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(sourcePath, destPath);
  }

  async listObjects(prefix: string, maxKeys: number = 1000): Promise<StorageObject[]> {
    const dirPath = this.safePath(prefix);
    const results: StorageObject[] = [];

    if (!existsSync(dirPath)) {
      return results;
    }

    const listRecursive = (dir: string, depth: number = 0) => {
      if (results.length >= maxKeys || depth > 10) return;
      
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= maxKeys) break;
          if (entry.name.endsWith('.meta.json')) continue;
          
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            listRecursive(fullPath, depth + 1);
          } else {
            const stat = statSync(fullPath);
            const relativeKey = relative(this.rootPath, fullPath).split(sep).join('/');
            results.push({
              key: relativeKey,
              size: stat.size,
              lastModified: stat.mtime,
            });
          }
        }
      } catch { /* ignore permission errors */ }
    };

    listRecursive(dirPath);
    return results.slice(0, maxKeys);
  }
}
