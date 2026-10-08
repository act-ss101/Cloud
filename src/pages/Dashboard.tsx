import {
  HardDrive,
  Shield,
  Clock,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileText,
  Database,
  Image,
  Folder,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import type { Page } from '../App';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Status Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <CheckCircle2 size={20} className="text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-300">All systems healthy</p>
          <p className="text-xs text-emerald-400/70">Last sync: 2 minutes ago · 3 storage pools active</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<HardDrive size={22} />}
          label="Storage Used"
          value="128 GB"
          sublabel="of 500 GB"
          color="blue"
          progress={25.6}
        />
        <StatCard
          icon={<Shield size={22} />}
          label="Last Backup"
          value="02:30"
          sublabel="Snapshot stored"
          color="emerald"
          progress={100}
        />
        <StatCard
          icon={<Upload size={22} />}
          label="Uploads Today"
          value="24 files"
          sublabel="3.2 GB transferred"
          color="purple"
          progress={60}
        />
        <StatCard
          icon={<Activity size={22} />}
          label="Active Jobs"
          value="2"
          sublabel="1 backup, 1 sync"
          color="amber"
          progress={40}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Recent Files</h2>
            <button
              onClick={() => onNavigate('files')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-slate-800/50">
            <FileRow
              icon={<FileArchive size={18} className="text-amber-400" />}
              name="Project-Source.zip"
              size="2.4 GB"
              time="10 minutes ago"
              type="Archive"
            />
            <FileRow
              icon={<Database size={18} className="text-cyan-400" />}
              name="Database-Backup.sql"
              size="840 MB"
              time="2 hours ago"
              type="Database"
            />
            <FileRow
              icon={<Folder size={18} className="text-blue-400" />}
              name="Documents"
              size="1.2 GB"
              time="5 hours ago"
              type="Folder"
            />
            <FileRow
              icon={<Image size={18} className="text-pink-400" />}
              name="Photos-2024"
              size="4.8 GB"
              time="Yesterday"
              type="Folder"
            />
            <FileRow
              icon={<FileText size={18} className="text-green-400" />}
              name="README.md"
              size="12 KB"
              time="Yesterday"
              type="Document"
            />
            <FileRow
              icon={<FileArchive size={18} className="text-amber-400" />}
              name="server-logs-2024.tar.gz"
              size="156 MB"
              time="2 days ago"
              type="Archive"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Backup Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Backup Status</h2>
            <div className="space-y-4">
              <BackupItem
                name="Daily Snapshot"
                status="completed"
                time="02:30 AM"
                size="12.4 GB"
              />
              <BackupItem
                name="Weekly Full Backup"
                status="scheduled"
                time="Sunday 03:00"
                size="~45 GB"
              />
              <BackupItem
                name="Database Backup"
                status="completed"
                time="06:00 AM"
                size="840 MB"
              />
            </div>
            <button
              onClick={() => onNavigate('backups')}
              className="mt-4 w-full py-2 text-xs font-medium text-blue-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/30 rounded-lg transition-all"
            >
              Manage Backups →
            </button>
          </div>

          {/* Storage Pools */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Storage Pools</h2>
            <div className="space-y-3">
              <PoolItem name="Pool A — Primary" usage={65} status="healthy" />
              <PoolItem name="Pool B — Backup" usage={42} status="healthy" />
              <PoolItem name="Pool C — Offsite" usage={28} status="healthy" />
              <PoolItem name="Pool D — Archive" usage={12} status="idle" />
            </div>
            <button
              onClick={() => onNavigate('storage')}
              className="mt-4 w-full py-2 text-xs font-medium text-blue-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/30 rounded-lg transition-all"
            >
              Storage Details →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<Upload size={16} />} label="Upload Files" />
              <ActionButton icon={<Shield size={16} />} label="Run Backup" />
              <ActionButton icon={<Download size={16} />} label="Restore" />
              <ActionButton icon={<Zap size={16} />} label="Sync Now" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Activity Timeline</h2>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Last 24 hours</span>
          </div>
        </div>
        <div className="space-y-3">
          <TimelineItem
            icon={<CheckCircle2 size={14} className="text-emerald-400" />}
            text="Daily backup completed successfully"
            time="02:30 AM"
            detail="12.4 GB · 847 files · 0 errors"
          />
          <TimelineItem
            icon={<Upload size={14} className="text-blue-400" />}
            text="Project-Source.zip uploaded"
            time="10 minutes ago"
            detail="2.4 GB · Pool A (Primary)"
          />
          <TimelineItem
            icon={<AlertCircle size={14} className="text-amber-400" />}
            text="Storage pool C sync delayed"
            time="1 hour ago"
            detail="Retrying in 5 minutes · Network latency"
          />
          <TimelineItem
            icon={<Download size={14} className="text-purple-400" />}
            text="Database-Backup.sql restored"
            time="3 hours ago"
            detail="840 MB · Verified hash ✓"
          />
          <TimelineItem
            icon={<Clock size={14} className="text-slate-400" />}
            text="Retention policy applied"
            time="06:00 AM"
            detail="3 expired snapshots removed · 4.2 GB freed"
          />
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
  progress: number;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
  };

  const barColorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className={colorMap[color].split(' ').pop()}>{icon}</span>
        <span className="text-xs text-slate-500">{sublabel}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorMap[color]} rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function FileRow({
  icon,
  name,
  size,
  time,
  type,
}: {
  icon: React.ReactNode;
  name: string;
  size: string;
  time: string;
  type: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
        <p className="text-xs text-slate-500">{type}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-slate-300">{size}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
}

function BackupItem({
  name,
  status,
  time,
  size,
}: {
  name: string;
  status: 'completed' | 'running' | 'scheduled' | 'failed';
  time: string;
  size: string;
}) {
  const statusConfig = {
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Completed' },
    running: { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Running' },
    scheduled: { color: 'text-slate-400', bg: 'bg-slate-400', label: 'Scheduled' },
    failed: { color: 'text-red-400', bg: 'bg-red-400', label: 'Failed' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${config.bg} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{name}</p>
        <p className="text-xs text-slate-500">
          {time} · {size}
        </p>
      </div>
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}

function PoolItem({ name, usage, status }: { name: string; usage: number; status: string }) {
  const statusColor = status === 'healthy' ? 'text-emerald-400' : 'text-slate-400';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-300">{name}</span>
        <span className={`text-xs ${statusColor}`}>{status}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${usage}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5">{usage}% used</p>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-300 hover:text-white transition-all">
      {icon}
      {label}
    </button>
  );
}

function TimelineItem({
  icon,
  text,
  time,
  detail,
}: {
  icon: React.ReactNode;
  text: string;
  time: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">{text}</p>
        <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
      </div>
      <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>
    </div>
  );
}
