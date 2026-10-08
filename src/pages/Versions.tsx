import { useState } from 'react';
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
} from 'lucide-react';

interface FileVersion {
  id: string;
  fileName: string;
  fileType: string;
  version: number;
  date: string;
  size: string;
  changeType: 'created' | 'modified' | 'restored';
  hash: string;
  author: string;
}

const versionHistory: FileVersion[] = [
  { id: '1', fileName: 'Project-Source.zip', fileType: 'archive', version: 12, date: 'Today 10:00 AM', size: '2.4 GB', changeType: 'modified', hash: 'a3f2b8c...', author: 'Admin' },
  { id: '2', fileName: 'Project-Source.zip', fileType: 'archive', version: 11, date: 'Yesterday 03:30 PM', size: '2.3 GB', changeType: 'modified', hash: 'e7d4f1a...', author: 'Admin' },
  { id: '3', fileName: 'Project-Source.zip', fileType: 'archive', version: 10, date: 'Jan 13, 02:15 PM', size: '2.1 GB', changeType: 'modified', hash: 'b9c3e5d...', author: 'Admin' },
  { id: '4', fileName: 'Database-Backup.sql', fileType: 'database', version: 48, date: 'Today 06:00 AM', size: '840 MB', changeType: 'created', hash: 'f2a8b4c...', author: 'System' },
  { id: '5', fileName: 'Database-Backup.sql', fileType: 'database', version: 47, date: 'Yesterday 06:00 PM', size: '838 MB', changeType: 'created', hash: 'c5d7e9f...', author: 'System' },
  { id: '6', fileName: 'Database-Backup.sql', fileType: 'database', version: 46, date: 'Yesterday 06:00 AM', size: '835 MB', changeType: 'created', hash: 'a1b3c5d...', author: 'System' },
  { id: '7', fileName: 'README.md', fileType: 'document', version: 8, date: 'Yesterday 11:20 AM', size: '12 KB', changeType: 'modified', hash: 'd4e6f8a...', author: 'Admin' },
  { id: '8', fileName: 'README.md', fileType: 'document', version: 7, date: 'Jan 12, 04:45 PM', size: '11 KB', changeType: 'modified', hash: 'b2c4d6e...', author: 'Somchai' },
  { id: '9', fileName: 'README.md', fileType: 'document', version: 6, date: 'Jan 10, 09:30 AM', size: '10 KB', changeType: 'restored', hash: 'f8a2b4c...', author: 'Admin' },
  { id: '10', fileName: 'server-config.yaml', fileType: 'code', version: 23, date: 'Jan 14, 08:00 PM', size: '4 KB', changeType: 'modified', hash: 'e3f5a7b...', author: 'Admin' },
  { id: '11', fileName: 'server-config.yaml', fileType: 'code', version: 22, date: 'Jan 13, 06:30 PM', size: '4 KB', changeType: 'modified', hash: 'c9d1e3f...', author: 'Admin' },
  { id: '12', fileName: 'logo-design.png', fileType: 'image', version: 5, date: 'Jan 8, 02:00 PM', size: '2.1 MB', changeType: 'modified', hash: 'a5b7c9d...', author: 'Nattaya' },
];

const typeIcons: Record<string, React.ReactNode> = {
  archive: <FileArchive size={16} className="text-amber-400" />,
  database: <Database size={16} className="text-cyan-400" />,
  document: <FileText size={16} className="text-green-400" />,
  code: <Code size={16} className="text-emerald-400" />,
  image: <Image size={16} className="text-pink-400" />,
};

export default function Versions() {
  const [selectedFile, setSelectedFile] = useState<string | null>('Project-Source.zip');
  const [filter, setFilter] = useState<string>('all');

  const files = ['all', 'Project-Source.zip', 'Database-Backup.sql', 'README.md', 'server-config.yaml', 'logo-design.png'];

  const filteredVersions = selectedFile === 'all'
    ? versionHistory
    : versionHistory.filter(v => v.fileName === selectedFile);

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

      {/* File Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {files.map((file) => (
          <button
            key={file}
            onClick={() => setSelectedFile(file)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedFile === file
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700 hover:border-slate-600'
            }`}
          >
            {file === 'all' ? 'All Files' : file}
          </button>
        ))}
      </div>

      {/* Version Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-8 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">File</div>
          <div>Version</div>
          <div>Date</div>
          <div>Size</div>
          <div>Change</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {filteredVersions.map((version) => (
            <div key={version.id} className="grid grid-cols-8 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors items-center">
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {typeIcons[version.fileType]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium">{version.fileName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{version.hash} · by {version.author}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-200">v{version.version}</span>
              </div>
              <div className="text-sm text-slate-400">{version.date}</div>
              <div className="text-sm text-slate-400">{version.size}</div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  version.changeType === 'created' ? 'bg-emerald-500/10 text-emerald-400' :
                  version.changeType === 'modified' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>
                  {version.changeType}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Preview">
                  <Eye size={14} />
                </button>
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Compare">
                  <GitCompare size={14} />
                </button>
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Download">
                  <Download size={14} />
                </button>
                <button className="p-1.5 rounded-md text-blue-400 hover:bg-blue-500/10 transition-colors" title="Restore">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version Info */}
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
    </div>
  );
}
