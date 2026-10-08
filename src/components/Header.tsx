import { Menu, Bell, Search, Upload, User } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search files, backups, shared links..."
            className="w-80 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Upload Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          <Upload size={16} />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        {/* User Avatar */}
        <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-200">Admin</p>
            <p className="text-[10px] text-slate-500">Personal Plan</p>
          </div>
        </button>
      </div>
    </header>
  );
}
