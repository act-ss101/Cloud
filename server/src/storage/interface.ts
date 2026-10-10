/**
 * Storage Abstraction Interface
 * 
 * Defines the contract for all storage backends.
 * Current: Local filesystem
 * Future: S3-compatible (Backblaze B2, Wasabi, AWS S3, MinIO)
 * 
 * This interface ensures that switching storage backends
 * does not require changes to the API layer.
 */

import { Readable } from 'stream';

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface StorageBackend {
  /** Unique identifier for this backend type */
  readonly type: string;
  
  /** Check if the backend is healthy and accessible */
  healthCheck(): Promise<boolean>;
  
  /** Write a file from a readable stream */
  putObject(
    key: string,
    stream: Readable,
    size: number,
    metadata?: Record<string, string>
  ): Promise<{ sha256: string; size: number }>;
  
  /** Get a file as a readable stream (for download) */
  getObject(key: string): Promise<{
    stream: Readable;
    size: number;
    metadata?: Record<string, string>;
  }>;
  
  /** Get object metadata without downloading */
  headObject(key: string): Promise<StorageObject | null>;
  
  /** Delete an object permanently */
  deleteObject(key: string): Promise<void>;
  
  /** Check if an object exists */
  exists(key: string): Promise<boolean>;
  
  /** Copy an object within the same backend */
  copyObject(sourceKey: string, destKey: string): Promise<void>;
  
  /** List objects with a prefix */
  listObjects(prefix: string, maxKeys?: number): Promise<StorageObject[]>;
}

/**
 * Storage Pool Configuration
 * Maps logical pools to physical backends
 */
export interface StoragePoolConfig {
  name: string;
  backend: StorageBackend;
  encryptionEnabled: boolean;
  maxObjectSize: number;
  description: string;
}

/**
 * Storage Router
 * Routes operations to the appropriate backend based on pool assignment
 */
export interface StorageRouter {
  getBackend(poolName: string): StorageBackend;
  getDefaultBackend(): StorageBackend;
  getPoolConfig(poolName: string): StoragePoolConfig;
}
