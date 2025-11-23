"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getToken, removeToken } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // You could decode the JWT token here to get user info
    // For now, we'll just show they're logged in
    const token = getToken();
    if (token) {
      // In a real app, you'd decode the JWT to get user email
      setUserEmail('Logged in user');
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    alert('Logged out successfully!');
    router.push('/auth/signin');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface rounded-lg border border-default p-8">
            <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
            <p className="text-secondary mb-6">
              Welcome to your VoiceAI dashboard! You are successfully logged in.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg">
                <h2 className="font-semibold mb-2">Account Status</h2>
                <p className="text-sm text-secondary">✅ Authenticated</p>
              </div>

              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}