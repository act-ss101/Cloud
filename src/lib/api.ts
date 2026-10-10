/**
 * CloudVault API Client
 * 
 * Frontend client for communicating with the backend API.
 * Handles authentication, file operations, and error handling.
 * 
 * When API is unavailable, returns appropriate errors
 * instead of fake success.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tenantId?: string;
}

export interface FileItem {
  id: string;
  name: string;
  mimeType?: string;
  size: number;
  sha256?: string;
  version?: number;
  isTrashed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'file' | 'folder';
  permission: 'view' | 'download' | 'upload';
  expiresAt: string | null;
  isActive: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface FileVersion {
  id: string;
  version: number;
  size: number;
  sha256: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface StatsOverview {
  storage: {
    used: number;
    quota: number;
    percentage: number;
  };
  files: { count: number };
  folders: { count: number };
  trash: { count: number; size: number };
  shares: { active: number };
}

export interface ActivityEvent {
  type: string;
  resourceType: string;
  resourceId: string;
  details: any;
  timestamp: string;
}

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw {
          status: response.status,
          message: error.error || `HTTP ${response.status}`,
          details: error,
        } as ApiError;
      }

      return response.json();
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      
      throw {
        status: 0,
        message: 'Cannot connect to server. Please check if the API is running.',
        details: err.message,
      } as ApiError;
    }
  }

  // ============ Authentication ============
  
  async register(email: string, password: string, displayName: string): Promise<{ user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  // ============ Files ============
  
  async listFiles(folderId?: string, includeTrashed = false): Promise<{
    folders: FolderItem[];
    files: FileItem[];
  }> {
    const params = new URLSearchParams();
    if (folderId) params.set('folderId', folderId);
    if (includeTrashed) params.set('trashed', 'true');
    
    return this.request(`/files?${params.toString()}`);
  }

  async uploadFile(
    file: File, 
    folderId?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ file: FileItem }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject({
              status: xhr.status,
              message: error.error || 'Upload failed',
            } as ApiError);
          } catch {
            reject({
              status: xhr.status,
              message: 'Upload failed',
            } as ApiError);
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          status: 0,
          message: 'Network error during upload',
        } as ApiError);
      });

      xhr.open('POST', `${API_BASE}/files/upload`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw {
        status: response.status,
        message: error.error || 'Download failed',
      } as ApiError;
    }

    return response.blob();
  }

  async createFolder(name: string, parentId?: string): Promise<{ folder: FolderItem }> {
    return this.request('/files/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async rename(resourceId: string, name: string, type: 'file' | 'folder'): Promise<any> {
    return this.request(`/files/${resourceId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ name, type }),
    });
  }

  async move(resourceId: string, targetFolderId: string | null, type: 'file' | 'folder'): Promise<any> {
    return this.request(`/files/${resourceId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetFolderId, type }),
    });
  }

  async deleteToTrash(resourceId: string, type: 'file' | 'folder'): Promise<any> {
    return this.request(`/files/${resourceId}`, {
      method: 'DELETE',
      body: JSON.stringify({ type }),
    });
  }

  async restoreFromTrash(resourceId: string, type: 'file' | 'folder'): Promise<any> {
    return this.request(`/files/${resourceId}/restore`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async verifyFile(fileId: string): Promise<{
    fileId: string;
    expectedHash: string;
    actualHash: string;
    isValid: boolean;
    verifiedAt: string;
  }> {
    return this.request(`/files/${fileId}/verify`);
  }

  async searchFiles(query: string): Promise<{
    folders: FolderItem[];
    files: FileItem[];
  }> {
    return this.request(`/files/search?q=${encodeURIComponent(query)}`);
  }

  // ============ Versions ============
  
  async getFileVersions(fileId: string): Promise<{
    fileId: string;
    fileName: string;
    versions: FileVersion[];
  }> {
    return this.request(`/versions/${fileId}`);
  }

  async downloadVersion(fileId: string, versionId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/versions/${fileId}/${versionId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw {
        status: response.status,
        message: 'Download failed',
      } as ApiError;
    }

    return response.blob();
  }

  async restoreVersion(fileId: string, versionId: string): Promise<any> {
    return this.request(`/versions/${fileId}/${versionId}/restore`, {
      method: 'POST',
    });
  }

  async verifyVersion(fileId: string, versionId: string): Promise<{
    fileId: string;
    versionId: string;
    expectedHash: string;
    actualHash: string;
    isValid: boolean;
    verifiedAt: string;
  }> {
    return this.request(`/versions/${fileId}/${versionId}/verify`);
  }

  // ============ Sharing ============
  
  async listShares(): Promise<{ shares: ShareLink[] }> {
    return this.request('/sharing');
  }

  async createShare(data: {
    resourceId: string;
    resourceType: 'file' | 'folder';
    password?: string;
    expiresAt?: string;
    permission?: 'view' | 'download' | 'upload';
  }): Promise<{ share: ShareLink & { token: string; url: string } }> {
    return this.request('/sharing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShare(shareId: string, data: {
    permission?: 'view' | 'download' | 'upload';
    expiresAt?: string | null;
    isActive?: boolean;
    password?: string | null;
  }): Promise<any> {
    return this.request(`/sharing/${shareId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async revokeShare(shareId: string): Promise<any> {
    return this.request(`/sharing/${shareId}`, {
      method: 'DELETE',
    });
  }

  // ============ Statistics ============
  
  async getStatsOverview(): Promise<StatsOverview> {
    return this.request('/stats/overview');
  }

  async getStatsActivity(limit: number = 50): Promise<{ activities: ActivityEvent[] }> {
    return this.request(`/stats/activity?limit=${limit}`);
  }

  async getStatsStorage(): Promise<{
    byType: Array<{ type: string; count: number; size: number }>;
    byPool: Array<{ pool: string; count: number; size: number }>;
    recentUploads: Array<{
      id: string;
      name: string;
      size: number;
      mimeType: string;
      createdAt: string;
    }>;
  }> {
    return this.request('/stats/storage');
  }

  // ============ Health ============
  
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    checks: { database: string; storage: string };
  }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
