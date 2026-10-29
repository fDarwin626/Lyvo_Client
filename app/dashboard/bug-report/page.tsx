'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getBugReports,
  toggleBugHeart,
  BugReport,
  BugListResponse,
  isAuthenticated
} from '@/lib/api';
import { Icon } from '@iconify/react';

/**
 * Bug Reports Page
 * Public view - all logged-in users can see bugs and heart them
 * Only admins can comment/change status (Section 3 Part 2)
 */

function ArrowUpDown({ order }: { order: 'asc' | 'desc' }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${order === 'asc' ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

// Status: dot + tracked-caps label. No colored pill backgrounds.
const STATUS_META: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'text-danger' },
  in_progress: { label: 'In progress', className: 'text-accent' },
  resolved: { label: 'Resolved', className: 'text-muted' },
};

// Priority differentiated by weight + color rather than a new color per level.
const PRIORITY_META: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'text-danger font-[ArchivoBlack]' },
  high: { label: 'High', className: 'text-danger' },
  medium: { label: 'Medium', className: 'text-accent' },
  low: { label: 'Low', className: 'text-muted' },
};

export default function BugReportsPage() {
  const router = useRouter();

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalBugs, setTotalBugs] = useState(0);
  const pageSize = 20;

  const [statusFilter, setStatusFilter] = useState<'new' | 'in_progress' | 'resolved' | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'hearts_count' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin?redirect=/dashboard/bugs');
    }
  }, [router]);

  useEffect(() => {
    fetchBugs();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  const fetchBugs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: BugListResponse = await getBugReports({
        status_filter: statusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        page_size: pageSize,
      });

      setBugs(response.bugs);
      setTotalBugs(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load bug reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleHeartToggle = async (bugId: string) => {
    try {
      const result = await toggleBugHeart(bugId);

      setBugs(prevBugs =>
        prevBugs.map(bug =>
          bug.id === bugId
            ? {
                ...bug,
                hearts_count: result.hearts_count,
                user_has_hearted: result.action === 'added',
              }
            : bug
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle heart:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getReporterName = (email: string) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

  const totalPages = Math.ceil(totalBugs / pageSize);

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 px-4 sm:px-6 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="mb-10 sm:mb-14 pb-6 sm:pb-8 border-b border-default">
          <p className="font-[ArchivoBlack] text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted mb-3">
            Feedback
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-amiamie text-3xl sm:text-4xl lg:text-5xl text-primary">
              Bug reports
            </h1>
            <button
              onClick={() => router.push('/dashboard/bug-report/submit')}
              className="px-5 py-2.5 bg-invert text-invert text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Report a bug
            </button>
          </div>
          <p className="text-secondary text-sm mt-3 max-w-lg">
            Found or noticed a bug on the page? Report it here so it can get fixed.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-background border border-default text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-background border border-default text-primary focus:outline-none focus:border-accent"
          >
            <option value="created_at">Newest first</option>
            <option value="hearts_count">Most hearts</option>
            <option value="updated_at">Recently updated</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-default text-secondary hover:text-primary transition-colors flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <ArrowUpDown order={sortOrder} />
            {sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 border-t border-default text-center">
            <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-3">
              Loading
            </p>
            <div className="h-[2px] w-32 bg-border mx-auto relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-accent animate-pulse" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pt-4 pb-6 mb-6 border-t border-danger">
            <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-danger mb-1">
              Error
            </p>
            <p className="text-sm text-secondary mb-2">{error}</p>
            <button
              onClick={fetchBugs}
              className="text-sm text-primary underline decoration-border underline-offset-4 hover:text-accent"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && bugs.length === 0 && (
          <div className="py-16 border-t border-default text-center">
            <p className="text-primary text-base mb-1">No bugs found</p>
            <p className="text-muted text-sm">
              {statusFilter ? 'Try changing the filter.' : 'Be the first to report one.'}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && bugs.length > 0 && (
          <div className="border-t border-default">
            {bugs.map((bug) => {
              const status = STATUS_META[bug.status] || { label: bug.status, className: 'text-muted' };
              const priority = PRIORITY_META[bug.priority] || { label: bug.priority, className: 'text-muted' };

              return (
                <div
                  key={bug.id}
                  className="border-b border-default py-6 cursor-pointer group"
                  onClick={() => router.push(`/dashboard/bug-report/${bug.id}`)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-base font-medium text-primary group-hover:text-accent transition-colors">
                          {bug.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 font-[ArchivoBlack] text-[10px] tracking-[0.1em] uppercase ${status.className}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {status.label}
                        </span>
                        <span className={`font-[ArchivoBlack] text-[10px] tracking-[0.1em] uppercase ${priority.className}`}>
                          {priority.label}
                        </span>
                      </div>

                      <p className="text-secondary text-sm mb-3">
                        {truncate(bug.description, 150)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span>Reported by {getReporterName(bug.user_email)}</span>
                        <span>·</span>
                        <span>{formatDate(bug.created_at)}</span>
                        {bug.comments_count > 0 && (
                          <>
                            <span>·</span>
                            <span>{bug.comments_count} {bug.comments_count === 1 ? 'reply' : 'replies'}</span>
                          </>
                        )}
                        {bug.browser && (
                          <>
                            <span>·</span>
                            <span>{bug.browser}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Heart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHeartToggle(bug.id);
                      }}
                      className="flex flex-col items-center gap-1 flex-shrink-0 pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
                    >
                      {bug.user_has_hearted ? (
                        <Icon icon="pixel:heart-solid" width="20" height="20" className="text-danger" />
                      ) : (
                        <Icon icon="pixelarticons:heart" width="20" height="20" className="text-muted" />
                      )}
                      <span className="text-xs text-muted">{bug.hearts_count}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalBugs > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-6 text-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-secondary hover:text-primary disabled:text-muted disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="text-secondary hover:text-primary disabled:text-muted disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}