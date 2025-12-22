'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  adminGetTicketDetails,
  adminReplyToTicket,
  adminUpdateTicketStatus,
  SupportTicket,
  TicketMessage,
  TicketWithMessages,
} from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

/**
 * 🎫 Admin Ticket Details Page
 * View ticket details, conversation, and respond to users
 */
export default function AdminTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;
  
  // ========== SECTION 1: STATE MANAGEMENT ==========
  const [ticketData, setTicketData] = useState<TicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('open');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Fetch ticket details
  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);
  
  const fetchTicketDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminGetTicketDetails(ticketId);
      setTicketData(data);
      setNewStatus(data.ticket.status);
      setNewPriority(data.ticket.priority);
      setAdminNotes(data.ticket.admin_notes || '');
    } catch (err: any) {
      if (err.statusCode === 403) {
        router.push('/admin');
      } else {
        setError(err.message || 'Failed to load ticket details');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ========== HELPER FUNCTIONS ==========
  
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
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // ========== ACTION HANDLERS ==========
  
  // Send reply to ticket
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;
    
    setSendingReply(true);
    
    try {
      await adminReplyToTicket(ticketId, replyText.trim());
      setReplyText('');
      await fetchTicketDetails(); // Refresh to show new message
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };
  
  // Update ticket status
  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    
    try {
      await adminUpdateTicketStatus(
        ticketId,
        newStatus,
        newPriority,
        adminNotes.trim() || undefined
      );
      setShowStatusModal(false);
      await fetchTicketDetails(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Loading ticket details...</p>
        </div>
      </div>
    );
  }
  
  // ========== ERROR STATE ==========
  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-[#0a0e27] p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <p className="text-red-400">{error || 'Ticket not found'}</p>
          <Link
            href="/admin/tickets"
            className="mt-4 inline-block text-red-300 hover:text-red-200"
          >
            ← Back to Ticket List
          </Link>
        </div>
      </div>
    );
  }
  
  const { ticket, messages } = ticketData;
  
  // ========== SECTION 2: HEADER ==========
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header */}
      <div className="bg-[#0d1230] border-b border-gray-800/50 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tickets"
              className="text-gray-400 hover:text-white transition"
            >
              <Icon icon="mdi:arrow-left" width="24" />
            </Link>
            <div>
              <h1 className="text-white text-xl font-semibold font-amiamie">
                Ticket #{ticketId.substring(0, 8)}
              </h1>
              <p className="text-gray-400 text-sm">
                Reported by {ticket.user_email}
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
            
            {ticket.status !== 'closed' && (
              <button
                onClick={async () => {
                  if (confirm('Close this ticket?')) {
                    try {
                      await adminUpdateTicketStatus(ticketId, 'closed');
                      await fetchTicketDetails();
                    } catch (err: any) {
                      alert(err.message || 'Failed to close ticket');
                    }
                  }
                }}
                className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-600/30 transition font-amiamie"
              >
                <Icon icon="mdi:close-circle" width="16" className="inline mr-2" />
                Close Ticket
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-8 max-w-6xl mx-auto">
        {/* ========== SECTION 3: TICKET DETAILS CARD ========== */}
        <div className="bg-[#0d1230] rounded-xl p-6 mb-6 border border-gray-800/50">
          {/* Status, Priority & Category Badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                ticket.status
              )}`}
            >
              {ticket.status.replace('_', ' ')}
            </span>
            
            <span
              className={`px-3 py-1 text-sm font-semibold rounded ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
              <Icon icon={getCategoryIcon(ticket.category)} width="16" />
              <span className="text-sm font-medium">{ticket.category.replace('_', ' ')}</span>
            </div>
          </div>
          
          {/* Subject */}
          <h2 className="text-2xl font-bold text-white mb-4 font-amiamie">
            {ticket.subject}
          </h2>
          
          {/* Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
          
          {/* Screenshot */}
          {ticket.screenshot_url && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-400 mb-3">Screenshot:</p>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/uploads/${ticket.screenshot_url}`}
                alt="Ticket screenshot"
                className="max-w-full h-auto rounded-lg border border-gray-700"
              />
            </div>
          )}
          
          {/* Metadata */}
          <div className="bg-[#1a1f3a] rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-300 mb-3">
              Ticket Information:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock" width="16" />
                <span><strong className="text-gray-300">Created:</strong> {formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:update" width="16" />
                <span><strong className="text-gray-300">Updated:</strong> {formatDate(ticket.updated_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center gap-2 col-span-2">
                  <Icon icon="mdi:check-circle" width="16" className="text-green-400" />
                  <span><strong className="text-gray-300">Resolved:</strong> {formatDate(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.admin_notes && (
                <div className="col-span-2">
                  <p className="text-gray-300 font-medium mb-1">Admin Notes:</p>
                  <p className="text-gray-400 italic">{ticket.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ========== SECTION 4: CONVERSATION THREAD ========== */}
        <div className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-xl font-bold text-white mb-4 font-amiamie">
            💬 Conversation ({messages.length})
          </h3>
          
          {/* Empty State */}
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="mdi:message-outline" width="48" className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-500">No messages yet. Be the first to respond!</p>
            </div>
          ) : (
            /* Message List */
            <div className="space-y-4 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-4 ${
                    message.is_admin
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : 'bg-[#1a1f3a] border border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      icon={message.is_admin ? 'mdi:shield-account' : 'mdi:account'}
                      width="20"
                      className={message.is_admin ? 'text-purple-400' : 'text-blue-400'}
                    />
                    <span
                      className={`text-sm font-medium ${
                        message.is_admin ? 'text-purple-300' : 'text-blue-300'
                      }`}
                    >
                      {message.sender_email}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {formatDate(message.created_at)}
                    </span>
                    {message.is_admin && (
                      <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* ========== SECTION 5: REPLY FORM ========== */}
          {ticket.status !== 'closed' && (
            <form onSubmit={handleSendReply} className="border-t border-gray-700 pt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2 font-amiamie">
                Reply to User
              </label>
              
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here... (User will receive this via email)"
                rows={5}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-3"
                disabled={sendingReply}
              />
              
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-amiamie flex items-center gap-2"
                >
                  {sendingReply ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:send" width="18" />
                      Send Reply
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setReplyText('')}
                  disabled={sendingReply || !replyText}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-amiamie"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
          
          {ticket.status === 'closed' && (
            <div className="border-t border-gray-700 pt-6">
              <div className="bg-gray-700/20 border border-gray-600/30 rounded-lg p-4 text-center">
                <Icon icon="mdi:lock" width="24" className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">
                  This ticket is closed. Reopen it to reply.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ========== SECTION 6: STATUS UPDATE MODAL ========== */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1230] rounded-xl p-6 border border-gray-800/50 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 font-amiamie">
              Update Ticket Status
            </h3>
            
            <div className="space-y-4">
              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              {/* Priority Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Notes (Internal Only)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this ticket..."
                  rows={3}
                  className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-amiamie flex items-center justify-center gap-2"
              >
                {updatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" width="18" />
                    Update
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus(ticket.status);
                  setNewPriority(ticket.priority);
                  setAdminNotes(ticket.admin_notes || '');
                }}
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