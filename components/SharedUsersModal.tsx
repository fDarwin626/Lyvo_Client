'use client';

import { useState, useEffect } from 'react';
import { X, Ban, RefreshCw, Trash2 } from 'lucide-react';
import { 
  getAgentShares, 
  banUserFromShare, 
  revokeShareLink,
  reactivateShareLink,
  ShareListResponse 
} from '@/lib/api';

interface SharedUsersModalProps {
  agentId: string;
  onClose: () => void;
}

export default function SharedUsersModal({ agentId, onClose }: SharedUsersModalProps) {
  const [shares, setShares] = useState<ShareListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadShares();
  }, []);
  
  const loadShares = async () => {
    try {
      const data = await getAgentShares(agentId);
      setShares(data);
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBanUser = async (shareId: string, identifier: string) => {
    if (!confirm(`Ban ${identifier}?`)) return;
    
    try {
      await banUserFromShare(shareId, identifier, 'Banned by owner');
      alert('User banned');
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed');
    }
  };
  
  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Revoke this share link?')) return;
    
    try {
      await revokeShareLink(shareId);
      alert('Link revoked');
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed');
    }
  };
  
  const handleRenewToken = async (shareId: string) => {
    const days = prompt('Extend by how many days?', '7');
    if (!days) return;
    
    try {
      await reactivateShareLink(shareId, parseInt(days));
      alert('Link extended!');
      loadShares();
    } catch (error: any) {
      alert(error.message || 'Failed');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shared Users</h2>
            <p className="text-sm text-gray-500">
              {shares?.total_shares || 0} links • {shares?.active_shares || 0} active
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <p>Loading...</p>
          ) : shares && shares.shares.length > 0 ? (
            <div className="space-y-6">
              {shares.shares.map(share => (
                <div key={share.share_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">
                        {share.share_type === 'password' ? '🔒 Password' : '👤 Account'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {share.unique_users_count} users • {share.total_messages} msgs • {share.total_credits_used} credits
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRenewToken(share.share_id)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevokeShare(share.share_id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {share.recent_users.length > 0 && (
                    <div className="space-y-2">
                      {share.recent_users.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{user.identifier}</p>
                            <p className="text-xs text-gray-500">
                              {user.messages_sent} msgs • {user.credits_used} credits
                            </p>
                          </div>
                          <button
                            onClick={() => handleBanUser(share.share_id, user.identifier)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No shares yet</p>
          )}
        </div>
      </div>
    </div>
  );
}