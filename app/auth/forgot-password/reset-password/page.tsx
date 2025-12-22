"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength state
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  // Check password requirements
  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    });
  }, [password]);

  // Calculate password strength
  const getPasswordStrength = (): { text: string; color: string; percentage: number } => {
    const checks = Object.values(passwordChecks).filter(Boolean).length;
    
    if (checks === 0) return { text: '', color: '', percentage: 0 };
    if (checks <= 2) return { text: 'Weak', color: 'text-red-500', percentage: 33 };
    if (checks <= 4) return { text: 'Good', color: 'text-yellow-500', percentage: 66 };
    return { text: 'Strong', color: 'text-green-500', percentage: 100 };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all requirements met
    const allChecksPassed = Object.values(passwordChecks).every(Boolean);
    if (!allChecksPassed) {
      setError('Please meet all password requirements');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Call backend to reset password
      await resetPassword(token, password);
      
      // Show success
      setSuccess(true);
      
      // Wait 2 seconds, then redirect to signin
      setTimeout(() => {
        router.push('/auth/signin?reset=success');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
            Create new password
          </h2>
          <p className="text-secondary text-sm">
            Choose a strong password to secure your account
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Password reset successful! 🎉
            </h3>
            <p className="text-green-700 text-sm mb-2">
              Your password has been updated
            </p>
            <p className="text-green-600 text-xs">
              Redirecting to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-primary">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent pr-12 disabled:opacity-50"
                  placeholder="Enter new password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-secondary">Password strength</span>
                    <span className={`text-xs font-semibold ${strength.color}`}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        strength.percentage === 33 ? 'bg-red-500' :
                        strength.percentage === 66 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${strength.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-primary">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent pr-12 disabled:opacity-50"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-1 ${
                  password === confirmPassword ? 'text-green-600' : 'text-red-500'
                }`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <div className="bg-surface border border-default rounded-lg p-4">
              <p className="text-sm font-medium text-primary mb-3">Password must contain:</p>
              <div className="space-y-2">
                <div className={`flex items-center text-xs ${passwordChecks.length ? 'text-green-600' : 'text-secondary'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {passwordChecks.length ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    )}
                  </svg>
                  At least 10 characters
                </div>
                <div className={`flex items-center text-xs ${passwordChecks.uppercase ? 'text-green-600' : 'text-secondary'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {passwordChecks.uppercase ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    )}
                  </svg>
                  One uppercase letter (A-Z)
                </div>
                <div className={`flex items-center text-xs ${passwordChecks.lowercase ? 'text-green-600' : 'text-secondary'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {passwordChecks.lowercase ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    )}
                  </svg>
                  One lowercase letter (a-z)
                </div>
                <div className={`flex items-center text-xs ${passwordChecks.number ? 'text-green-600' : 'text-secondary'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {passwordChecks.number ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    )}
                  </svg>
                  One number (0-9)
                </div>
                <div className={`flex items-center text-xs ${passwordChecks.special ? 'text-green-600' : 'text-secondary'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {passwordChecks.special ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    )}
                  </svg>
                  One special character (!@#$%^&*)
                </div>
              </div>
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
              disabled={loading || !Object.values(passwordChecks).every(Boolean) || password !== confirmPassword}
              className="w-full py-3 bg-black text-white rounded-lg font-medium
               hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" 
                    stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting password...
                </span>
              ) : (
                'Reset password'
              )}
            </button>

          </form>
        )}

        {/* Back to Sign In */}
        <div className="text-center mt-6">
          <Link 
            href="/auth/signin" 
            className="text-sm text-secondary hover:text-primary
             transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" 
              strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
