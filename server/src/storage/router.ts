/**
 * Storage Router Implementation
 * 
 * Routes operations to appropriate storage backends based on pool assignment.
 * Currently supports only 'local' pool.
 * Future: S3-compatible pools, NAS, cloud connectors.
 */

import type { StorageBackend, StorageRouter, StoragePoolConfig } from './interface.js';
import { LocalStorageBackend } from './local.js';
import { config } from '../config.js';

class StorageRouterImpl implements StorageRouter {
  private pools: Map<string, StoragePoolConfig> = new Map();

  constructor() {
    // Initialize default local pool
    const localBackend = new LocalStorageBackend(config.storage.localRoot);
    
    this.pools.set('local', {
      name: 'local',
      backend: localBackend,
      encryptionEnabled: false,
      maxObjectSize: config.storage.maxFileSize,
      description: 'Local filesystem storage (default)',
    });

    // Future pools can be added here:
    // this.pools.set('s3-primary', { ... });
    // this.pools.set('s3-backup', { ... });
  }

  getBackend(poolName: string): StorageBackend {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Unknown storage pool: ${poolName}`);
    }
    return pool.backend;
  }

  getDefaultBackend(): StorageBackend {
    return this.getBackend('local');
  }

  getPoolConfig(poolName: string): StoragePoolConfig {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Unknown storage pool: ${poolName}`);
    }
    return pool;
  }

  getAvailablePools(): string[] {
    return Array.from(this.pools.keys());
  }
}

// Singleton instance
export const storageRouter = new StorageRouterImpl();
