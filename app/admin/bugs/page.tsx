'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getBugReports,
  BugListResponse,
  BugReport,
} from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

/**
 * 🐛 Admin Bug List Page
 * Shows all bug reports in card layout
 * Admin can filter, sort, and click to view details
 */
export default function AdminBugListPage() {
  const router = useRouter();
  
  // State
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'new' | 'in_progress' | 'resolved' | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'hearts_count' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBugs, setTotalBugs] = useState(0);
  const pageSize = 12;
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    resolved: 0,
  });
  
  // Fetch bugs
  useEffect(() => {
    fetchBugs();
  }, [statusFilter, priorityFilter, sortBy, sortOrder, currentPage]);
  
  const fetchBugs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: BugListResponse = await getBugReports({
        status_filter: statusFilter as any,
        priority_filter: priorityFilter as any,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        page_size: pageSize,
      });
      
      setBugs(response.bugs);
      setTotalBugs(response.total);
      
      // Calculate stats (only on first load)
      if (currentPage === 1 && !statusFilter) {
        calculateStats(response.bugs);
      }
    } catch (err: any) {
      if (err.statusCode === 403) {
        router.push('/admin');
      } else {
        setError(err.message || 'Failed to load bugs');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics
  const calculateStats = (bugList: BugReport[]) => {
    const newCount = bugList.filter(b => b.status === 'new').length;
    const inProgressCount = bugList.filter(b => b.status === 'in_progress').length;
    const resolvedCount = bugList.filter(b => b.status === 'resolved').length;
    
    setStats({
      total: bugList.length,
      new: newCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
    });
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };
  
  // Total pages
  const totalPages = Math.ceil(totalBugs / pageSize);
  
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header */}
      <div className="bg-[#0d1230] border-b border-gray-800/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold font-amiamie">
              🐛 Bug Reports
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage and track all reported bugs
            </p>
          </div>
          
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition font-amiamie"
          >
            <Icon icon="mdi:arrow-left" width="20" className="inline mr-2" />
            Back to Admin
          </Link>
        </div>
      </div>
      
      <div className="p-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-amiamie">Total Bugs</p>
                <p className="text-white text-3xl font-bold mt-1">{totalBugs}</p>
              </div>
              <Icon icon="mdi:bug" width="40" className="text-gray-600" />
            </div>
          </div>
          
          <div className="bg-[#0d1230] rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-amiamie">New</p>
                <p className="text-white text-3xl font-bold mt-1">{stats.new}</p>
              </div>
              <Icon icon="mdi:alert-circle" width="40" className="text-red-500" />
            </div>
          </div>
          
          <div className="bg-[#0d1230] rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-amiamie">In Progress</p>
                <p className="text-white text-3xl font-bold mt-1">{stats.in_progress}</p>
              </div>
              <Icon icon="mdi:progress-clock" width="40" className="text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-[#0d1230] rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-amiamie">Resolved</p>
                <p className="text-white text-3xl font-bold mt-1">{stats.resolved}</p>
              </div>
              <Icon icon="mdi:check-circle" width="40" className="text-green-500" />
            </div>
          </div>
        </div>
        
        {/* Filters & Sort */}
        <div className="bg-[#0d1230] rounded-xl p-4 mb-6 border border-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="hearts_count">Hearts Count</option>
              </select>
            </div>
            
            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-400">Loading bugs...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <Icon icon="mdi:alert-circle" width="48" className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchBugs}
              className="mt-4 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Bug Cards */}
        {!loading && !error && (
          <>
            {bugs.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="mdi:bug-outline" width="64" className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No bugs found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bugs.map((bug) => (
                  <Link
                    key={bug.id}
                    href={`/admin/bugs/${bug.id}`}
                    className="bg-[#0d1230] rounded-xl p-5 border border-gray-800/50 hover:border-purple-500/50 transition group cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            bug.status
                          )}`}
                        >
                          {bug.status.replace('_', ' ')}
                        </span>
                        
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                            bug.priority
                          )}`}
                        >
                          {bug.priority}
                        </span>
                      </div>
                      
                      {/* Hearts (Read Only) */}
                      <div className="flex items-center gap-1 text-red-400">
                        <Icon icon="mdi:heart" width="18" />
                        <span className="text-sm font-medium">{bug.hearts_count}</span>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                      {bug.title}
                    </h3>
                    
                    {/* Description Preview */}
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {bug.description}
                    </p>
                    
                    {/* Screenshot Indicator */}
                    {bug.screenshot_url && (
                      <div className="flex items-center gap-2 text-purple-400 text-xs mb-3">
                        <Icon icon="mdi:image" width="16" />
                        <span>Has screenshot</span>
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Icon icon="mdi:comment" width="16" />
                          <span>{bug.comments_count}</span>
                        </div>
                        
                        <span className="text-gray-600">•</span>
                        
                        <span>{formatDate(bug.created_at)}</span>
                      </div>
                      
                      <Icon
                        icon="mdi:chevron-right"
                        width="20"
                        className="text-gray-600 group-hover:text-purple-500 transition"
                      />
                    </div>
                    
                    {/* Reporter */}
                    <div className="text-xs text-gray-600 mt-2">
                      by {bug.user_email}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#0d1230] text-gray-300 rounded-lg border border-gray-800 hover:bg-[#1a1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Icon icon="mdi:chevron-left" width="20" />
                </button>
                
                <span className="text-gray-400 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#0d1230] text-gray-300 rounded-lg border border-gray-800 hover:bg-[#1a1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Icon icon="mdi:chevron-right" width="20" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}