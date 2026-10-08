import { useState } from 'react';
import {
  Shield,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Calendar,
  HardDrive,
  Lock,
  Eye,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'running' | 'scheduled' | 'failed' | 'paused';
  lastRun: string;
  nextRun: string;
  size: string;
  files: number;
  duration: string;
  destination: string;
  encrypted: boolean;
}

interface Snapshot {
  id: string;
  date: string;
  type: string;
  size: string;
  files: number;
  status: 'verified' | 'pending' | 'corrupted';
  retention: string;
}

const backupJobs: BackupJob[] = [
  {
    id: '1',
    name: 'Daily Incremental Backup',
    type: 'incremental',
    status: 'completed',
    lastRun: 'Today 02:30 AM',
    nextRun: 'Tomorrow 02:30 AM',
    size: '12.4 GB',
    files: 847,
    duration: '23 min',
    destination: 'Pool B — Backup (S3)',
    encrypted: true,
  },
  {
    id: '2',
    name: 'Weekly Full Backup',
    type: 'full',
    status: 'scheduled',
    lastRun: 'Last Sunday 03:00 AM',
    nextRun: 'Next Sunday 03:00 AM',
    size: '~45 GB',
    files: 12450,
    duration: '~2 hours',
    destination: 'Pool B + Pool C (Offsite)',
    encrypted: true,
  },
  {
    id: '3',
    name: 'Database Backup',
    type: 'full',
    status: 'completed',
    lastRun: 'Today 06:00 AM',
    nextRun: 'Today 06:00 PM',
    size: '840 MB',
    files: 1,
    duration: '4 min',
    destination: 'Pool B — Backup (S3)',
    encrypted: true,
  },
  {
    id: '4',
    name: 'Project Source Backup',
    type: 'incremental',
    status: 'running',
    lastRun: 'In progress...',
    nextRun: 'Continuous',
    size: '2.4 GB',
    files: 3200,
    duration: '~15 min',
    destination: 'Pool A — Primary (NAS)',
    encrypted: false,
  },
  {
    id: '5',
    name: 'Archive Old Projects',
    type: 'full',
    status: 'failed',
    lastRun: 'Yesterday 04:00 AM',
    nextRun: 'Retry in 1 hour',
    size: '8.2 GB',
    files: 1560,
    duration: 'Failed at 60%',
    destination: 'Pool D — Archive',
    encrypted: true,
  },
];

const snapshots: Snapshot[] = [
  { id: '1', date: '2024-01-15 02:30', type: 'Incremental', size: '12.4 GB', files: 847, status: 'verified', retention: '30 days' },
  { id: '2', date: '2024-01-14 02:30', type: 'Incremental', size: '8.2 GB', files: 623, status: 'verified', retention: '29 days' },
  { id: '3', date: '2024-01-14 03:00', type: 'Full (Weekly)', size: '44.8 GB', files: 12380, status: 'verified', retention: '90 days' },
  { id: '4', date: '2024-01-13 02:30', type: 'Incremental', size: '5.1 GB', files: 412, status: 'verified', retention: '28 days' },
  { id: '5', date: '2024-01-12 02:30', type: 'Incremental', size: '9.8 GB', files: 756, status: 'verified', retention: '27 days' },
  { id: '6', date: '2024-01-07 03:00', type: 'Full (Weekly)', size: '43.2 GB', files: 12200, status: 'verified', retention: '83 days' },
];

export default function Backups() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'snapshots' | 'policies'>('jobs');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Backup Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Manage backup jobs, snapshots, and recovery</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          <Plus size={16} />
          New Backup Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Successful (30d)</span>
          </div>
          <p className="text-2xl font-bold text-white">28</p>
          <p className="text-xs text-emerald-400">93.3% success rate</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Total Backed Up</span>
          </div>
          <p className="text-2xl font-bold text-white">342 GB</p>
          <p className="text-xs text-slate-400">Across all pools</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-purple-400" />
            <span className="text-xs text-slate-400">Encrypted</span>
          </div>
          <p className="text-2xl font-bold text-white">100%</p>
          <p className="text-xs text-slate-400">AES-256 encryption</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-xs text-slate-400">Avg. Duration</span>
          </div>
          <p className="text-2xl font-bold text-white">23 min</p>
          <p className="text-xs text-slate-400">Incremental backup</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {(['jobs', 'snapshots', 'policies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'jobs' ? 'Backup Jobs' : tab === 'snapshots' ? 'Snapshots' : 'Retention Policies'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'jobs' && <BackupJobsTab jobs={backupJobs} />}
      {activeTab === 'snapshots' && <SnapshotsTab snapshots={snapshots} />}
      {activeTab === 'policies' && <PoliciesTab />}
    </div>
  );
}

function BackupJobsTab({ jobs }: { jobs: BackupJob[] }) {
  const statusConfig = {
    completed: { icon: <CheckCircle2 size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
    running: { icon: <Play size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Running' },
    scheduled: { icon: <Clock size={16} />, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Scheduled' },
    failed: { icon: <XCircle size={16} />, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
    paused: { icon: <Pause size={16} />, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Paused' },
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const status = statusConfig[job.status];
        return (
          <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center ${status.color}`}>
                  {status.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{job.name}</h3>
                  <p className="text-xs text-slate-500">{job.type.charAt(0).toUpperCase() + job.type.slice(1)} · {job.destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                {job.encrypted && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 flex items-center gap-1">
                    <Lock size={10} /> Encrypted
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Last Run</p>
                <p className="text-xs text-slate-300">{job.lastRun}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Next Run</p>
                <p className="text-xs text-slate-300">{job.nextRun}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Size</p>
                <p className="text-xs text-slate-300">{job.size}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Files</p>
                <p className="text-xs text-slate-300">{job.files.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</p>
                <p className="text-xs text-slate-300">{job.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              {job.status === 'running' ? (
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                  <Pause size={12} /> Pause
                </button>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Play size={12} /> Run Now
                </button>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <RotateCcw size={12} /> Restore
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Eye size={12} /> View Log
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Settings size={12} /> Configure
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SnapshotsTab({ snapshots }: { snapshots: Snapshot[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <div>Date</div>
        <div>Type</div>
        <div>Size</div>
        <div>Files</div>
        <div>Status</div>
        <div>Retention</div>
        <div className="text-right">Actions</div>
      </div>
      <div className="divide-y divide-slate-800/50">
        {snapshots.map((snap) => (
          <div key={snap.id} className="grid grid-cols-7 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors items-center">
            <div className="text-sm text-slate-200">{snap.date}</div>
            <div className="text-sm text-slate-400">{snap.type}</div>
            <div className="text-sm text-slate-400">{snap.size}</div>
            <div className="text-sm text-slate-400">{snap.files.toLocaleString()}</div>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                snap.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                snap.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {snap.status}
              </span>
            </div>
            <div className="text-sm text-slate-400">{snap.retention}</div>
            <div className="flex items-center justify-end gap-1">
              <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Restore">
                <RotateCcw size={14} />
              </button>
              <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Download">
                <Download size={14} />
              </button>
              <button className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PoliciesTab() {
  const policies = [
    { name: 'Daily Snapshots', keep: '30 days', schedule: 'Every day at 02:30 AM', count: 28 },
    { name: 'Weekly Full Backups', keep: '90 days', schedule: 'Every Sunday at 03:00 AM', count: 12 },
    { name: 'Monthly Archives', keep: '1 year', schedule: '1st of month at 04:00 AM', count: 12 },
    { name: 'Database Backups', keep: '14 days', schedule: 'Every 12 hours', count: 28 },
  ];

  return (
    <div className="space-y-4">
      {policies.map((policy, index) => (
        <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                <p className="text-xs text-slate-500">{policy.schedule}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{policy.count} snapshots</p>
                <p className="text-xs text-slate-500">Retain: {policy.keep}</p>
              </div>
              <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-400" />
              Immutable storage enabled
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lock size={12} className="text-purple-400" />
              AES-256 encrypted
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
