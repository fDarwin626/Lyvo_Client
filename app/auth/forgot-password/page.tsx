"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend to send OTP
      const response = await requestPasswordReset(email);
      
      // Show success message
      setSuccess(true);
      
      // Wait 1.5 seconds, then redirect to OTP page
      setTimeout(() => {
        router.push(`/auth/forgot-password/verify_otp?email=${encodeURIComponent(email)}`);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold tracking-tight" 
            style={{ fontFamily: 'Cal Sans, sans-serif' }}
          >
            Lyvo
          </h1>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Reset your password
          </h2>
          <p className="text-secondary text-sm">
            Enter your email and we'll send you a verification code
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Check your email!
            </h3>
            <p className="text-green-700 text-sm">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
            <p className="text-green-600 text-xs mt-2">
              Redirecting to verification...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-primary">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending code...
                </span>
              ) : (
                'Send verification code'
              )}
            </button>
          </form>
        )}

        {/* Back to Sign In */}
        <div className="text-center mt-6">
          <Link 
            href="/auth/signin" 
            className="text-sm text-secondary hover:text-primary transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to sign in
          </Link>
        </div>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            🔒 <strong>Security tip:</strong> The verification code expires in 2 minutes. 
            Never share it with anyone.
          </p>
        </div>

      </div>
    </div>
  );
}
