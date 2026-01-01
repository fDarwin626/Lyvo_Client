'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAdminStats } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';

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
    // STEP 1: Check if device is mobile (FIRST line of defense)
    const isMobile = checkIfMobile();
    
    if (isMobile) {
      // Mobile user (admin or not) - stay in 404, then redirect
      // Brief delay so they see the 404 (looks natural)
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/');
      return; // Exit - never proceed further
    }

    // STEP 2: Check authentication (desktop users only reach here)
    const authenticated = isAuthenticated();

    if (!authenticated) {
      // NOT authenticated desktop user - redirect
      router.push('/');
      return;
    }

    // STEP 3: Verify admin privileges (authenticated desktop user)
    try {
      await getAdminStats();
      
      // SUCCESS - Desktop admin user!
      setPageState('loading');
      await new Promise(resolve => setTimeout(resolve, 500));
      setPageState('authorized');
      
    } catch (err: any) {
      // NOT an admin - redirect
      router.push('/');
    }
  };

  // Mobile detection function
  const checkIfMobile = (): boolean => {
    // Method 1: User Agent detection
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    
    // Method 2: Screen size detection (catches tablets in phone mode)
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const isMobileScreen = screenWidth < 1024; // Below lg breakpoint
    
    // Method 3: Touch detection (catches touchscreen laptops, so use cautiously)
    const isTouchDevice = typeof window !== 'undefined' && 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // COMBINE: Must match mobile pattern OR have small screen
    // Touch alone isn't enough (touchscreen laptops exist)
    return mobileRegex.test(userAgent) || isMobileScreen;
  };

  // Show 404 while validating OR while redirecting (mobile/non-admin/non-authenticated)
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

  // Show loading (ONLY for verified desktop admins)
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

  // Show admin panel (ONLY for authorized desktop admins)
  return (
    <div className="bg-[#0a0e27] h-screen flex overflow-hidden">
      <div className="
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        w-[60%] lg:w-auto
      ">  
        <AdminSidebar/>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto w-full">{children}</div>
    </div>
  );
}