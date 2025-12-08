'use client';

import { useState } from 'react';
import { X, Copy, Check, Lock, Users } from 'lucide-react';
import { createShareLink, CreateShareLinkRequest, ShareLinkResponse } from '@/lib/api';

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

export default function CreateShareModal({
  isOpen,
  onClose,
  agentId,
  agentName
}: CreateShareModalProps) {
  // State
  const [shareType, setShareType] = useState<'password' | 'account_required'>('password');
  const [password, setPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(3);
  const [expiresInDays, setExpiresInDays] = useState(3);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<ShareLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOwner, setCopiedOwner] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    // Validation
    if (shareType === 'password' && !password) {
      alert('Password is required for password-protected shares');
      return;
    }

    if (shareType === 'password' && password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setIsCreating(true);

    try {
      const data: CreateShareLinkRequest = {
        share_type: shareType,
        password: shareType === 'password' ? password : undefined,
        max_users: maxUsers,
        expires_in_days: expiresInDays
      };

      const response = await createShareLink(agentId, data);
      setCreatedLink(response);
      console.log('✅ Share link created:', response);
    } catch (error: any) {
      console.error('❌ Error creating share link:', error);
      alert(error.message || 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdLink) return;

    const fullUrl = `${window.location.origin}/chat-room/${createdLink.share_token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOwnerLink = () => {
    const ownerLink = `${window.location.origin}/chat-room/${agentId}`;
    navigator.clipboard.writeText(ownerLink);
    setCopiedOwner(true);

    setTimeout(() => setCopiedOwner(false), 2000);
  };

  const handleClose = () => {
    setCreatedLink(null);
    setPassword('');
    setCopied(false);
    setCopiedOwner(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share Agent</h2>
            <p className="text-sm text-gray-500 mt-1">{agentName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* SECTION 1: OWNER'S PERSONAL LINK */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Your Personal Chat Link
                </h3>
                <p className="text-sm text-gray-600">
                  Use this link to chat with your agent anytime. Valid for 7 days.
                </p>
              </div>
            </div>
            
            {/* Owner Link Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/chat-room/${agentId}`}
                readOnly
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-sm text-blue-900 font-mono"
              />
              <button
                onClick={handleCopyOwnerLink}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {copiedOwner ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-4 h-4" />
              <span>Only you can access this link with your login credentials</span>
            </div>
          </div>

          {/* SECTION 2: SHARE WITH OTHERS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Share with Others</h3>
                <p className="text-sm text-gray-600">Create up to 3 share links for guests</p>
              </div>
            </div>

            {!createdLink ? (
              // FORM: Create Share Link
              <div className="space-y-5">
                {/* Share Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Share Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShareType('password')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        shareType === 'password'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Lock className={`w-5 h-5 mx-auto mb-2 ${
                        shareType === 'password' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900">Password</p>
                      <p className="text-xs text-gray-500 mt-1">Guest access</p>
                    </button>

                    <button
                      onClick={() => setShareType('account_required')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        shareType === 'account_required'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className={`w-5 h-5 mx-auto mb-2 ${
                        shareType === 'account_required' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900">Account</p>
                      <p className="text-xs text-gray-500 mt-1">Login required</p>
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                {shareType === 'password' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter share password (min 6 chars)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Users will need this password to access the agent
                    </p>
                  </div>
                )}

                {/* Max Users */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Users: {maxUsers}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 user</span>
                    <span>3 users max</span>
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expires in: {expiresInDays} days
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 day</span>
                    <span>30 days</span>
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateLink}
                  disabled={isCreating}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating Link...' : 'Create Share Link'}
                </button>
              </div>
            ) : (
              // SUCCESS: Show Created Link
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900 mb-1">
                    Share Link Created!
                  </h3>
                  <p className="text-sm text-green-700">
                    Share this link with up to {createdLink.max_users} users
                  </p>
                </div>

                {/* Link Display */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/chat-room/${createdLink.share_token}`}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">
                      {createdLink.shared_type === 'password' ? '🔒 Password' : '👤 Account'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-1">Max Users</p>
                    <p className="font-semibold text-gray-900">{createdLink.max_users} users</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-gray-500 mb-1">Expires</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(createdLink.expires_at).toLocaleDateString()} at{' '}
                      {new Date(createdLink.expires_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Password Display */}
                {shareType === 'password' && password && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">
                      🔑 Share Password
                    </p>
                    <p className="text-lg font-mono font-bold text-yellow-900 bg-white px-3 py-2 rounded border border-yellow-300">
                      {password}
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Users will need this password to access the agent
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 