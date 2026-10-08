import { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FileArchive,
  FileText,
  Database,
  Image,
  Film,
  Music,
  Code,
  MoreVertical,
  Grid3X3,
  List,
  ChevronRight,
  Home,
  Upload,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Inbox,
} from 'lucide-react';
import { apiClient, type FileItem, type FolderItem, type ApiError } from '../lib/api';

// File type detection
function getFileType(name: string, mimeType?: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive';
  if (['sql', 'db', 'sqlite'].includes(ext) || mimeType?.includes('database')) return 'database';
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
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function MyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'CloudVault' },
  ]);

  // API state
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check API availability first
      if (apiAvailable === null) {
        try {
          await apiClient.healthCheck();
          setApiAvailable(true);
        } catch {
          setApiAvailable(false);
          setError('Cannot connect to CloudVault server. Please ensure the API is running.');
          setLoading(false);
          return;
        }
      }

      if (!apiAvailable) {
        setError('CloudVault server is not available.');
        setLoading(false);
        return;
      }

      const data = await apiClient.listFiles(currentFolderId || undefined);
      setFolders(data.folders);
      setFiles(data.files);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (apiErr.status === 0) {
        setApiAvailable(false);
        setError('Cannot connect to CloudVault server. Please ensure the API is running on port 4000.');
      } else {
        setError(apiErr.message || 'Failed to load files');
      }
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, apiAvailable]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setError(null);
    setActionError(null);

    const files = Array.from(fileList);
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadFileName(file.name);
        setUploadProgress(Math.round((i / totalFiles) * 100));
        await apiClient.uploadFile(file, currentFolderId || undefined);
      }
      setUploadProgress(100);
      await loadFiles();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(`Upload failed: ${apiErr.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
      e.target.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setActionError(null);

    try {
      await apiClient.createFolder(newFolderName.trim(), currentFolderId || undefined);
      setNewFolderName('');
      setShowNewFolder(false);
      await loadFiles();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setActionError(`Create folder failed: ${apiErr.message || 'Unknown error'}`);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await apiClient.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Download failed');
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    setActionError(null);
    try {
      await apiClient.deleteToTrash(id, type);
      await loadFiles();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setActionError(`Delete failed: ${apiErr.message || 'Unknown error'}`);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'CloudVault' }]);
    } else {
      const existingIndex = breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
  };

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Files</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your cloud files and folders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <FolderPlus size={16} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 cursor-pointer">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-xl">
          <Folder size={16} className="text-blue-400" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Folder name..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-blue-400 animate-spin" />
              <span className="text-sm text-blue-300">Uploading: {uploadFileName}</span>
            </div>
            <span className="text-xs text-blue-400">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
          </div>
          <button
            onClick={loadFiles}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Action Error (non-blocking) */}
      {actionError && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 flex-1">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Breadcrumb & View Toggle */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <span key={item.id ?? 'root'} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="text-slate-600" />}
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  index === breadcrumbs.length - 1
                    ? 'text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                onClick={() => navigateToFolder(item.id, item.name)}
              >
                {index === 0 && <Home size={14} />}
                {item.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Storage Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">
            {loading ? 'Loading...' : `${folders.length} folders, ${files.length} files · ${formatSize(totalSize)}`}
          </span>
          <span className="text-xs text-blue-400">
            {apiAvailable === false ? 'Offline' : apiAvailable === true ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: '25.6%' }} />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading files...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && folders.length === 0 && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Inbox size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">No files yet</p>
          <p className="text-xs text-slate-500 mb-4">Upload files or create a folder to get started</p>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            <Upload size={16} />
            Upload Files
            <input type="file" multiple onChange={handleUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Files List */}
      {!loading && !error && (folders.length > 0 || files.length > 0) && (
        <>
          {viewMode === 'list' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-slate-800/50">
                {/* Folders first */}
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer items-center"
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                  >
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {typeIcons.folder}
                      </div>
                      <span className="text-sm text-slate-200 truncate font-medium">{folder.name}</span>
                    </div>
                    <div className="col-span-2 text-sm text-slate-400">—</div>
                    <div className="col-span-2 text-sm text-slate-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatTime(folder.updatedAt)}
                    </div>
                    <div className="col-span-1"></div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Files */}
                {files.map((file) => {
                  const fileType = getFileType(file.name, file.mimeType);
                  return (
                    <div
                      key={file.id}
                      className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer items-center"
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {typeIcons[fileType] || typeIcons.document}
                        </div>
                        <span className="text-sm text-slate-200 truncate font-medium">{file.name}</span>
                      </div>
                      <div className="col-span-2 text-sm text-slate-400">{formatSize(file.size)}</div>
                      <div className="col-span-2 text-sm text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatTime(file.updatedAt)}
                      </div>
                      <div className="col-span-1 flex items-center gap-1.5">
                        {file.sha256 && (
                          <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center" title="Verified">
                            <Shield size={10} className="text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(file.id, file.name)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                        <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, 'file')}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {typeIcons.folder}
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate">{folder.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Folder</p>
                </div>
              ))}
              {files.map((file) => {
                const fileType = getFileType(file.name, file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      {typeIcons[fileType] || typeIcons.document}
                    </div>
                    <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatSize(file.size)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {file.sha256 && (
                        <span className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center">
                          <Shield size={8} className="text-emerald-400" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Trash Info */}
      {!loading && !error && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Trash2 size={16} className="text-slate-500" />
            <span className="text-sm text-slate-400">
              {apiAvailable ? 'Trash is managed by the server' : 'Trash unavailable — server not connected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
