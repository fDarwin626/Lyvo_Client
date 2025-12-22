'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllPaymentsAdmin,
  PaymentHistoryResponse,
  PaymentHistoryItem,
  formatAmount,
} from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

/**
 * 💳 Admin Payment History Page
 * Shows all payments from all users
 */
export default function AdminPaymentsPage() {
  const router = useRouter();
  
  // State
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('');
  
  // Fetch payments
  useEffect(() => {
    fetchPayments();
  }, []);
  
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data: PaymentHistoryResponse = await getAllPaymentsAdmin();
      
      setPayments(data.payments);
      setTotalRevenue(data.total_spent);
      setTotalPayments(data.total_payments);
      setTotalCredits(data.total_credits_purchased);
    } catch (err: any) {
      if (err.statusCode === 403) {
        router.push('/admin');
      } else {
        setError(err.message || 'Failed to load payments');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Filter payments
  const filteredPayments = payments.filter(payment => {
    if (statusFilter && payment.status !== statusFilter) return false;
    if (currencyFilter && payment.currency !== currencyFilter) return false;
    return true;
  });
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const value = amount / 100;
    if (currency === 'USD') {
      return `$${value.toFixed(2)}`;
    } else if (currency === 'NGN') {
      return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }
    return `${currency} ${value.toFixed(2)}`;
  };
  
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header */}
      <div className="bg-[#0d1230] border-b border-gray-800/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold font-amiamie">
              💳 Payment History
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              All transactions from all users
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0d1230] rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-amiamie">Total Revenue</p>
                <p className="text-white text-3xl font-bold mt-1">
                  {formatCurrency(totalRevenue, 'USD')}
                </p>
              </div>
              <Icon icon="mdi:cash-multiple" width="40" className="text-green-500" />
            </div>
          </div>
          
          <div className="bg-[#0d1230] rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-amiamie">Total Payments</p>
                <p className="text-white text-3xl font-bold mt-1">{totalPayments}</p>
              </div>
              <Icon icon="mdi:credit-card" width="40" className="text-blue-500" />
            </div>
          </div>
          
          <div className="bg-[#0d1230] rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-amiamie">Credits Sold</p>
                <p className="text-white text-3xl font-bold mt-1">
                  {totalCredits.toLocaleString()}
                </p>
              </div>
              <Icon icon="mdi:star-circle" width="40" className="text-purple-500" />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-[#0d1230] rounded-xl p-4 mb-6 border border-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-amiamie">
                Currency
              </label>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="w-full bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Currencies</option>
                <option value="USD">USD ($)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-400">Loading payments...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <Icon icon="mdi:alert-circle" width="48" className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchPayments}
              className="mt-4 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Payments Table */}
        {!loading && !error && (
          <>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="mdi:cash-remove" width="64" className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No payments found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a1f3a]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Transaction ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Credits
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Method
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-[#1a1f3a]/50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-300 font-mono">
                                {payment.transaction_ref.substring(0, 20)}...
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-white">
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-purple-400 font-medium">
                              {payment.credits_purchased.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-400">
                              {payment.payment_method || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-400">
                              {formatDate(payment.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}