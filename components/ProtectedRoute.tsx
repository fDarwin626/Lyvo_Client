"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication only on client side
    if (!isAuthenticated()) {
      // Not logged in - redirect to sign in
      router.push('/auth/signin');
    } else {
      // User is authenticated, stop checking
      setIsChecking(false);
    }
  }, [router]);

  // Show loading state while checking (prevents hydration mismatch)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}