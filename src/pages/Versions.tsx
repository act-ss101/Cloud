import { useState, useEffect } from 'react';
import {
  History,
  FileText,
  FileArchive,
  Database,
  Image,
  Code,
  Download,
  RotateCcw,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  GitCompare,
  Filter,
  AlertCircle,
  Loader2,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { apiClient, type ApiError } from '../lib/api';

interface FileVersion {
  id: string;
  version: number;
  size: number;
  sha256: string;
  createdAt: string;
  isCurrent: boolean;
}

interface FileVersions {
  fileId: string;
  fileName: string;
  versions: FileVersion[];
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function Versions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<FileVersions | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Mock file list for demo (in real app, this would come from API)
  const mockFiles = [
    { id: '1', name: 'Project-Source.zip', type: 'archive' },
    { id: '2', name: 'Database-Backup.sql', type: 'database' },
    { id: '3', name: 'README.md', type: 'document' },
    { id: '4', name: 'server-config.yaml', type: 'code' },
    { id: '5', name: 'logo-design.png', type: 'image' },
  ];

  const loadVersions = async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation, call API
      // const data = await apiClient.getFileVersions(fileId);
      // setVersions(data);
      
      // Mock data for demo
      setVersions({
        fileId,
        fileName: mockFiles.find(f => f.id === fileId)?.name || 'Unknown',
        versions: [
          { id: '1', version: 3, size: 2400000000, sha256: 'a3f2b8c...', createdAt: new Date().toISOString(), isCurrent: true },
          { id: '2', version: 2, size: 2300000000, sha256: 'e7d4f1a...', createdAt: new Date(Date.now() - 86400000).toISOString(), isCurrent: false },
          { id: '3', version: 1, size: 2100000000, sha256: 'b9c3e5d...', createdAt: new Date(Date.now() - 172800000).toISOString(), isCurrent: false },
        ],
      });
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFileId) {
      loadVersions(selectedFileId);
    }
  }, [selectedFileId]);

  const handleRestore = async (versionId: string) => {
    if (!selectedFileId) return;
    
    try {
      // In real implementation: await apiClient.restoreVersion(selectedFileId, versionId);
      alert(`Version ${versionId} restored successfully`);
      await loadVersions(selectedFileId);
    } catch (err: any) {
      setError(err.message || 'Failed to restore version');
    }
  };

  const handleDownload = async (versionId: string) => {
    if (!selectedFileId) return;
    
    try {
      // In real implementation: await apiClient.downloadVersion(selectedFileId, versionId);
      alert(`Downloading version ${versionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to download version');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Version History</h1>
          <p className="text-sm text-slate-400 mt-1">Track file changes and restore previous versions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <History size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Total Versions</span>
          </div>
          <p className="text-2xl font-bold text-white">136</p>
          <p className="text-xs text-slate-500">Across 5 files</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Restores (30d)</span>
          </div>
          <p className="text-2xl font-bold text-white">7</p>
          <p className="text-xs text-emerald-400">All successful</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-400" />
            <span className="text-xs text-slate-400">Retention</span>
          </div>
          <p className="text-2xl font-bold text-white">90 days</p>
          <p className="text-xs text-slate-500">Unlimited versions</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-amber-400" />
            <span className="text-xs text-slate-400">Verified Hashes</span>
          </div>
          <p className="text-2xl font-bold text-white">100%</p>
          <p className="text-xs text-slate-500">SHA-256 integrity</p>
        </div>
      </div>

      {/* File Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Select File</h3>
        <div className="flex flex-wrap gap-2">
          {mockFiles.map(file => (
            <button
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFileId === file.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading versions...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !selectedFileId && (
        <div className="flex flex-col items-center justify-center py-16">
          <Inbox size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">No file selected</p>
          <p className="text-xs text-slate-500">Select a file above to view its version history</p>
        </div>
      )}

      {/* Version Timeline */}
      {!loading && !error && versions && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">{versions.fileName}</h3>
            <p className="text-xs text-slate-500 mt-1">{versions.versions.length} versions</p>
          </div>
          <div className="divide-y divide-slate-800/50">
            {versions.versions.map((version) => (
              <div key={version.id} className="px-5 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      version.isCurrent ? 'bg-blue-500/10' : 'bg-slate-800'
                    }`}>
                      <History size={16} className={version.isCurrent ? 'text-blue-400' : 'text-slate-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">Version {version.version}</p>
                        {version.isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{formatTime(version.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{formatSize(version.size)}</span>
                    <ShieldCheck size={12} className="text-emerald-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-mono">{version.sha256}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(version.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    {!version.isCurrent && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        className="p-1.5 rounded-md text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version Info */}
      {!loading && !error && versions && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Version Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Version Storage Used</p>
              <p className="text-lg font-bold text-white">18.4 GB</p>
              <p className="text-[10px] text-slate-500">Deduplicated across versions</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Oldest Version</p>
              <p className="text-lg font-bold text-white">Jan 8, 2024</p>
              <p className="text-[10px] text-slate-500">Within 90-day retention</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Integrity Check</p>
              <p className="text-lg font-bold text-emerald-400">All Verified ✓</p>
              <p className="text-[10px] text-slate-500">Last check: 2 hours ago</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
