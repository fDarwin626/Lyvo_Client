'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminGetTickets, SupportTicket, TicketListResponse } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

/**
 * 🎫 Admin Ticket Management Page
 * View and manage all support tickets
 */
export default function AdminTicketsPage() {
  const router = useRouter();
  
  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Fetch tickets
  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter, categoryFilter, priorityFilter]);
  
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: TicketListResponse = await adminGetTickets({
        status_filter: statusFilter || undefined,
        category_filter: categoryFilter || undefined,
        priority_filter: priorityFilter || undefined,
        page: currentPage,
        page_size: pageSize,
      });
      
      setTickets(response.tickets);
      setTotalTickets(response.total);
    } catch (err: any) {
      if (err.statusCode === 403) {
        router.push('/admin');
      } else {
        setError(err.message || 'Failed to load tickets');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
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
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return 'mdi:cash';
      case 'credits':
        return 'mdi:coin';
      case 'voice_cloning':
        return 'mdi:microphone';
      case 'agents':
        return 'mdi:robot';
      case 'technical':
        return 'mdi:tools';
      case 'feature':
        return 'mdi:lightbulb';
      default:
        return 'mdi:help-circle';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-[#0a0e27] p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white transition"
          >
            <Icon icon="mdi:arrow-left" width="24" />
          </Link>
          <h1 className="text-white text-3xl font-bold font-amiamie">
            🎫 Support Tickets
          </h1>
        </div>
        <p className="text-gray-400 ml-9">
          View and respond to user support requests
        </p>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-4 ml-9">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:information" width="20" className="text-purple-400" />
            <span className="text-purple-300 font-medium">
              {totalTickets}
            </span>
            <span className="text-gray-400">Total Tickets</span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-[#0d1230] rounded-xl p-6 mb-6 border border-gray-800/50">
        <div className="grid grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              <option value="payment">Payment</option>
              <option value="credits">Credits</option>
              <option value="voice_cloning">Voice Cloning</option>
              <option value="agents">Agents</option>
              <option value="technical">Technical</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          {/* Refresh */}
          <div className="flex items-end">
            <button
              onClick={fetchTickets}
              className="w-full px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 transition font-amiamie flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:refresh" width="20" />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Loading tickets...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <Icon icon="mdi:alert-circle" width="48" className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {/* Ticket List */}
      {!loading && tickets.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="mdi:ticket-outline" width="64" className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No tickets found</h3>
          <p className="text-gray-400">
            {statusFilter || categoryFilter || priorityFilter
              ? 'Try changing the filters'
              : 'All caught up!'}
          </p>
        </div>
      )}
      
      {!loading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
              className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50 hover:bg-[#1a1f3a] transition cursor-pointer"
            >
              {/* Main Content */}
              <div className="space-y-3">
                {/* Title & Badges */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-white text-lg font-semibold flex-1">
                    {ticket.subject}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    
                    {/* Priority Badge */}
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                    
                    {/* Category Badge */}
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                      <Icon icon={getCategoryIcon(ticket.category)} width="16" />
                      <span className="text-sm">{ticket.category}</span>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-gray-400 line-clamp-2">
                  {ticket.description}
                </p>
                
                {/* Meta Info */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:account" width="16" />
                    <span>{ticket.user_email}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(ticket.user_email);
                      }}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition"
                    >
                      <Icon icon="mdi:content-copy" width="14" />
                      Copy Email
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:clock" width="16" />
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                  
                  {ticket.resolved_at && (
                    <div className="flex items-center gap-2 text-green-400">
                      <Icon icon="mdi:check-circle" width="16" />
                      <span>Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalTickets > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#0d1230] border border-gray-800/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1f3a] transition text-gray-300"
          >
            Previous
          </button>
          
          <span className="text-gray-400">
            Page {currentPage} of {Math.ceil(totalTickets / pageSize)}
          </span>
          
          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(Math.ceil(totalTickets / pageSize), p + 1)
              )
            }
            disabled={currentPage >= Math.ceil(totalTickets / pageSize)}
            className="px-4 py-2 bg-[#0d1230] border border-gray-800/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1f3a] transition text-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}