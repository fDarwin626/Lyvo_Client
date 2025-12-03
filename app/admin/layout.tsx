'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAdminStats } from '@/lib/api'; // Import getAdminStats

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pageState, setPageState] = useState<'validating' | 'loading' | 'authorized'>('validating');

  useEffect(() => {
    validateAdminAccess();
  }, []);

  const validateAdminAccess = async () => {
    // Check authentication immediately
    const authenticated = isAuthenticated();

    if (!authenticated) {
      // NOT authenticated - redirect and STAY in 404 waiting room
      router.push('/');
      return; // Exit immediately - never change pageState
    }

    // Authenticated - now check if they're actually an admin
    // We do this by trying to fetch admin stats
    try {
      await getAdminStats(); // This will throw 401/403 if not admin
      
      // SUCCESS - They ARE an admin! Now show loading
      setPageState('loading');
      
      // Brief loading animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show dashboard
      setPageState('authorized');
      
    } catch (err: any) {
      // NOT an admin (401/403) or other error
      // Redirect and STAY in 404 waiting room
      router.push('/');
      // Don't change pageState - keep showing 404
    }
  };

  // Show 404 while validating OR while redirecting non-admins
  if (pageState === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-700">404</h1>
          <p className="text-2xl text-gray-500 mt-4">Page Not Found</p>
          <p className="text-gray-600 mt-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Show loading (ONLY for verified admins)
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-300 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show admin panel (ONLY for authorized admins)
  return <div className="min-h-screen bg-[#0a0e27]">{children}</div>;
}