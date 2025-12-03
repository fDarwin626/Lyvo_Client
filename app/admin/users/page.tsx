'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, toggleUserStatus, deleteUser, AdminUser } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (!confirm('Are you sure you want to change this user\'s status?')) return;
    
    try {
      await toggleUserStatus(userId);
      await loadUsers(); // Refresh
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`⚠️ PERMANENT DELETE\n\nDelete user: ${email}?\n\nThis will also delete:\n- All their cloned voices\n- All their generations\n\nThis CANNOT be undone!`)) return;
    
    try {
      await deleteUser(userId);
      await loadUsers(); // Refresh
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white font-amiamie">User Management</h1>
          <p className="text-gray-400 mt-1">View and manage all user accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Search Users</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-semibold">{filteredUsers.length}</span> of {users.length} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1f3a] border-b border-gray-800">
              <tr>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">User</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Auth Provider</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Status</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Clones</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Role</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Joined</th>
                <th className="text-right text-gray-400 font-medium text-sm px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-[#1a1f3a]/30 transition">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{user.email}</div>
                      {user.user_name && (
                        <div className="text-gray-500 text-sm">{user.user_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.auth_provider === 'google' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.auth_provider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{user.clones_created}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_admin && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!user.is_admin && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`p-2 rounded-lg transition ${
                              user.is_active
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            }`}
                            title={user.is_active ? 'Disable user' : 'Enable user'}
                          >
                            <Icon 
                              icon={user.is_active ? 'mdi:cancel' : 'mdi:check-circle'} 
                              width="20" 
                            />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                            title="Delete user permanently"
                          >
                            <Icon icon="mdi:delete" width="20" />
                          </button>
                        </>
                      )}
                      
                      {user.is_admin && (
                        <span className="text-gray-500 text-sm">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Icon icon="mdi:account-off" width="48" className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}