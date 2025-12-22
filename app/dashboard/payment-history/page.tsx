"use client";
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, TrendingUp, Receipt, AlertCircle, CheckCircle, Clock, XCircle, Download, Search } from 'lucide-react';
import { getPaymentHistory, PaymentHistoryResponse, PaymentHistoryItem, APIError } from '@/lib/api';
import { Icon } from '@iconify/react';

// Types imported from api.ts

// Format currency
const formatAmount = (amount: number, currency: string): string => {
  const value = amount / 100;
  
  if (currency === 'USD') {
    return `$${value.toFixed(2)}`;
  } else if (currency === 'NGN') {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `${currency} ${value.toFixed(2)}`;
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status badge component
const StatusBadge: React.FC<{ status: 'pending' | 'completed' | 'failed' | 'cancelled' }> = ({ status }) => {
  const statusConfig: Record<'pending' | 'completed' | 'failed' | 'cancelled', { bg: string; text: string; icon: React.ElementType }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Stats card component
const StatsCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-background font-amiamie lg:p-6 ">
    <div className="flex items-center lg:gap-4 gap-2">
      <div className={`p-3 lg:rounded-lg rounded-full ${color}`}>
        <Icon className="lg:w-6 lg:h-6 h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="lg:text-2xl text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// Main component
const PaymentHistoryPage: React.FC = () => {
  const [data, setData] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  //Fetch actual payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        
        
        const result = await getPaymentHistory();
        
        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Failed to load payment history. Please try again.');
        }
        console.error('Payment history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  // Filter payments
  const filteredPayments = data?.payments.filter(payment => {
    const matchesSearch = payment.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate total spent (formatted)
  const totalSpentFormatted = data ? formatAmount(data.total_spent, data.payments[0]?.currency || 'NGN') : '---';

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ['Date', 'Transaction Ref', 'Amount', 'Currency', 'Credits', 'Status', 'Payment Method'];
    const rows = data.payments.map(p => [
      formatDate(p.created_at),
      p.transaction_ref,
      (p.amount / 100).toFixed(2),
      p.currency,
      p.credits_purchased,
      p.status,
      p.payment_method || 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-28 animate-pulse"></div>
            ))}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-3 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Payments</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
            <p className="text-gray-600">Track your credit purchases and transactions</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't made any credit purchases yet. Buy credits to start using our services.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="lg:text-3xl text-xl font-bold text-gray-900 mb-2 font-amiamie flex gap-2">
            <span><Icon icon="streamline-freehand:credit-card-payment" width="24" height="24" className=" #e8be3e" /></span>
            Payment History
            </h1>
          <p className="text-gray-600  text-sm lg:tracking-normal tracking-tighter">Track your credit purchases and transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={Receipt}
            label="Total Payments"
            value={data.total_payments.toString()}
            color="bg-blue-600"
          />
          <StatsCard
            icon={CreditCard}
            label="Total Spent"
            value={totalSpentFormatted}
            color="bg-green-600"
          />
          <StatsCard
            icon={TrendingUp}
            label="Credits Purchased"
            value={data.total_credits_purchased.toLocaleString()}
            color="bg-purple-600"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-background border-gray-200 lg:p-6 mb-6 p-3">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="lg:px-4 py-2  px-2 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs 
                  font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Transaction Ref
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Credits
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No payments found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs lg:text-sm">
                          <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{formatDate(payment.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="text-xs lg:text-sm font-mono text-gray-700">{payment.transaction_ref}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="text-xs lg:text-sm font-semibold text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="text-xs lg:text-sm text-gray-900">{payment.credits_purchased.toLocaleString()}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="text-xs lg:text-sm text-gray-600 capitalize">
                          {payment.payment_method || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Results count */}
        {filteredPayments.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredPayments.length} of {data.payments.length} transactions
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;