'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getBugDetails,
  addBugComment,
  updateBugStatus,
  archiveBug,
  getBugScreenshotUrl,
  BugDetailsResponse,
} from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

/**
 * 🐛 Admin Bug Details Page
 * View bug details, add comments, change status
 */
export default function AdminBugDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bugId = params.bugId as string;
  
  // State
  const [bugData, setBugData] = useState<BugDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'new' | 'in_progress' | 'resolved'>('new');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  // Fetch bug details
  useEffect(() => {
    fetchBugDetails();
  }, [bugId]);
  
  const fetchBugDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getBugDetails(bugId);
      setBugData(data);
      setNewStatus(data.bug.status as any);
      setNewPriority(data.bug.priority as any);
    } catch (err: any) {
      if (err.statusCode === 403) {
        router.push('/admin');
      } else {
        setError(err.message || 'Failed to load bug details');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setAddingComment(true);
    
    try {
      await addBugComment(bugId, commentText.trim());
      setCommentText('');
      await fetchBugDetails(); // Refresh to show new comment
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };
  
  // Update status
  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    
    try {
      await updateBugStatus(bugId, newStatus, newPriority);
      setShowStatusModal(false);
      await fetchBugDetails(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Failed to update bug');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Archive bug
  const handleArchive = async () => {
    if (!confirm('Archive this bug? It will be hidden from users.')) return;
    
    try {
      await archiveBug(bugId);
      router.push('/admin/bugs');
    } catch (err: any) {
      alert(err.message || 'Failed to archive bug');
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Loading bug details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !bugData) {
    return (
      <div className="min-h-screen bg-[#0a0e27] p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <p className="text-red-400">{error || 'Bug not found'}</p>
          <Link
            href="/admin/bugs"
            className="mt-4 inline-block text-red-300 hover:text-red-200"
          >
            ← Back to Bug List
          </Link>
        </div>
      </div>
    );
  }
  
  const { bug, comments } = bugData;
  
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header */}
      <div className="bg-[#0d1230] border-b border-gray-800/50 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/bugs"
              className="text-gray-400 hover:text-white transition"
            >
              <Icon icon="mdi:arrow-left" width="24" />
            </Link>
            <div>
              <h1 className="text-white text-xl font-semibold font-amiamie">
                Bug #{bugId.substring(0, 8)}
              </h1>
              <p className="text-gray-400 text-sm">
                Reported by {bug.user_email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 transition font-amiamie"
            >
              <Icon icon="mdi:pencil" width="16" className="inline mr-2" />
              Update Status
            </button>
            
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-600/30 transition font-amiamie"
            >
              <Icon icon="mdi:archive" width="16" className="inline mr-2" />
              Archive
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-8 max-w-6xl mx-auto">
        {/* Bug Card */}
        <div className="bg-[#0d1230] rounded-xl p-6 mb-6 border border-gray-800/50">
          {/* Status & Priority */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                bug.status
              )}`}
            >
              {bug.status.replace('_', ' ')}
            </span>
            
            <span
              className={`px-3 py-1 text-sm font-semibold rounded ${getPriorityColor(
                bug.priority
              )}`}
            >
              {bug.priority}
            </span>
            
            <div className="flex items-center gap-1 text-gray-400 ml-auto">
              <Icon icon="mdi:heart" width="20" className="text-red-400" />
              <span>{bug.hearts_count}</span>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            {bug.title}
          </h2>
          
          {/* Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-300 whitespace-pre-wrap">{bug.description}</p>
          </div>
          
          {/* Screenshot */}
          {bug.screenshot_url && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-400 mb-3">Screenshot:</p>
              <img
                src={getBugScreenshotUrl(bug.screenshot_url)}
                alt="Bug screenshot"
                className="max-w-full h-auto rounded-lg border border-gray-700"
              />
            </div>
          )}
          
          {/* Technical Info */}
          <div className="bg-[#1a1f3a] rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-300 mb-3">
              Technical Information:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
              {bug.browser && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:web" width="16" />
                  <span><strong className="text-gray-300">Browser:</strong> {bug.browser}</span>
                </div>
              )}
              {bug.os && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:laptop" width="16" />
                  <span><strong className="text-gray-300">OS:</strong> {bug.os}</span>
                </div>
              )}
              {bug.device_type && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:devices" width="16" />
                  <span><strong className="text-gray-300">Device:</strong> {bug.device_type}</span>
                </div>
              )}
              {bug.page_url && (
                <div className="flex items-center gap-2 col-span-2">
                  <Icon icon="mdi:link" width="16" />
                  <span><strong className="text-gray-300">Page:</strong> {bug.page_url}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock" width="16" />
                <span><strong className="text-gray-300">Reported:</strong> {formatDate(bug.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:update" width="16" />
                <span><strong className="text-gray-300">Updated:</strong> {formatDate(bug.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-xl font-bold text-white mb-4 font-amiamie">
            💬 Admin Replies ({comments.length})
          </h3>
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No replies yet. Be the first to respond!
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:shield-account" width="20" className="text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">
                      {comment.admin_email}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 font-amiamie">
              Add Admin Reply
            </label>
            
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your reply here..."
              rows={4}
              className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-3"
              disabled={addingComment}
            />
            
            <button
              type="submit"
              disabled={addingComment || !commentText.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-amiamie"
            >
              {addingComment ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 font-amiamie">
              Update Bug Status
            </h3>
            
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-amiamie"
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
              
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition font-amiamie"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}