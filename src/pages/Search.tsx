import { useState } from 'react';
import {
  Search,
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
  Clock,
  Filter,
} from 'lucide-react';
import { apiClient, type FileItem, type FolderItem, type ApiError } from '../lib/api';

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
  return date.toLocaleDateString();
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ folders: FolderItem[]; files: FileItem[] } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await apiClient.searchFiles(query);
      setResults(data);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.status === 0) {
        setError('Cannot connect to CloudVault server');
      } else if (apiErr.status === 404) {
        setResults({ folders: [], files: [] });
      } else {
        setError(apiErr.message || 'Search failed');
      }
    } finally {
      setLoading(false);
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
      setError(err.message || 'Download failed');
    }
  };

  const totalResults = results ? results.folders.length + results.files.length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Search</h1>
        <p className="text-sm text-slate-400 mt-1">Find files and folders across your cloud</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for files, folders, documents..."
          className="w-full pl-12 pr-32 py-4 bg-slate-900 border border-slate-800 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Filters */}
      {hasSearched && results && (
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <span className="text-xs text-slate-400">Filters:</span>
          <button className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            All Types
          </button>
          <button className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            Last 7 days
          </button>
          <button className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            My files only
          </button>
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
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Searching...</p>
        </div>
      )}

      {/* Empty State (before search) */}
      {!hasSearched && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">Start searching</p>
          <p className="text-xs text-slate-500">Enter keywords to find files and folders</p>
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && results && totalResults === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Inbox size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">No results found</p>
          <p className="text-xs text-slate-500">Try different keywords or check spelling</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && results && totalResults > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "<span className="text-white font-medium">{query}</span>"
          </p>

          {/* Folders */}
          {results.folders.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Folders ({results.folders.length})</h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {results.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {typeIcons.folder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate font-medium">{folder.name}</p>
                      <p className="text-xs text-slate-500">Folder</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatTime(folder.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {results.files.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Files ({results.files.length})</h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {results.files.map((file) => {
                  const fileType = getFileType(file.name, file.mimeType);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {typeIcons[fileType] || typeIcons.document}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Clock size={12} />
                          {formatTime(file.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id, file.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
