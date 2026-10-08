import { useState } from 'react';
import {
  Link2,
  Copy,
  Lock,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Users,
  Shield,
  Download,
  Upload,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface ShareLink {
  id: string;
  name: string;
  type: 'file' | 'folder';
  url: string;
  access: 'read' | 'upload' | 'download';
  password: boolean;
  expiry: string | null;
  views: number;
  downloads: number;
  created: string;
  status: 'active' | 'expired' | 'revoked';
}

const shareLinks: ShareLink[] = [
  {
    id: '1',
    name: 'Project-Source.zip',
    type: 'file',
    url: 'https://vault.app/s/abc123',
    access: 'download',
    password: true,
    expiry: '2024-02-15',
    views: 24,
    downloads: 8,
    created: 'Jan 10, 2024',
    status: 'active',
  },
  {
    id: '2',
    name: 'Documents/Reports',
    type: 'folder',
    url: 'https://vault.app/s/def456',
    access: 'read',
    password: false,
    expiry: null,
    views: 156,
    downloads: 42,
    created: 'Dec 20, 2023',
    status: 'active',
  },
  {
    id: '3',
    name: 'Photos/Vacation-2024',
    type: 'folder',
    url: 'https://vault.app/s/ghi789',
    access: 'download',
    password: true,
    expiry: '2024-01-30',
    views: 12,
    downloads: 5,
    created: 'Jan 5, 2024',
    status: 'active',
  },
  {
    id: '4',
    name: 'Database-Backup.sql',
    type: 'file',
    url: 'https://vault.app/s/jkl012',
    access: 'download',
    password: true,
    expiry: '2024-01-10',
    views: 3,
    downloads: 1,
    created: 'Jan 3, 2024',
    status: 'expired',
  },
  {
    id: '5',
    name: 'Shared-Workspace',
    type: 'folder',
    url: 'https://vault.app/s/mno345',
    access: 'upload',
    password: false,
    expiry: null,
    views: 89,
    downloads: 0,
    created: 'Nov 15, 2023',
    status: 'active',
  },
  {
    id: '6',
    name: 'Old-Project-Files',
    type: 'folder',
    url: 'https://vault.app/s/pqr678',
    access: 'read',
    password: false,
    expiry: '2024-01-05',
    views: 45,
    downloads: 12,
    created: 'Oct 1, 2023',
    status: 'revoked',
  },
];

export default function Shared() {
  const [activeTab, setActiveTab] = useState<'links' | 'teams'>('links');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Shared Files</h1>
          <p className="text-sm text-slate-400 mt-1">Manage shared links, permissions, and access</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          <Plus size={16} />
          Create Share Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Active Links</span>
          </div>
          <p className="text-2xl font-bold text-white">4</p>
          <p className="text-xs text-slate-500">2 with password</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-purple-400" />
            <span className="text-xs text-slate-400">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-white">286</p>
          <p className="text-xs text-emerald-400">+12% this week</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-white">68</p>
          <p className="text-xs text-slate-500">All time</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-amber-400" />
            <span className="text-xs text-slate-400">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-white">3</p>
          <p className="text-xs text-slate-500">1 pending invite</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {(['links', 'teams'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'links' ? 'Share Links' : 'Team Access'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'links' ? <ShareLinksTab links={shareLinks} /> : <TeamAccessTab />}
    </div>
  );
}

function ShareLinksTab({ links }: { links: ShareLink[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const accessIcons = {
    read: <Eye size={12} />,
    upload: <Upload size={12} />,
    download: <Download size={12} />,
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.id}
          className={`bg-slate-900 border rounded-xl p-5 transition-all ${
            link.status === 'active'
              ? 'border-slate-800 hover:border-slate-700'
              : 'border-slate-800/50 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                link.type === 'folder' ? 'bg-blue-500/10' : 'bg-purple-500/10'
              }`}>
                {link.type === 'folder' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{link.name}</h3>
                <p className="text-xs text-slate-500">{link.type === 'folder' ? 'Folder' : 'File'} · Created {link.created}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {link.status === 'active' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Active</span>
              ) : link.status === 'expired' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">Expired</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">Revoked</span>
              )}
            </div>
          </div>

          {/* Link URL */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-slate-800/50 rounded-lg">
            <Link2 size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate flex-1">{link.url}</span>
            <button
              onClick={() => handleCopy(link.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded transition-colors flex-shrink-0"
            >
              {copiedId === link.id ? (
                <><CheckCircle2 size={12} /> Copied!</>
              ) : (
                <><Copy size={12} /> Copy</>
              )}
            </button>
          </div>

          {/* Permissions & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                {accessIcons[link.access]}
                {link.access.charAt(0).toUpperCase() + link.access.slice(1)}
              </span>
              {link.password && (
                <span className="flex items-center gap-1.5 text-xs text-purple-400">
                  <Lock size={12} /> Password protected
                </span>
              )}
              {link.expiry && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Clock size={12} /> Expires {link.expiry}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                <Eye size={12} className="inline mr-1" />{link.views} views
              </span>
              <span className="text-xs text-slate-500">
                <Download size={12} className="inline mr-1" />{link.downloads} downloads
              </span>
            </div>
          </div>

          {/* Actions */}
          {link.status === 'active' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Eye size={12} /> Preview
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Shield size={12} /> Permissions
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={12} /> Revoke
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TeamAccessTab() {
  const members = [
    { name: 'Admin (You)', role: 'Owner', email: 'admin@cloudvault.io', status: 'active', avatar: 'A' },
    { name: 'Somchai P.', role: 'Member', email: 'somchai@team.io', status: 'active', avatar: 'S' },
    { name: 'Nattaya K.', role: 'Member', email: 'nattaya@team.io', status: 'active', avatar: 'N' },
    { name: 'john@example.com', role: 'Guest', email: 'john@example.com', status: 'pending', avatar: 'J' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Member</div>
          <div>Role</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {members.map((member, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors items-center">
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {member.avatar}
                </div>
                <div>
                  <p className="text-sm text-slate-200">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  member.role === 'Owner' ? 'bg-purple-500/10 text-purple-400' :
                  member.role === 'Member' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {member.role}
                </span>
              </div>
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <Eye size={14} />
                </button>
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl text-sm text-slate-400 hover:text-blue-400 transition-all w-full justify-center">
        <Plus size={16} />
        Invite Team Member
      </button>
    </div>
  );
}
