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
 * Bug Details Page
 * Shows full bug report with admin comments
 * Users can heart the bug
 * Admins can comment and update status
 */

function ArrowLeft() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" />
    </svg>
  );
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'text-danger' },
  in_progress: { label: 'In progress', className: 'text-accent' },
  resolved: { label: 'Resolved', className: 'text-muted' },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'text-danger font-[ArchivoBlack]' },
  high: { label: 'High', className: 'text-danger' },
  medium: { label: 'Medium', className: 'text-accent' },
  low: { label: 'Low', className: 'text-muted' },
};

const STATUS_OPTIONS: Array<'new' | 'in_progress' | 'resolved'> = ['new', 'in_progress', 'resolved'];

export default function BugDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bugId = params.bugId as string;
  const { userName, isLoading } = useCreditBalance();

  const [bugData, setBugData] = useState<BugDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin?redirect=/dashboard/bugs');
    } else {
      checkAdminStatus();
      fetchBugDetails();
    }
  }, [bugId, router]);

  const checkAdminStatus = async () => {
    try {
      const profile = await getUserProfile();
      setIsAdmin((profile as any).is_admin || false);
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };

  const fetchBugDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBugDetails(bugId);
      setBugData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bug details.');
    } finally {
      setLoading(false);
    }
  };

  const handleHeartToggle = async () => {
    if (!bugData) return;

    try {
      const result = await toggleBugHeart(bugId);

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    setAddingComment(true);

    try {
      await addBugComment(bugId, commentText.trim());
      setCommentText('');
      await fetchBugDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setAddingComment(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'new' | 'in_progress' | 'resolved') => {
    if (!bugData) return;

    setUpdatingStatus(true);

    try {
      await updateBugStatus(bugId, newStatus);
      await fetchBugDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getReporterName = (email: string) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-3">
            Loading
          </p>
          <div className="h-[2px] w-32 bg-border mx-auto relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-accent animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bugData) {
    return (
      <div className="min-h-screen bg-background pt-16 sm:pt-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto pt-4 pb-6 border-t border-danger">
          <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-danger mb-1">
            Error
          </p>
          <p className="text-sm text-secondary mb-4">{error || 'Bug not found.'}</p>
          <button
            onClick={() => router.push('/dashboard/bugs')}
            className="inline-flex items-center gap-2 text-sm text-primary underline decoration-border underline-offset-4 hover:text-accent"
          >
            <ArrowLeft />
            Back to bug list
          </button>
        </div>
      </div>
    );
  }

  const { bug, comments } = bugData;
  const status = STATUS_META[bug.status] || { label: bug.status, className: 'text-muted' };
  const priority = PRIORITY_META[bug.priority] || { label: bug.priority, className: 'text-muted' };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 px-4 sm:px-6 pb-16 sm:pb-24">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => router.push('/dashboard/bug-report')}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
        >
          <ArrowLeft />
          Back to bug list
        </button>

        {/* Header */}
        <header className="pb-8 border-b border-default mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 font-[ArchivoBlack] text-[10px] tracking-[0.1em] uppercase ${status.className}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status.label}
            </span>
            <span className={`font-[ArchivoBlack] text-[10px] tracking-[0.1em] uppercase ${priority.className}`}>
              {priority.label}
            </span>
          </div>

          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-amiamie text-2xl sm:text-3xl lg:text-4xl text-primary mb-3">
                {bug.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>Reported by {getReporterName(bug.user_email)}</span>
                <span>·</span>
                <span>{formatDate(bug.created_at)}</span>
                {bug.updated_at !== bug.created_at && (
                  <>
                    <span>·</span>
                    <span>Updated {formatDate(bug.updated_at)}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleHeartToggle}
              className="flex flex-col items-center gap-1 flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
            >
              {bug.user_has_hearted ? (
                <Icon icon="pixel:heart-solid" width="22" height="22" className="text-danger" />
              ) : (
                <Icon icon="pixelarticons:heart" width="22" height="22" className="text-muted" />
              )}
              <span className="text-xs text-muted">
                {bug.hearts_count} {bug.hearts_count === 1 ? 'heart' : 'hearts'}
              </span>
            </button>
          </div>
        </header>

        {/* Description */}
        <div className="mb-8 pb-8 border-b border-default">
          <p className="text-primary text-sm leading-relaxed whitespace-pre-wrap">{bug.description}</p>
        </div>

        {/* Screenshot */}
        {bug.screenshot_url && (
          <div className="mb-8 pb-8 border-b border-default">
            <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
              Screenshot
            </p>
            <img
              src={getBugScreenshotUrl(bug.screenshot_url)}
              alt="Bug screenshot"
              className="max-w-full h-auto border border-default"
            />
          </div>
        )}

        {/* Technical info */}
        <div className="mb-8 pb-8 border-b border-default">
          <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
            Technical information
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {bug.browser && (
              <div>
                <p className="text-muted text-xs mb-0.5">Browser</p>
                <p className="text-primary">{bug.browser}</p>
              </div>
            )}
            {bug.os && (
              <div>
                <p className="text-muted text-xs mb-0.5">OS</p>
                <p className="text-primary">{bug.os}</p>
              </div>
            )}
            {bug.device_type && (
              <div>
                <p className="text-muted text-xs mb-0.5">Device</p>
                <p className="text-primary">{bug.device_type}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="mb-8 pb-8 border-b border-default">
            <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
              Admin controls
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isCurrent = bug.status === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleStatusUpdate(option)}
                    disabled={updatingStatus || isCurrent}
                    className={`px-4 py-2 text-sm font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                      isCurrent
                        ? 'bg-invert text-invert border-transparent cursor-not-allowed'
                        : 'border-default text-secondary hover:text-primary hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {STATUS_META[option].label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted mb-5">
            Admin replies ({comments.length})
          </p>

          {comments.length === 0 ? (
            <p className="text-muted text-sm mb-8">No admin replies yet.</p>
          ) : (
            <div className="mb-8 space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="pl-4 border-l-2 border-accent">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-primary">
                      {comment.admin_email}
                    </span>
                    <span className="text-xs text-muted">
                      · {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-secondary text-sm whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment (admin only) */}
          {isAdmin && (
            <form onSubmit={handleAddComment} className="pt-6 border-t border-default">
              <label className="block font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-3">
                Add admin reply
              </label>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your reply here…"
                rows={4}
                disabled={addingComment}
                className="w-full bg-transparent text-primary placeholder:text-muted text-sm leading-relaxed resize-none focus:outline-none border-b border-default pb-4 mb-4"
              />

              <button
                type="submit"
                disabled={addingComment || !commentText.trim()}
                className="px-5 py-2.5 bg-invert text-invert text-sm font-medium hover:opacity-90 transition-opacity disabled:bg-border disabled:text-muted disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {addingComment ? 'Posting…' : 'Post reply'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}