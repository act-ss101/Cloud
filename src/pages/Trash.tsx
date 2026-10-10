import { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  FileText,
  FileArchive,
  Database,
  Image,
  Film,
  Music,
  Code,
  Folder,
  AlertCircle,
  Loader2,
  Inbox,
  Download,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { apiClient, type FileItem, type ApiError } from '../lib/api';

function getFileType(name: string, mimeType?: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive';
  if (['sql', 'db', 'sqlite'].includes(ext)) return 'database';
  if (['md', 'txt', 'doc', 'docx', 'pdf', 'pptx', 'xlsx'].includes(ext)) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return 'audio';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'go', 'rs', 'yaml', 'yml', 'json', 'html', 'css'].includes(ext)) return 'code';
  return 'document';
}

const typeIcons: Record<string, React.ReactNode> = {
  folder: <Folder size={20} className="text-blue-400" />,
  archive: <FileArchive size={20} className="text-amber-400" />,
  document: <FileText size={20} className="text-green-400" />,
  database: <Database size={20} className="text-cyan-400" />,
  image: <Image size={20} className="text-pink-400" />,
  video: <Film size={20} className="text-purple-400" />,
  audio: <Music size={20} className="text-orange-400" />,
  code: <Code size={20} className="text-emerald-400" />,
};

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
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function TrashPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadTrash = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.listFiles(undefined, true);
      setTrashedFiles(data.files.filter(f => f.isTrashed));
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.status === 0) {
        setError('Cannot connect to CloudVault server');
      } else {
        setError(apiErr.message || 'Failed to load trash');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (fileId: string) => {
    try {
      await apiClient.restoreFromTrash(fileId, 'file');
      setTrashedFiles(trashedFiles.filter(f => f.id !== fileId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to restore');
    }
  };

  const handleRestoreSelected = async () => {
    try {
      for (const id of selectedIds) {
        await apiClient.restoreFromTrash(id, 'file');
      }
      setTrashedFiles(trashedFiles.filter(f => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to restore selected files');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trashedFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashedFiles.map(f => f.id)));
    }
  };

  const totalSize = trashedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Trash</h1>
          <p className="text-sm text-slate-400 mt-1">
            {trashedFiles.length} items · {formatSize(totalSize)} · Auto-delete after 30 days
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleRestoreSelected}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Restore {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={16} className="text-red-400" />
            <span className="text-xs text-slate-400">Trashed Items</span>
          </div>
          <p className="text-2xl font-bold text-white">{trashedFiles.length}</p>
          <p className="text-xs text-slate-500">Files in trash</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Space Used</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatSize(totalSize)}</p>
          <p className="text-xs text-slate-500">Can be recovered</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-amber-400" />
            <span className="text-xs text-slate-400">Retention</span>
          </div>
          <p className="text-2xl font-bold text-white">30 days</p>
          <p className="text-xs text-slate-500">Auto-delete policy</p>
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
          <button
            onClick={loadTrash}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading trash...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && trashedFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Inbox size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">Trash is empty</p>
          <p className="text-xs text-slate-500">Deleted files will appear here</p>
        </div>
      )}

      {/* Trash List */}
      {!loading && !error && trashedFiles.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedIds.size === trashedFiles.length}
                onChange={toggleSelectAll}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Deleted</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Files */}
          <div className="divide-y divide-slate-800/50">
            {trashedFiles.map((file) => {
              const fileType = getFileType(file.name, file.mimeType);
              return (
                <div
                  key={file.id}
                  className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors items-center"
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {typeIcons[fileType] || typeIcons.document}
                    </div>
                    <span className="text-sm text-slate-200 truncate font-medium">{file.name}</span>
                  </div>
                  <div className="col-span-2 text-sm text-slate-400">{formatSize(file.size)}</div>
                  <div className="col-span-2 text-sm text-slate-400">
                    {formatTime(file.updatedAt)}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleRestore(file.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      {!loading && !error && trashedFiles.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-300">
            <strong>Note:</strong> Files in trash are automatically deleted after 30 days. You can restore them at any time before they are permanently deleted.
          </p>
        </div>
      )}
    </div>
  );
}
