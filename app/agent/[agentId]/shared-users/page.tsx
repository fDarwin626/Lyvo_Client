'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Eye, EyeOff, RefreshCw, Ban, Trash2, Check } from 'lucide-react';
import { getAgentShares, banUserFromShare, revokeShareLink, reactivateShareLink } from '@/lib/api';

interface ShareData {
  share_id: string;
  share_token: string;
  share_url: string;
  share_type: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  total_messages: number;
  total_credits_used: number;
  unique_users_count: number;
  last_used_at: string | null;
  recent_users: Array<{
    identifier: string;
    user_type: string;
    messages_sent: number;
    credits_used: number;
    last_active: string;
  }>;
}

export default function SharedUsersPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [shares, setShares] = useState<ShareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      const data = await getAgentShares(agentId);
      setShares(data.shares);
      setAgentName(data.agent_name);
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  };

const copyToClipboard = (text: string, shareId: string, share_id: string) => {
  const fullUrl = `${window.location.origin}${text}`;
  navigator.clipboard.writeText(fullUrl);
  setCopiedLink(shareId);
  setTimeout(() => setCopiedLink(null), 2000);
};


  const handleBan = async (shareId: string, identifier: string) => {
    if (!confirm(`Ban ${identifier} from accessing this agent?`)) return;
    
    try {
      await banUserFromShare(shareId, identifier, 'Banned by owner');
      alert(`${identifier} has been banned`);
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed to ban user');
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Revoke this share link? All users will lose access.')) return;
    
    try {
      await revokeShareLink(shareId);
      alert('Share link revoked successfully');
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed to revoke link');
    }
  };

  const handleRenew = async (shareId: string) => {
    const days = prompt('Extend by how many days? (1-30)', '7');
    if (!days) return;
    
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
      alert('Please enter a number between 1 and 30');
      return;
    }
    
    try {
      await reactivateShareLink(shareId, daysNum);
      alert(`Link extended by ${daysNum} days!`);
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed to extend link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101114] flex items-center justify-center">
        <div className="text-white text-xl">Loading shared users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101114]">
      {/* Header */}
      <div className="bg-[#0d0d0f] border-b border-slate-700 p-6">
        <button
          onClick={() => router.push(`/chat-room/${agentId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Chat Room</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Shared Users Management</h1>
        <p className="text-slate-400">Agent: {agentName}</p>
        
        <div className="flex gap-6 mt-4 flex-wrap">
          <div className="text-sm">
            <span className="text-slate-400">Total Links:</span>
            <span className="text-white font-semibold ml-2">{shares.length}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Active:</span>
            <span className="text-green-400 font-semibold ml-2">
              {shares.filter(s => s.is_active).length}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Total Messages:</span>
            <span className="text-blue-400 font-semibold ml-2">
              {shares.reduce((sum, s) => sum + s.total_messages, 0)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Total Credits Used:</span>
            <span className="text-purple-400 font-semibold ml-2">
              {shares.reduce((sum, s) => sum + s.total_credits_used, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Shares List */}
      <div className="max-w-7xl mx-auto p-6">
        {shares.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No shared links yet</p>
            <p className="text-slate-500 text-sm mt-2">Create a share link to allow others to chat with your agent</p>
          </div>
        ) : (
          <div className="space-y-6">
            {shares.map((share) => (
              <div
                key={share.share_id}
                className="bg-[#1f2024] border border-slate-700 rounded-2xl p-6"
              >
                {/* Share Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        share.share_type === 'password'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {share.share_type === 'password' ? '🔒 Password Protected' : '👤 Account Required'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        share.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {share.is_active ? '✓ Active' : '✗ Revoked'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created: {new Date(share.created_at).toLocaleString()} • 
                      Expires: {new Date(share.expires_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRenew(share.share_id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Extend expiry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRevoke(share.share_id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Revoke link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Share Link & Password Section */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6 space-y-3">
                  {/* Share Link */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">
                      Share Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}${share.share_url}`}
                        readOnly
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(share.share_url, 'link', share.share_id)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Copy link"
                      >
                        {copiedLink === share.share_id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>


                {/* Password Notice (only for password-protected shares) */}
                {share.share_type === 'password' && (
                <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">
                    Password
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <p className="text-sm text-slate-400">
                        🔒 Password is securely hashed and cannot be retrieved
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        ⚠️ If user forgets password, revoke this link and create a new one
                    </p>
                    </div>
                </div>
                )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Total Messages</p>
                    <p className="text-xl font-bold text-white">{share.total_messages}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Credits Used</p>
                    <p className="text-xl font-bold text-purple-400">{share.total_credits_used.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Unique Users</p>
                    <p className="text-xl font-bold text-blue-400">{share.unique_users_count}</p>
                  </div>
                </div>

                {/* Recent Users */}
                {share.recent_users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Users</h3>
                    <div className="space-y-2">
                      {share.recent_users.map((user, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{user.identifier}</p>
                            <p className="text-xs text-slate-500">
                              {user.messages_sent} messages • {user.credits_used} credits • 
                              Last active: {new Date(user.last_active).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleBan(share.share_id, user.identifier)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors ml-4"
                            title="Ban user"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}