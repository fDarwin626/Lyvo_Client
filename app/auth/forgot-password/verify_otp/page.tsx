"use client";
import { useState, useRef, useEffect,Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyResetOTP, requestPasswordReset } from '@/lib/api';

 function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  // OTP state (6 digits)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes = 120 seconds
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Refs for input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-password');
    }
  }, [email, router]);

  // Countdown timer (2 minutes)
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Enable resend button after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanResend(true);
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error on input
    
    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when 6th digit entered
    if (index === 5 && value) {
      const otpString = newOtp.join('');
      handleVerify(otpString);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous box if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste (paste all 6 digits at once)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus(); // Focus last box
      handleVerify(pastedData); // Auto-submit
    }
  };

  // Verify OTP
  const handleVerify = async (otpString: string) => {
    setError('');
    setLoading(true);

    try {
      // Call backend to verify OTP
      const response = await verifyResetOTP(email, otpString);
      
      // Show success
      setSuccess(true);
      
      // Wait 1 second, then redirect to reset password page with token
      setTimeout(() => {
        router.push(`/auth/forgot-password/reset-password?token=${response.reset_token}`);
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setLoading(false);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Manual verify button click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    handleVerify(otpString);
  };

  // Resend OTP
  const handleResend = async () => {
    setResending(true);
    setError('');
    
    try {
      await requestPasswordReset(email);
      
      // Reset timer and states
      setTimeLeft(120);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Re-enable resend after 30 seconds
      setTimeout(() => setCanResend(true), 30000);
      
      alert('New code sent! Check your email.');
      
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
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
            Enter verification code
          </h2>
          <p className="text-secondary text-sm">
            We sent a 6-digit code to <strong className="text-primary">{email}</strong>
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
              Code verified!
            </h3>
            <p className="text-green-700 text-sm">
              Redirecting to password reset...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* OTP Input Boxes (6 separate boxes) */}
            <div>
              <div className="flex justify-center gap-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={loading}
                    className="w-14 h-14 text-center text-2xl font-bold bg-surface border-2 border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-secondary">
                    Code expires in{' '}
                    <span className={`font-semibold ${timeLeft <= 30 ? 'text-red-500' : 'text-brand'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-500 font-semibold">
                    ⚠️ Code expired. Please request a new one.
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
              className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify code'
              )}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-brand hover:text-brand/80 font-medium disabled:opacity-50 transition-colors"
                >
                  {resending ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              ) : (
                <p className="text-sm text-secondary">
                  Resend available in 30 seconds
                </p>
              )}
            </div>

          </form>
        )}

        {/* Back Button */}
        <div className="text-center mt-6">
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-secondary hover:text-primary transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to email
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 <strong>Tip:</strong> You can paste the entire codat once, or type each digit separately.
          </p>
        </div>

      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTP />
    </Suspense>
  );
}