'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            💡 Why did this happen?
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• You clicked the cancel/back button</li>
            <li>• The payment window was closed</li>
            <li>• Payment timeout occurred</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard/upgrade')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 
              text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <CreditCard className="inline w-5 h-5 mr-2" />
            Try Payment Again
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

        {/* Support Link */}
        <p className="text-xs text-gray-500 mt-6">
          Having trouble? <a href="#" className="text-purple-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
