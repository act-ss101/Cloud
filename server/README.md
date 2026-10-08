# CloudVault Server

Backend API for CloudVault Personal Cloud Storage Platform.

## Architecture

```
server/
├── src/
│   ├── index.ts          # Express server entry point
│   ├── config.ts         # Environment-based configuration
│   ├── api/
│   │   ├── auth.ts       # Authentication routes (register, login, logout)
│   │   └── files.ts      # File management routes (CRUD, upload, download)
│   ├── auth/
│   │   └── middleware.ts # Session auth, ownership verification, audit
│   ├── db/
│   │   ├── pool.ts       # PostgreSQL connection pool
│   │   └── migrations.ts # Safe, repeatable database migrations
│   └── storage/
│       ├── interface.ts  # Storage backend abstraction
│       ├── local.ts      # Local filesystem implementation
│       └── router.ts     # Storage pool routing
├── tests/
│   └── api.test.ts       # Integration tests
└── tsconfig.json
```

## Requirements

- Node.js 18+
- PostgreSQL 14+
- 2GB available disk for storage

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
export DB_PASSWORD=your_password
export SESSION_SECRET=your_secret_key

# Start development server
npm run dev

# Run tests (requires PostgreSQL)
npm test
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4000 | Server port |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | cloudvault | Database name |
| DB_USER | cloudvault | Database user |
| DB_PASSWORD | (required) | Database password |
| SESSION_SECRET | (required) | Session encryption key |
| STORAGE_ROOT | ./data/storage | Local storage path |
| MAX_FILE_SIZE | 5368709120 | Max upload size (5GB) |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info

### Files
- `GET /api/files` - List files/folders
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `POST /api/files/folders` - Create folder
- `PATCH /api/files/:id/rename` - Rename
- `PATCH /api/files/:id/move` - Move
- `DELETE /api/files/:id` - Delete to trash
- `POST /api/files/:id/restore` - Restore from trash
- `GET /api/files/:id/verify` - Verify integrity

### Health
- `GET /api/health` - Health check

## Security

- Session-based authentication (httpOnly cookies)
- bcrypt password hashing (12 rounds)
- SHA-256 integrity verification
- Path traversal protection
- Tenant isolation (multi-tenant ready)
- Ownership verification on all operations
- Audit logging

## Status

**ALPHA** - Not production ready. Requires PostgreSQL for runtime testing.
