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
import { useCreditBalance } from '@/app/contexts/CreditContext';

/**
 * 🐛 Bug Reports Page
 * Public view - all logged-in users can see bugs and heart them
 * Only admins can comment/change status (we'll add that in Section 3 Part 2)
 */
export default function BugReportsPage() {
  const router = useRouter();
  
  // State management
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const { userName, isLoading} = useCreditBalance();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBugs, setTotalBugs] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'new' | 'in_progress' | 'resolved' | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'hearts_count' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin?redirect=/dashboard/bugs');
    }
  }, [router]);
  
  // Fetch bugs
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
      setError(err.message || 'Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle heart toggle
  const handleHeartToggle = async (bugId: string) => {
    try {
      const result = await toggleBugHeart(bugId);
      
      // Update UI optimistically
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
  
  // Truncate text
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="min-h-screen py3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex flex-row gap-2 border-b border-default">
            <Icon icon="marketeq:bug" width="30" height="30" className="color: #828282" /> Bug Reports
          </h1>
          <p className="text-gray-600/45 text-xl lg:text-xl">
            Found or noticed a bug on our page? Report it here so we can fix it!
          </p>
        </div>
        
        {/* Actions Bar */}
        <div className=" p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 font-amiamie">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
               focus:ring-blue-500/50 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            
            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
               focus:ring-blue-500/50 focus:border-transparent"
            >
              <option value="created_at">Newest First</option>
              <option value="hearts_count">Most Hearts</option>
              <option value="updated_at">Recently Updated</option>
            </select>
            
            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
          
          {/* Submit Bug Button */}
          <button
            onClick={() => router.push('/dashboard/bug-report/submit')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-white hover:text-black
             transition font-medium"
          >
            + Report Bug
          </button>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bug reports...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchBugs}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Bug List */}
        {!loading && bugs.length === 0 && (
          <div className="text-center py-12 bg-gray-100 rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No bugs found</p>
            <p className="text-gray-500 mt-2">
              {statusFilter ? 'Try changing the filter' : 'Be the first to report a bug!'}
            </p>
          </div>
        )}
        
        {!loading && bugs.length > 0 && (
          <div className="space-y-2">
            {bugs.map((bug) => (
              <div
                key={bug.id}
                className="bg-gray-100 rounded-lg p-6 cursor-pointer"
                onClick={() => router.push(`/dashboard/bug-report/${bug.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Title & Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bug.title}
                      </h3>
                      
                      {/* Status Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          bug.status
                        )}`}
                      >
                        {bug.status.replace('_', ' ')}
                      </span>
                      
                      {/* Priority Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                          bug.priority
                        )}`}
                      >
                        {bug.priority}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-3">
                      {truncate(bug.description, 150)}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Reported by {isLoading ? 'Loading...' : userName}</span>
                      <span>•</span>
                      <span>{formatDate(bug.created_at)}</span>
                      {bug.comments_count > 0 && (
                        <>
                          <span>•</span>
                          <span>💬 {bug.comments_count} replies</span>
                        </>
                      )}
                      {bug.browser && (
                        <>
                          <span>•</span>
                          <span>{bug.browser}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Heart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleHeartToggle(bug.id);
                    }}
                  >
                    <span className="text-2xl">
                      {bug.user_has_hearted ? <Icon icon="pixel:heart-solid" width="24" height="24"
                        className="text-[#ca0600]" />:
                       <Icon icon="pixelarticons:heart" width="24" height="24"  className="text-gray-400" />}
                    </span>
                    <span className="text-sm font-medium">
                      {bug.hearts_count}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalBugs > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>
            
            <span className="text-gray-600">
              Page {currentPage} of {Math.ceil(totalBugs / pageSize)}
            </span>
            
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(Math.ceil(totalBugs / pageSize), p + 1))
              }
              disabled={currentPage >= Math.ceil(totalBugs / pageSize)}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}