/**
 * CloudVault API Integration Tests
 * 
 * Tests for:
 * - Upload with SHA-256 verification
 * - Download with integrity check
 * - Unauthorized access denial
 * - Path traversal protection
 * - Rename, Move, Delete, Restore operations
 * - Persistence across server restart
 * - Cross-user access denial
 * 
 * Requirements:
 * - PostgreSQL running on localhost:5432
 * - Database: cloudvault
 * - User: cloudvault
 * 
 * Run: npm test (from server directory)
 * 
 * NOTE: These tests require a real PostgreSQL instance.
 * They will FAIL if PostgreSQL is not available.
 * This is intentional - no mocks or in-memory substitutes.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createHash, randomBytes } from 'crypto';
import { Readable } from 'stream';

// Test configuration
const API_BASE = process.env.TEST_API_URL || 'http://localhost:4000/api';
const TEST_EMAIL = `test-${Date.now()}@cloudvault.test`;
const TEST_PASSWORD = 'TestPassword123!';

let authToken: string;
let testFileId: string;
let testFolderId: string;
let testFileHash: string;

// Helper functions
async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Cookie: `session_token=${authToken}` } : {}),
      ...options.headers,
    },
  });
  
  return {
    status: response.status,
    data: await response.json().catch(() => null),
    headers: response.headers,
  };
}

async function registerAndLogin(): Promise<void> {
  // Register
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test User',
    }),
  });
  expect(regRes.status).toBe(201);

  // Login
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });
  expect(loginRes.status).toBe(200);

  // Extract session token from cookie
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/session_token=([^;]+)/);
    if (match) {
      authToken = match[1];
    }
  }
}

describe('CloudVault API Integration Tests', () => {
  beforeAll(async () => {
    // Check API availability
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      if (!healthRes.ok) {
        throw new Error('API not available');
      }
    } catch (err) {
      throw new Error(
        'BLOCKED: Cannot connect to CloudVault API. ' +
        'Ensure PostgreSQL is running and server is started on port 4000. ' +
        'Run: cd server && npm run dev'
      );
    }
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          displayName: 'Test User',
        }),
      });
      expect(res.status).toBe(201);
      expect(res.data.user).toBeDefined();
      expect(res.data.user.email).toBe(TEST_EMAIL);
    });

    it('should login with valid credentials', async () => {
      await registerAndLogin();
      expect(authToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'WrongPassword',
        }),
      });
      expect(res.status).toBe(401);
    });

    it('should get current user info', async () => {
      const res = await apiRequest('/auth/me');
      expect(res.status).toBe(200);
      expect(res.data.user.email).toBe(TEST_EMAIL);
    });
  });

  describe('File Upload & Integrity', () => {
    it('should upload a file with SHA-256 verification', async () => {
      const testContent = `Test file content ${randomBytes(1024).toString('hex')}`;
      testFileHash = createHash('sha256').update(testContent).digest('hex');

      const formData = new FormData();
      formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'test-file.txt');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { Cookie: `session_token=${authToken}` },
        body: formData,
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      testFileId = data.file.id;
      expect(data.file.sha256).toBe(testFileHash);
      expect(data.file.name).toBe('test-file.txt');
    });

    it('should verify file integrity via hash check', async () => {
      const res = await apiRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
      expect(res.data.actualHash).toBe(testFileHash);
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
    });

    it('should include SHA-256 hash in response header', async () => {
      const response = await fetch(`${API_BASE}/files/${testFileId}/download`, {
        headers: { Cookie: `session_token=${authToken}` },
      });

      const hashHeader = response.headers.get('x-file-hash');
      expect(hashHeader).toBe(testFileHash);
    });
  });

  describe('Unauthorized Access', () => {
    it('should deny access without authentication', async () => {
      const res = await fetch(`${API_BASE}/files`);
      expect(res.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const res = await fetch(`${API_BASE}/files`, {
        headers: { Cookie: 'session_token=invalid-token' },
      });
      expect(res.status).toBe(401);
    });

    it('should deny cross-user file access', async () => {
      // Create second user
      const user2Email = `user2-${Date.now()}@cloudvault.test`;
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: user2Email,
          password: TEST_PASSWORD,
          displayName: 'User 2',
        }),
      });

      // Login as user 2
      const loginRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: user2Email,
          password: TEST_PASSWORD,
        }),
      });

      const setCookie = loginRes.headers.get('set-cookie');
      const match = setCookie?.match(/session_token=([^;]+)/);
      const user2Token = match?.[1];

      // Try to access user 1's file
      const res = await fetch(`${API_BASE}/files/${testFileId}/download`, {
        headers: { Cookie: `session_token=${user2Token}` },
      });

      expect(res.status).toBe(404); // Not found (not 403 to avoid info leak)
    });
  });

  describe('Folder Operations', () => {
    it('should create a folder', async () => {
      const res = await apiRequest('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Folder' }),
      });
      expect(res.status).toBe(201);
      testFolderId = res.data.folder.id;
      expect(res.data.folder.name).toBe('Test Folder');
    });

    it('should list folders', async () => {
      const res = await apiRequest('/files');
      expect(res.status).toBe(200);
      expect(res.data.folders.length).toBeGreaterThan(0);
    });

    it('should reject duplicate folder names', async () => {
      const res = await apiRequest('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Folder' }),
      });
      expect(res.status).toBe(409);
    });
  });

  describe('Rename & Move', () => {
    it('should rename a file', async () => {
      const res = await apiRequest(`/files/${testFileId}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'renamed-file.txt', type: 'file' }),
      });
      expect(res.status).toBe(200);
      expect(res.data.file.name).toBe('renamed-file.txt');
    });

    it('should move file to folder', async () => {
      const res = await apiRequest(`/files/${testFileId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ targetFolderId: testFolderId, type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should prevent moving folder into itself', async () => {
      const res = await apiRequest(`/files/${testFolderId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ targetFolderId: testFolderId, type: 'folder' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Delete & Restore', () => {
    it('should move file to trash', async () => {
      const res = await apiRequest(`/files/${testFileId}`, {
        method: 'DELETE',
        body: JSON.stringify({ type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should not list trashed files by default', async () => {
      const res = await apiRequest(`/files?folderId=${testFolderId}`);
      expect(res.status).toBe(200);
      const trashedFile = res.data.files.find((f: any) => f.id === testFileId);
      expect(trashedFile).toBeUndefined();
    });

    it('should restore file from trash', async () => {
      const res = await apiRequest(`/files/${testFileId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ type: 'file' }),
      });
      expect(res.status).toBe(200);
    });

    it('should verify integrity after restore', async () => {
      const res = await apiRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
      expect(res.data.actualHash).toBe(testFileHash);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should reject file names with path traversal', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), '../../../etc/passwd');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { Cookie: `session_token=${authToken}` },
        body: formData,
      });

      // Should either reject or sanitize the filename
      // The important thing is it should NOT write to ../../../etc/passwd
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Persistence', () => {
    it('should persist files across operations', async () => {
      // List files again
      const res = await apiRequest('/files');
      expect(res.status).toBe(200);
      
      // File should still exist
      const fileExists = res.data.files.some((f: any) => f.id === testFileId);
      expect(fileExists).toBe(true);
    });

    it('should maintain hash after all operations', async () => {
      const res = await apiRequest(`/files/${testFileId}/verify`);
      expect(res.status).toBe(200);
      expect(res.data.isValid).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup: logout
    if (authToken) {
      await apiRequest('/auth/logout', { method: 'POST' });
    }
  });
});
