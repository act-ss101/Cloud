import {
  LayoutDashboard,
  FolderOpen,
  Shield,
  Share2,
  History,
  HardDrive,
  ChevronLeft,
  Cloud,
  Settings,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'files', label: 'My Files', icon: <FolderOpen size={20} /> },
  { id: 'backups', label: 'Backups', icon: <Shield size={20} /> },
  { id: 'shared', label: 'Shared', icon: <Share2 size={20} /> },
  { id: 'versions', label: 'Versions', icon: <History size={20} /> },
  { id: 'storage', label: 'Storage', icon: <HardDrive size={20} /> },
  { id: 'trash', label: 'Trash', icon: <Trash2 size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <Cloud size={20} className="text-white" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-white tracking-tight">CloudVault</h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">Personal Cloud Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {isOpen && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Workspace
          </p>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentPage === item.id
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
          <Settings size={20} />
          {isOpen && <span>Settings</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
          <HelpCircle size={20} />
          {isOpen && <span>Help</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-slate-800 text-slate-500 hover:text-white transition-colors"
      >
        <ChevronLeft
          size={18}
          className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </aside>
  );
}
