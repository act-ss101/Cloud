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

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for session
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
        throw err; // Already an ApiError
      }
      
      // Network error or API unavailable
      throw {
        status: 0,
        message: 'Cannot connect to server. Please check if the API is running.',
        details: err.message,
      } as ApiError;
    }
  }

  // Auth
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

  // Files
  async listFiles(folderId?: string, includeTrashed = false): Promise<{
    folders: FolderItem[];
    files: FileItem[];
  }> {
    const params = new URLSearchParams();
    if (folderId) params.set('folderId', folderId);
    if (includeTrashed) params.set('trashed', 'true');
    
    return this.request(`/files?${params.toString()}`);
  }

  async uploadFile(file: File, folderId?: string): Promise<{ file: FileItem }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw {
        status: response.status,
        message: error.error || 'Upload failed',
      } as ApiError;
    }

    return response.json();
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

  // Health
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    checks: { database: string; storage: string };
  }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
