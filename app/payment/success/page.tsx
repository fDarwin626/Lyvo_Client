'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle, ArrowRight, Home } from 'lucide-react';
import { verifyPayment, getUserProfile, UserProfile, APIError } from '@/lib/api';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    verifyPaymentFromUrl();
  }, []);

  async function verifyPaymentFromUrl() {
    try {
      // Get transaction_id from URL
      const txId = searchParams.get('transaction_id');
      const status = searchParams.get('status');

      if (!txId) {
        setError('No transaction ID found');
        setVerifying(false);
        return;
      }

      if (status !== 'successful') {
        setError('Payment was not successful');
        setVerifying(false);
        return;
      }

      // Verify payment with backend
      const response = await verifyPayment(parseInt(txId));

      if (response.success && response.verified) {
        setVerified(true);
        setCredits(response.credits_added);
        setNewBalance(response.new_balance);
        
        // Load updated user profile
        const profile = await getUserProfile();
        setUserProfile(profile);
      } else {
        setError(response.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to verify payment. Please contact support.');
      }
    } finally {
      setVerifying(false);
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>
          
          <p className="text-gray-600 mb-8">
            {error}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/upgrade')}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 
                text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg 
                font-semibold hover:bg-gray-200 transition-all"
            >
              <Home className="inline w-5 h-5 mr-2" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600">
            Your credits have been added to your account
          </p>
        </div>

        {/* Credits Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Credits Added</p>
            <p className="text-4xl font-bold text-purple-700">
              +{credits.toLocaleString()}
            </p>
          </div>
          
          <div className="pt-4 border-t border-purple-200">
            <p className="text-sm text-gray-600 mb-1">New Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {newBalance.toLocaleString()} credits
            </p>
          </div>
        </div>

        {/* Tier Upgrade Message */}
        {userProfile && userProfile.plan_tier === 2 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-yellow-800 mb-1">
              🎉 Upgraded to Premium!
            </p>
            <p className="text-xs text-yellow-700">
              You now have access to premium voices and increased limits
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 
              text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Start Creating
            <ArrowRight className="inline w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={() => router.push('/dashboard/upgrade')}
            className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg 
              font-semibold hover:bg-gray-200 transition-all"
          >
            Buy More Credits
          </button>
        </div>

        {/* Support Link */}
        <p className="text-xs text-gray-500 mt-6">
          Need help? <a href="#" className="text-purple-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}