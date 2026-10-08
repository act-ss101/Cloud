/**
 * CloudVault API Integration Tests
 * 
 * Tests for:
 * - Upload with SHA-256 verification
 * - Download with integrity check
 * - Unauthorized access denial
 * - Path traversal protection
 * - Rename, Move, Delete, Restore operations
 * - Persistence across operations
 * - Cross-user access denial
 * 
 * Requirements:
 * - PostgreSQL running on localhost:5432
 * - Database: cloudvault
 * - User: cloudvault
 * - Server running on port 4000
 * 
 * Run: cd server && npm test
 * 
 * NOTE: These tests require a real PostgreSQL instance.
 * They will FAIL if PostgreSQL is not available.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createHash, randomBytes } from 'crypto';

// Test configuration
const API_BASE = process.env.TEST_API_URL || 'http://localhost:4000/api';
const TEST_EMAIL = `test-${Date.now()}@cloudvault.test`;
const TEST_PASSWORD = 'TestPassword123!';

let authToken: string;
let testFileId: string;
let testFolderId: string;
let testFileHash: string;
let testFileContent: string;

// Helper: make authenticated request
async function authRequest(path: string, options: RequestInit = {}): Promise<{
  status: number;
  data: any;
  headers: Headers;
}> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_token=${authToken}`,
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

// Helper: make unauthenticated request
async function unauthRequest(path: string, options: RequestInit = {}): Promise<{
  status: number;
  data: any;
}> {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

describe('CloudVault API Integration Tests', () => {
  beforeAll(async () => {
    // Check API availability
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      if (!healthRes.ok) {
        throw new Error(`Health check failed: ${healthRes.status}`);
      }
      const health = await healthRes.json();
      if (health.status !== 'healthy') {
        throw new Error(`API not healthy: ${health.status}`);
      }
    } catch (err: any) {
      throw new Error(
        `BLOCKED: Cannot connect to CloudVault API. ${err.message}\n` +
        'Ensure PostgreSQL is running and server is started on port 4000.\n' +
        'Run: cd server && npm run dev'
      );
    }
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await unauthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          displayName: 'Test User',
        }),
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toBeDefined();
      expect(res.data.user).toBeDefined();
      expect(res.data.user.email).toBe(TEST_EMAIL);
      expect(res.data.user.displayName).toBe('Test User');
      expect(res.data.user.id).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      const res = await unauthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          displayName: 'Duplicate User',
        }),
      });
      
      expect(res.status).toBe(409);
      expect(res.data.error).toContain('already registered');
    });

    it('should login with valid credentials', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(TEST_EMAIL);

      // Extract session token from cookie
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      const match = setCookie!.match(/session_token=([^;]+)/);
      expect(match).toBeDefined();
      authToken = match![1];
      expect(authToken.length).toBeGreaterThan(0);
    });

    it('should reject login with wrong password', async () => {
      const res = await unauthRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'WrongPassword123!',
        }),
      });
      
      expect(res.status).toBe(401);
      expect(res.data.error).toBe('Invalid credentials');
    });

    it('should get current user info', async () => {
      const res = await authRequest('/auth/me');
      expect(res.status).toBe(200);
      expect(res.data.user.email).toBe(TEST_EMAIL);
      expect(res.data.user.tenantId).toBeDefined();
    });
  });

  describe('File Upload & Integrity', () => {
    it('should upload a file with SHA-256 verification', async () => {
      testFileContent = `Test file content ${randomBytes(2048).toString('hex')}`;
      testFileHash = createHash('sha256').update(testFileContent).digest('hex');

      const formData = new FormData();
      formData.append('file', new Blob([testFileContent], { type: 'text/plain' }), 'test-file.txt');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { Cookie: `session_token=${authToken}` },
        body: formData,
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.file).toBeDefined();
      testFileId = data.file.id;
      expect(testFileId).toBeDefined();
      expect(data.file.sha256).toBe(testFileHash);
      expect(data.file.name).toBe('test-file.txt');
      expect(data.file.size).toBeGreaterThan(0);
    });

    it('should verify file integrity via hash check', async () => {
      const res = await authRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
      expect(res.data.actualHash).toBe(testFileHash);
      expect(res.data.expectedHash).toBe(testFileHash);
    });

    it('should reject upload without authentication', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('File Download', () => {
    it('should download file with correct content', async () => {
      const response = await fetch(`${API_BASE}/files/${testFileId}/download`, {
        headers: { Cookie: `session_token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const blob = await response.blob();
      const text = await blob.text();
      const downloadedHash = createHash('sha256').update(text).digest('hex');
      expect(downloadedHash).toBe(testFileHash);
      expect(text).toBe(testFileContent);
    });

    it('should include SHA-256 hash in response header', async () => {
      const response = await fetch(`${API_BASE}/files/${testFileId}/download`, {
        headers: { Cookie: `session_token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const hashHeader = response.headers.get('x-file-hash');
      expect(hashHeader).toBe(testFileHash);
    });

    it('should reject download without authentication', async () => {
      const response = await fetch(`${API_BASE}/files/${testFileId}/download`);
      expect(response.status).toBe(401);
    });
  });

  describe('Unauthorized Access', () => {
    it('should deny file listing without authentication', async () => {
      const res = await unauthRequest('/files');
      expect(res.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const response = await fetch(`${API_BASE}/files`, {
        headers: { Cookie: 'session_token=invalid-token-12345' },
      });
      expect(response.status).toBe(401);
    });

    it('should deny cross-user file access', async () => {
      // Create second user
      const user2Email = `user2-${Date.now()}@cloudvault.test`;
      await unauthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: user2Email,
          password: TEST_PASSWORD,
          displayName: 'User 2',
        }),
      });

      // Login as user 2
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user2Email,
          password: TEST_PASSWORD,
        }),
      });

      const setCookie = loginResponse.headers.get('set-cookie');
      const match = setCookie?.match(/session_token=([^;]+)/);
      const user2Token = match?.[1];
      expect(user2Token).toBeDefined();

      // Try to access user 1's file (should return 404, not 403 to avoid info leak)
      const response = await fetch(`${API_BASE}/files/${testFileId}/download`, {
        headers: { Cookie: `session_token=${user2Token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Folder Operations', () => {
    it('should create a folder', async () => {
      const res = await authRequest('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Folder' }),
      });
      
      expect(res.status).toBe(201);
      expect(res.data.folder).toBeDefined();
      testFolderId = res.data.folder.id;
      expect(testFolderId).toBeDefined();
      expect(res.data.folder.name).toBe('Test Folder');
    });

    it('should list folders', async () => {
      const res = await authRequest('/files');
      expect(res.status).toBe(200);
      expect(res.data.folders).toBeDefined();
      expect(Array.isArray(res.data.folders)).toBe(true);
      expect(res.data.folders.length).toBeGreaterThan(0);
    });

    it('should reject duplicate folder names in same parent', async () => {
      const res = await authRequest('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Folder' }),
      });
      expect(res.status).toBe(409);
    });

    it('should create nested folder', async () => {
      const res = await authRequest('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Subfolder', parentId: testFolderId }),
      });
      expect(res.status).toBe(201);
      expect(res.data.folder.parentId).toBe(testFolderId);
    });
  });

  describe('Rename & Move', () => {
    it('should rename a file', async () => {
      const res = await authRequest(`/files/${testFileId}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'renamed-file.txt', type: 'file' }),
      });
      expect(res.status).toBe(200);
      expect(res.data.file.name).toBe('renamed-file.txt');
    });

    it('should move file to folder', async () => {
      const res = await authRequest(`/files/${testFileId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ targetFolderId: testFolderId, type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should prevent moving folder into itself', async () => {
      const res = await authRequest(`/files/${testFolderId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ targetFolderId: testFolderId, type: 'folder' }),
      });
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('cycle');
    });
  });

  describe('Delete & Restore', () => {
    it('should move file to trash', async () => {
      const res = await authRequest(`/files/${testFileId}`, {
        method: 'DELETE',
        body: JSON.stringify({ type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should not list trashed files by default', async () => {
      const res = await authRequest(`/files?folderId=${testFolderId}`);
      expect(res.status).toBe(200);
      const trashedFile = res.data.files.find((f: any) => f.id === testFileId);
      expect(trashedFile).toBeUndefined();
    });

    it('should restore file from trash', async () => {
      const res = await authRequest(`/files/${testFileId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should verify integrity after restore', async () => {
      const res = await authRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
      expect(res.data.actualHash).toBe(testFileHash);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should sanitize filenames with path separators', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), '../../../etc/passwd');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { Cookie: `session_token=${authToken}` },
        body: formData,
      });

      // Should succeed but with sanitized filename
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.file.name).not.toContain('..');
      expect(data.file.name).not.toContain('/');
    });
  });

  describe('Persistence', () => {
    it('should persist files across operations', async () => {
      const res = await authRequest('/files');
      expect(res.status).toBe(200);
      const fileExists = res.data.files.some((f: any) => f.id === testFileId);
      expect(fileExists).toBe(true);
    });

    it('should maintain hash after all operations', async () => {
      const res = await authRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
      expect(res.data.actualHash).toBe(testFileHash);
    });
  });

  afterAll(async () => {
    // Cleanup: logout
    if (authToken) {
      await authRequest('/auth/logout', { method: 'POST' });
    }
  });
});
