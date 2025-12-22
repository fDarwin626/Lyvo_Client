'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getBugDetails,
  toggleBugHeart,
  addBugComment,
  updateBugStatus,
  BugDetailsResponse,
  getUserProfile,
  getBugScreenshotUrl,
  isAuthenticated,
} from '@/lib/api';
import { useCreditBalance } from '@/app/contexts/CreditContext';
import { Icon } from '@iconify/react';

/**
 * 🔍 Bug Details Page
 * Shows full bug report with admin comments
 * Users can heart the bug
 * Admins can comment and update status
 */
export default function BugDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bugId = params.bugId as string;
    const { userName, isLoading} = useCreditBalance();

  // State
  const [bugData, setBugData] = useState<BugDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin?redirect=/dashboard/bugs');
    } else {
      checkAdminStatus();
      fetchBugDetails();
    }
  }, [bugId, router]);
  
  // Check if user is admin
  const checkAdminStatus = async () => {
    try {
      const profile = await getUserProfile();
      // Assuming your User model has is_admin field
      // You may need to add this to UserProfile interface
      setIsAdmin((profile as any).is_admin || false);
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };
  
  // Fetch bug details
  const fetchBugDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getBugDetails(bugId);
      setBugData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bug details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle heart toggle
  const handleHeartToggle = async () => {
    if (!bugData) return;
    
    try {
      const result = await toggleBugHeart(bugId);
      
      // Update local state
      setBugData({
        ...bugData,
        bug: {
          ...bugData.bug,
          hearts_count: result.hearts_count,
          user_has_hearted: result.action === 'added',
        },
      });
    } catch (err: any) {
      console.error('Failed to toggle heart:', err);
    }
  };
  
  // Handle add comment (admin only)
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
  
  // Handle status update (admin only)
  const handleStatusUpdate = async (newStatus: 'new' | 'in_progress' | 'resolved') => {
    if (!bugData) return;
    
    setUpdatingStatus(true);
    
    try {
      await updateBugStatus(bugId, newStatus);
      await fetchBugDetails(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading bug details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !bugData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error || 'Bug not found'}</p>
            <button
              onClick={() => router.push('/dashboard/bugs')}
              className="mt-4 text-red-600 hover:text-red-800 font-medium"
            >
              ← Back to Bug List
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const { bug, comments } = bugData;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/bug-report')}
          className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-2"
        >
          ← Back to Bug List
        </button>
        
        {/* Bug Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Status Badge */}
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                    bug.status
                  )}`}
                >
                  {bug.status.replace('_', ' ')}
                </span>
                
                {/* Priority Badge */}
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded ${getPriorityColor(
                    bug.priority
                  )}`}
                >
                  {bug.priority}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {bug.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span>Reported by {isLoading ? 'Loading...' : userName}</span>
                <span>•</span>
                <span>{formatDate(bug.created_at)}</span>
                {bug.updated_at !== bug.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(bug.updated_at)}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Heart Button */}
            <button
              onClick={handleHeartToggle}
              className={`flex flex-col items-center gap-1 px-6 py-3 rounded-lg transition ${
                bug.user_has_hearted
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-3xl">
                {bug.user_has_hearted ? <Icon icon="pixel:heart-solid" width="24" height="24"
                  className="text-[#ca0600]" />:
                  <Icon icon="pixelarticons:heart" width="24" height="24"  className="text-gray-400" />}
              </span>
              <span className="text-sm font-medium">
                {bug.hearts_count} {bug.hearts_count === 1 ? 'heart' : 'hearts'}
              </span>
            </button>
          </div>
          
          {/* Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{bug.description}</p>
          </div>
          
          {/* Screenshot */}
          {bug.screenshot_url && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Screenshot:</p>
              <img
                src={getBugScreenshotUrl(bug.screenshot_url)}
                alt="Bug screenshot"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}
          
          {/* Technical Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Technical Information:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              {bug.browser && <div><strong>Browser:</strong> {bug.browser}</div>}
              {bug.os && <div><strong>OS:</strong> {bug.os}</div>}
              {bug.device_type && <div><strong>Device:</strong> {bug.device_type}</div>}
            </div>
          </div>
        </div>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-3">
              🔧 Admin Controls
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusUpdate('new')}
                disabled={updatingStatus || bug.status === 'new'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Mark as New
              </button>
              
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updatingStatus || bug.status === 'in_progress'}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Mark In Progress
              </button>
              
              <button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={updatingStatus || bug.status === 'resolved'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        )}
        
        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <Icon icon="pixel:comment" width="24" height="24"  className="text-gray-200" /> Admin Replies ({comments.length})
          </h2>
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No admin replies yet
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      👤 {comment.admin_email}
                    </span>
                    <span className="text-sm text-blue-600">
                      • {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Comment Form (Admin Only) */}
          {isAdmin && (
            <form onSubmit={handleAddComment} className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Admin Reply
              </label>
              
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your reply here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                disabled={addingComment}
              />
              
              <button
                type="submit"
                disabled={addingComment || !commentText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {addingComment ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}