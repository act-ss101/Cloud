/**
 * Database Migration System
 * 
 * Safe, repeatable migrations that never destroy data.
 * Each migration is tracked and only runs once.
 * No schema resets or destructive DROP commands.
 */

import { Pool, PoolClient } from 'pg';

interface Migration {
  version: number;
  name: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- Tenants table (for future multi-tenant support)
      -- Created first because users references it
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID,
        storage_quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10GB default
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Users table (multi-tenant ready)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Add tenant owner FK after users table exists
      ALTER TABLE tenants ADD CONSTRAINT fk_tenant_owner 
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

      -- Folders table (parent_id uses SET NULL to prevent accidental cascade deletion)
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Files table (metadata only, actual data in object storage)
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        mime_type VARCHAR(255),
        size_bytes BIGINT NOT NULL DEFAULT 0,
        sha256_hash VARCHAR(64),
        storage_key VARCHAR(1000) NOT NULL,
        storage_pool VARCHAR(50) NOT NULL DEFAULT 'local',
        is_trashed BOOLEAN NOT NULL DEFAULT false,
        trashed_at TIMESTAMPTZ,
        original_folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- File versions table
      CREATE TABLE IF NOT EXISTS file_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        size_bytes BIGINT NOT NULL,
        sha256_hash VARCHAR(64) NOT NULL,
        storage_key VARCHAR(1000) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(128) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Audit log
      CREATE TABLE IF NOT EXISTS audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        event_type VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Migration tracking
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
      CREATE INDEX IF NOT EXISTS idx_files_tenant ON files(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
      CREATE INDEX IF NOT EXISTS idx_files_trashed ON files(is_trashed);
      CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
      CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);

      -- Unique constraints
      CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_unique 
        ON file_versions(file_id, version);
    `,
  },
  {
    version: 2,
    name: 'add_share_links',
    up: `
      -- Share links table
      CREATE TABLE IF NOT EXISTS share_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash VARCHAR(128) UNIQUE NOT NULL,
        resource_id UUID NOT NULL,
        resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('file', 'folder')),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        password_hash VARCHAR(255),
        expires_at TIMESTAMPTZ,
        permission VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'download', 'upload')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        view_count INTEGER NOT NULL DEFAULT 0,
        download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_share_links_owner ON share_links(owner_id);
      CREATE INDEX IF NOT EXISTS idx_share_links_tenant ON share_links(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token_hash);
      CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active);
      CREATE INDEX IF NOT EXISTS idx_share_links_expires ON share_links(expires_at);
    `,
  },
];

export async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const applied = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const appliedVersions = new Set(applied.rows.map((r: any) => r.version));

    // Run pending migrations
    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        console.log(`[Migration] v${migration.version} (${migration.name}) - already applied`);
        continue;
      }

      console.log(`[Migration] Applying v${migration.version}: ${migration.name}...`);
      
      await client.query('BEGIN');
      try {
        await client.query(migration.up);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name]
        );
        await client.query('COMMIT');
        console.log(`[Migration] v${migration.version} applied successfully`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
