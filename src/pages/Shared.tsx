import { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2,
  Inbox,
} from 'lucide-react';
import { apiClient, type ApiError } from '../lib/api';

interface ShareLink {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'file' | 'folder';
  permission: 'view' | 'download' | 'upload';
  expiresAt: string | null;
  isActive: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  url?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function Shared() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'teams'>('links');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadShares = async () => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation: const data = await apiClient.listShares();
      // setShares(data.shares);
      
      // Mock data for demo
      setShares([
        {
          id: '1',
          resourceId: 'file-1',
          resourceName: 'Project-Source.zip',
          resourceType: 'file',
          permission: 'download',
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          isActive: true,
          viewCount: 24,
          downloadCount: 8,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: '2',
          resourceId: 'folder-1',
          resourceName: 'Documents/Reports',
          resourceType: 'folder',
          permission: 'view',
          expiresAt: null,
          isActive: true,
          viewCount: 156,
          downloadCount: 42,
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        },
        {
          id: '3',
          resourceId: 'folder-2',
          resourceName: 'Photos/Vacation-2024',
          resourceType: 'folder',
          permission: 'download',
          expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
          isActive: true,
          viewCount: 12,
          downloadCount: 5,
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
      ]);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleCopy = (shareId: string) => {
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (shareId: string) => {
    try {
      // In real implementation: await apiClient.revokeShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share');
    }
  };

  const handleCreate = async () => {
    // In real implementation: await apiClient.createShare(...)
    setShowCreateModal(false);
    await loadShares();
  };

  const activeShares = shares.filter(s => s.isActive);
  const totalViews = shares.reduce((sum, s) => sum + s.viewCount, 0);
  const totalDownloads = shares.reduce((sum, s) => sum + s.downloadCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Shared Files</h1>
          <p className="text-sm text-slate-400 mt-1">Manage shared links, permissions, and access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
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
          <p className="text-2xl font-bold text-white">{activeShares.length}</p>
          <p className="text-xs text-slate-500">{shares.filter(s => s.expiresAt).length} with expiry</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-purple-400" />
            <span className="text-xs text-slate-400">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalViews}</p>
          <p className="text-xs text-emerald-400">+12% this week</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalDownloads}</p>
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
          <p className="text-sm text-slate-400">Loading shares...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && shares.length === 0 && activeTab === 'links' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Inbox size={48} className="text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300 mb-1">No shared files yet</p>
          <p className="text-xs text-slate-500 mb-4">Create a share link to share files with others</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create Share Link
          </button>
        </div>
      )}

      {/* Share Links */}
      {!loading && !error && activeTab === 'links' && shares.length > 0 && (
        <div className="space-y-3">
          {shares.map((share) => (
            <div
              key={share.id}
              className={`bg-slate-900 border rounded-xl p-5 transition-all ${
                share.isActive
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    share.resourceType === 'folder' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                  }`}>
                    {share.resourceType === 'folder' ? (
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
                    <h3 className="text-sm font-semibold text-white">{share.resourceName}</h3>
                    <p className="text-xs text-slate-500">
                      {share.resourceType === 'folder' ? 'Folder' : 'File'} · Created {formatTime(share.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {share.isActive ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">Revoked</span>
                  )}
                </div>
              </div>

              {/* Link URL */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-slate-800/50 rounded-lg">
                <Link2 size={14} className="text-slate-500 flex-shrink-0" />
                <span className="text-xs text-slate-400 truncate flex-1">
                  https://vault.app/s/{share.id}
                </span>
                <button
                  onClick={() => handleCopy(share.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded transition-colors flex-shrink-0"
                >
                  {copiedId === share.id ? (
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
                    {share.permission === 'view' && <Eye size={12} />}
                    {share.permission === 'download' && <Download size={12} />}
                    {share.permission === 'upload' && <Upload size={12} />}
                    {share.permission.charAt(0).toUpperCase() + share.permission.slice(1)}
                  </span>
                  {share.expiresAt && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Clock size={12} /> Expires {new Date(share.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">
                    <Eye size={12} className="inline mr-1" />{share.viewCount} views
                  </span>
                  <span className="text-xs text-slate-500">
                    <Download size={12} className="inline mr-1" />{share.downloadCount} downloads
                  </span>
                </div>
              </div>

              {/* Actions */}
              {share.isActive && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                    <Eye size={12} /> Preview
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                    <Shield size={12} /> Permissions
                  </button>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Revoke
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Team Access Tab */}
      {!loading && !error && activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Member</div>
              <div>Role</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-800/50">
              {[
                { name: 'Admin (You)', role: 'Owner', email: 'admin@cloudvault.io', status: 'active', avatar: 'A' },
                { name: 'Somchai P.', role: 'Member', email: 'somchai@team.io', status: 'active', avatar: 'S' },
                { name: 'Nattaya K.', role: 'Member', email: 'nattaya@team.io', status: 'active', avatar: 'N' },
                { name: 'john@example.com', role: 'Guest', email: 'john@example.com', status: 'pending', avatar: 'J' },
              ].map((member, index) => (
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
      )}
    </div>
  );
}
