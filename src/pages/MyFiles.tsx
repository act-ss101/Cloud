import { useState } from 'react';
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
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'archive' | 'document' | 'database' | 'image' | 'video' | 'audio' | 'code';
  size: string;
  modified: string;
  shared: boolean;
  backedUp: boolean;
}

const files: FileItem[] = [
  { id: '1', name: 'Projects', type: 'folder', size: '12.4 GB', modified: '2 hours ago', shared: true, backedUp: true },
  { id: '2', name: 'Documents', type: 'folder', size: '1.2 GB', modified: '5 hours ago', shared: false, backedUp: true },
  { id: '3', name: 'Photos', type: 'folder', size: '4.8 GB', modified: 'Yesterday', shared: true, backedUp: true },
  { id: '4', name: 'Database-Backups', type: 'folder', size: '3.2 GB', modified: '2 days ago', shared: false, backedUp: true },
  { id: '5', name: 'Project-Source.zip', type: 'archive', size: '2.4 GB', modified: '10 min ago', shared: false, backedUp: true },
  { id: '6', name: 'Database-Backup.sql', type: 'database', size: '840 MB', modified: '2 hours ago', shared: false, backedUp: true },
  { id: '7', name: 'README.md', type: 'document', size: '12 KB', modified: 'Yesterday', shared: true, backedUp: false },
  { id: '8', name: 'presentation.pptx', type: 'document', size: '24 MB', modified: '3 days ago', shared: false, backedUp: true },
  { id: '9', name: 'server-config.yaml', type: 'code', size: '4 KB', modified: '1 week ago', shared: false, backedUp: true },
  { id: '10', name: 'vacation-video.mp4', type: 'video', size: '1.8 GB', modified: '2 weeks ago', shared: false, backedUp: false },
  { id: '11', name: 'podcast-ep12.mp3', type: 'audio', size: '45 MB', modified: '3 weeks ago', shared: true, backedUp: true },
  { id: '12', name: 'logo-design.png', type: 'image', size: '2.1 MB', modified: '1 month ago', shared: false, backedUp: true },
];

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

export default function MyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPath, setCurrentPath] = useState<string[]>(['CloudVault']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Files</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your cloud files and folders</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            <FolderPlus size={16} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            <Upload size={16} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb & View Toggle */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm">
          {currentPath.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="text-slate-600" />}
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  index === currentPath.length - 1
                    ? 'text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
              >
                {index === 0 && <Home size={14} />}
                {item}
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
          <span className="text-xs text-slate-400">Storage: 128 GB of 500 GB used</span>
          <span className="text-xs text-blue-400">25.6%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: '25.6%' }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>Documents (42 GB)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>Media (58 GB)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>Archives (28 GB)
          </span>
        </div>
      </div>

      {/* Files List */}
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
            {files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer items-center"
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {typeIcons[file.type]}
                  </div>
                  <span className="text-sm text-slate-200 truncate font-medium">{file.name}</span>
                </div>
                <div className="col-span-2 text-sm text-slate-400">{file.size}</div>
                <div className="col-span-2 text-sm text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  {file.modified}
                </div>
                <div className="col-span-1 flex items-center gap-1.5">
                  {file.shared && (
                    <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center" title="Shared">
                      <Share2 size={10} className="text-blue-400" />
                    </span>
                  )}
                  {file.backedUp && (
                    <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center" title="Backed up">
                      <Shield size={10} className="text-emerald-400" />
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <Download size={14} />
                  </button>
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <Share2 size={14} />
                  </button>
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {typeIcons[file.type]}
              </div>
              <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">{file.size}</p>
              <div className="flex items-center gap-1 mt-2">
                {file.shared && (
                  <span className="w-4 h-4 rounded bg-blue-500/10 flex items-center justify-center">
                    <Share2 size={8} className="text-blue-400" />
                  </span>
                )}
                {file.backedUp && (
                  <span className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center">
                    <Shield size={8} className="text-emerald-400" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trash Info */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <Trash2 size={16} className="text-slate-500" />
          <span className="text-sm text-slate-400">Trash contains 3 items (156 MB)</span>
        </div>
        <button className="text-xs text-slate-500 hover:text-red-400 transition-colors">Empty Trash</button>
      </div>
    </div>
  );
}

function Shield({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
