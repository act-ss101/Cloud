import {
  HardDrive,
  Cloud,
  Server,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Shield,
  Lock,
  Zap,
  Plus,
  Settings,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface StoragePool {
  id: string;
  name: string;
  type: string;
  provider: string;
  capacity: string;
  used: string;
  usagePercent: number;
  status: 'healthy' | 'warning' | 'error' | 'idle';
  encryption: boolean;
  lastHealthCheck: string;
  latency: string;
  icon: React.ReactNode;
}

const pools: StoragePool[] = [
  {
    id: '1',
    name: 'Pool A — Primary',
    type: 'S3-Compatible',
    provider: 'Backblaze B2',
    capacity: '500 GB',
    used: '325 GB',
    usagePercent: 65,
    status: 'healthy',
    encryption: true,
    lastHealthCheck: '2 min ago',
    latency: '12ms',
    icon: <Cloud size={20} className="text-blue-400" />,
  },
  {
    id: '2',
    name: 'Pool B — Backup',
    type: 'S3-Compatible',
    provider: 'Wasabi',
    capacity: '1 TB',
    used: '420 GB',
    usagePercent: 42,
    status: 'healthy',
    encryption: true,
    lastHealthCheck: '5 min ago',
    latency: '18ms',
    icon: <Shield size={20} className="text-emerald-400" />,
  },
  {
    id: '3',
    name: 'Pool C — Offsite',
    type: 'S3-Compatible',
    provider: 'AWS S3',
    capacity: '2 TB',
    used: '560 GB',
    usagePercent: 28,
    status: 'healthy',
    encryption: true,
    lastHealthCheck: '10 min ago',
    latency: '45ms',
    icon: <Globe size={20} className="text-purple-400" />,
  },
  {
    id: '4',
    name: 'Pool D — Archive',
    type: 'Local NAS',
    provider: 'Synology DS920+',
    capacity: '8 TB',
    used: '960 GB',
    usagePercent: 12,
    status: 'idle',
    encryption: false,
    lastHealthCheck: '1 hour ago',
    latency: '2ms',
    icon: <Server size={20} className="text-amber-400" />,
  },
];

export default function Storage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Storage Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor and manage storage pools and providers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          <Plus size={16} />
          Add Storage
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Total Capacity</span>
          </div>
          <p className="text-2xl font-bold text-white">11.5 TB</p>
          <p className="text-xs text-slate-500">Across 4 pools</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Total Used</span>
          </div>
          <p className="text-2xl font-bold text-white">2.27 TB</p>
          <p className="text-xs text-emerald-400">19.7% utilized</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-purple-400" />
            <span className="text-xs text-slate-400">Avg. Latency</span>
          </div>
          <p className="text-2xl font-bold text-white">19ms</p>
          <p className="text-xs text-slate-500">All pools healthy</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-amber-400" />
            <span className="text-xs text-slate-400">Encryption</span>
          </div>
          <p className="text-2xl font-bold text-white">75%</p>
          <p className="text-xs text-slate-500">3 of 4 pools encrypted</p>
        </div>
      </div>

      {/* Storage Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pools.map((pool) => (
          <div key={pool.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center">
                  {pool.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{pool.name}</h3>
                  <p className="text-xs text-slate-500">{pool.provider} · {pool.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pool.status === 'healthy' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 size={12} /> Healthy
                  </span>
                )}
                {pool.status === 'idle' && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <WifiOff size={12} /> Idle
                  </span>
                )}
                {pool.status === 'warning' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle size={12} /> Warning
                  </span>
                )}
              </div>
            </div>

            {/* Usage Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">{pool.used} of {pool.capacity}</span>
                <span className="text-xs font-medium text-slate-300">{pool.usagePercent}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pool.usagePercent > 80 ? 'bg-red-500' :
                    pool.usagePercent > 60 ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${pool.usagePercent}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Wifi size={12} className="text-slate-500" />
                <span className="text-xs text-slate-400">Latency: {pool.latency}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={12} className="text-slate-500" />
                <span className="text-xs text-slate-400">Health: {pool.lastHealthCheck}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={12} className={pool.encryption ? 'text-emerald-400' : 'text-slate-500'} />
                <span className={`text-xs ${pool.encryption ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {pool.encryption ? 'AES-256 Encrypted' : 'Not encrypted'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-slate-500" />
                <span className="text-xs text-slate-400">
                  {pool.type === 'Local NAS' ? 'Local' : 'Cloud'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Activity size={12} /> Monitor
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <RefreshCw size={12} /> Health Check
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Settings size={12} /> Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Storage Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Storage Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ArchBlock
            title="Pool A — Primary"
            subtitle="Active files & sharing"
            color="blue"
            items={['User uploads', 'Shared files', 'Active projects', 'Recent documents']}
          />
          <ArchBlock
            title="Pool B — Backup"
            subtitle="Encrypted snapshots"
            color="emerald"
            items={['Daily snapshots', 'Weekly full backups', 'Database dumps', 'Version history']}
          />
          <ArchBlock
            title="Pool C — Offsite"
            subtitle="Cross-location replica"
            color="purple"
            items={['Mirror of Pool B', 'Disaster recovery', 'Geographic redundancy', '30-day retention']}
          />
          <ArchBlock
            title="Pool D — Archive"
            subtitle="Long-term cold storage"
            color="amber"
            items={['Old projects', 'Compliance data', 'Annual archives', 'Inactive data']}
          />
        </div>
      </div>

      {/* Cost Estimation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Monthly Cost Estimate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <CostRow provider="Backblaze B2" storage="325 GB" cost="$2.27" />
            <CostRow provider="Wasabi" storage="420 GB" cost="$2.73" />
            <CostRow provider="AWS S3" storage="560 GB" cost="$12.88" />
            <CostRow provider="Local NAS" storage="960 GB" cost="$0.00" note="Hardware cost" />
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300">Estimated Total</span>
              <span className="text-lg font-bold text-white">$17.88/mo</span>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p>• Does not include egress fees</p>
              <p>• Does not include API transaction costs</p>
              <p>• Does not include server/database costs</p>
              <p>• Exchange rate: 1 USD ≈ 35 THB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchBlock({
  title,
  subtitle,
  color,
  items,
}: {
  title: string;
  subtitle: string;
  color: string;
  items: string[];
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
  };

  const dotColor: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <h3 className="text-sm font-medium text-white mb-0.5">{title}</h3>
      <p className="text-[10px] text-slate-500 mb-3">{subtitle}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor[color]}`}></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CostRow({ provider, storage, cost, note }: { provider: string; storage: string; cost: string; note?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div>
        <p className="text-sm text-slate-200">{provider}</p>
        <p className="text-xs text-slate-500">{storage} {note && `· ${note}`}</p>
      </div>
      <span className="text-sm font-medium text-slate-300">{cost}</span>
    </div>
  );
}
