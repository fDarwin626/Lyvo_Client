'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles, Zap, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getUserProfile,
  initializePayment,
  verifyPayment,
  calculateCreditsFromAmount,
  formatAmount,
  APIError,
  UserProfile
} from '@/lib/api';
import {
  canPurchaseTestCredits,
  recordTestPurchase,
  formatNextEligibleDate,
  getTestLimits

 } from '@/lib/testPaymentLimiter';


interface Feature {
  text: string;
  included: boolean;
  isWarning?: boolean;
}

interface Plan {
  id: number;
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ReactNode;
  badge?: string;
  features: Feature[];
  buttonText: string;
  isCurrent: boolean;
  gradient: string;
}

export default function PricingPage() {
  const router = useRouter();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');
  const [calculatedCredits, setCalculatedCredits] = useState<number>(0);
  const [amountError, setAmountError] = useState<string>('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [testLimits, setTestLimits] = useState(getTestLimits());
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);


  async function loadUserProfile() {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      // ✅ TEST MODE: Load rate limits after profile loads
      setTestLimits(getTestLimits());
      // REASON: Refresh limits when profile changes
    } catch (error) {
      console.error('Failed to load profile:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  }

  // Calculate credits when amount changes
  useEffect(() => {
    if (!customAmount) {
      setCalculatedCredits(0);
      setAmountError('');
      return;
    }

    const amountInCents = Math.round(parseFloat(customAmount) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      setAmountError('Please enter a valid amount');
      setCalculatedCredits(0);
      return;
    }

    const result = calculateCreditsFromAmount(amountInCents, currency);

    if (result.valid) {
      setCalculatedCredits(result.credits);
      setAmountError('');
    } else {
      setCalculatedCredits(0);
      setAmountError(result.error || 'Invalid amount');
    }
  }, [customAmount, currency]);

// Handle payment initialization
  async function handlePayment() {
    if (!customAmount || amountError || calculatedCredits === 0) {
      return;
    }

      console.log('💳 Payment Debug:');
  console.log('   Currency:', currency);
  console.log('   Custom Amount:', customAmount);
  console.log('   Amount in cents:', Math.round(parseFloat(customAmount) * 100));


    // ✅ TEST MODE: Check rate limit eligibility
    const eligibility = canPurchaseTestCredits(userProfile?.total_credits || 0);

    if (!eligibility.allowed) {
      // Show rate limit warning
      setShowRateLimitWarning(true);
      alert(
        `${eligibility.reason}\n\n` +
        `Next purchase available: ${eligibility.nextDate ? formatNextEligibleDate(eligibility.nextDate) : 'N/A'}\n` +
        `Days remaining: ${eligibility.daysRemaining || 0}`
      );
      return; // BLOCK payment
    }

    setPaymentLoading(true);

    try {
      const amountInCents = Math.round(parseFloat(customAmount) * 100);

      // Initialize payment with backend
      const response = await initializePayment(amountInCents, currency);

      if (response.success && response.payment_link) {
        // Redirect to Flutterwave payment page
        window.location.href = response.payment_link;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);

      if (error instanceof APIError) {
        alert(`Payment failed: ${error.message}`);
      } else {
        alert('Payment initialization failed. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-3">
            Loading
          </p>
          <div className="h-[2px] w-32 bg-border mx-auto relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-accent animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const currentTier = userProfile?.plan_tier || 1;

  const plans: Plan[] = [
    {
      id: 1,
      name: "Free",
      price: "0",
      period: "forever",
      tagline: "Perfect to get started",
      icon: <Zap className="w-5 h-5" />,
      features: [
        { text: "1,000 free credits on signup", included: true },
        { text: "Monthly credit refill", included: true },
        { text: "3 voice clones", included: true },
        { text: "2 agents", included: true },
        { text: "Limited to 2 agents & 3 clones", included: true, isWarning: true },
        { text: "No access to premium voices", included: false }
      ],
      buttonText: "Current Plan",
      isCurrent: currentTier === 1,
      gradient: "from-gray-400 to-gray-600"
    },
    {
      id: 2,
      name: "Premium",
      price: "1.03",
      period: "per 1000 credits",
      tagline: "Unlock full potential",
      icon: <Sparkles className="w-5 h-5" />,
      badge: "PAY AS YOU GO",
      features: [
        { text: "Buy any amount of credits", included: true },
        { text: "Monthly credit refill", included: true },
        { text: "6 voice clones", included: true },
        { text: "5 agents", included: true },
        { text: "Access to premium voices", included: true },
        { text: "Priority support", included: true }
      ],
      buttonText: "Buy Credits",
      isCurrent: currentTier === 2,
      gradient: "from-purple-700 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 px-4 sm:px-6 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-[ArchivoBlack] text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted mb-3">
            Plans
          </p>
          <h1 className="font-amiamie text-3xl sm:text-4xl lg:text-5xl text-primary mb-4">
            Choose your plan
          </h1>
          <p className="text-secondary text-base max-w-lg mx-auto">
            Unlock more voices, agents, and premium features
          </p>

          {/* Current Balance */}
          {userProfile && (
            <div className="mt-8 inline-flex flex-col items-center gap-1 pt-6 border-t border-default">
              <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted">
                Current balance
              </p>
              <p className="font-amiamie text-3xl text-primary">
                {userProfile.total_credits.toLocaleString()} credits
              </p>
              <p className="text-xs text-muted">
                {userProfile.free_credits} free + {userProfile.paid_credits} paid
              </p>
            </div>
          )}
        </div>

        {/* Pricing Columns */}
        <div className="border border-default grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {plans.map((plan) => (
            <div key={plan.id} className="p-6 sm:p-8 flex flex-col">

              {/* Plan header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5 text-primary">
                  {plan.icon}
                  <h2 className="font-amiamie text-2xl">{plan.name}</h2>
                </div>
                {plan.badge && (
                  <span className="font-[ArchivoBlack] text-[9px] tracking-[0.15em] uppercase text-accent">
                    {plan.badge}
                  </span>
                )}
              </div>

              {plan.isCurrent && (
                <p className="font-[ArchivoBlack] text-[9px] tracking-[0.15em] uppercase text-accent mb-4">
                  Current plan
                </p>
              )}
              {!plan.isCurrent && <div className="mb-4" />}

              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-amiamie text-4xl text-primary">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted">/ {plan.period}</span>
              </div>

              <p className="text-sm text-secondary mb-6">{plan.tagline}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-secondary' : 'text-muted line-through'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === 2 ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 px-6 bg-invert text-invert font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {plan.buttonText}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-6 border border-default text-muted font-medium text-sm cursor-not-allowed"
                >
                  Current Plan
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-default max-w-md w-full p-6 sm:p-8 relative">
              {/* Close button */}
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <h2 className="font-amiamie text-2xl text-primary mb-1">
                  Buy Credits
                </h2>
                <p className="text-secondary text-sm">
                  Pay as you go — buy exactly what you need
                </p>
              </div>

              {/* Currency Selection */}
              <div className="mb-6">
                <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-2">
                  Currency
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🇳🇬 Setting NGN'); // Debug

                      setCurrency('NGN');
                      setCustomAmount('1537.30');
                    }}
                    className={`flex-1 py-2.5 px-4 border text-sm font-medium transition-colors ${
                      currency === 'NGN'
                        ? 'bg-invert text-invert border-transparent'
                        : 'border-default text-secondary hover:border-accent'
                    }`}
                  >
                    NGN <span className="opacity-70">(Naira)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🇳🇬 Setting NGN'); // Debug

                      setCurrency('USD');
                      setCustomAmount('1.03');
                    }}
                    className={`flex-1 py-2.5 px-4 border text-sm font-medium transition-colors ${
                      currency === 'USD'
                        ? 'bg-invert text-invert border-transparent'
                        : 'border-default text-secondary hover:border-accent'
                    }`}
                  >
                    USD <span className="opacity-70">(Dollar)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-2">
                  Amount ({currency === 'NGN' ? '₦' : '$'})
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={currency === 'NGN' ? '1537.30' : '1.03'}
                  className="w-full bg-transparent border-b border-default focus:border-accent focus:outline-none text-primary placeholder:text-muted text-lg pb-2"
                />

                <p className="text-xs text-muted mt-2">
                  {currency === 'NGN' ? '₦1,537.30' : '$1.03'} = 1,000 credits
                </p>
              </div>

              {/* Credits Preview */}
              {calculatedCredits > 0 && !amountError && (
                <div className="mb-6 pt-4 border-t border-accent">
                  <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-accent mb-1">
                    You will receive
                  </p>
                  <p className="font-amiamie text-3xl text-primary">
                    {calculatedCredits.toLocaleString()} credits
                  </p>
                </div>
              )}

              {/* Error Message */}
              {amountError && (
                <div className="mb-6 pt-4 border-t border-danger flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-secondary">{amountError}</p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={paymentLoading || !customAmount || !!amountError || calculatedCredits === 0}
                className="w-full py-3.5 px-6 bg-invert text-invert font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:bg-border disabled:text-muted disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay {customAmount ? formatAmount(Math.round(parseFloat(customAmount) * 100), currency) : ''}
                  </>
                )}
              </button>

              {/* ✅ TEST MODE: Rate Limit Warning */}
              {testLimits.lastPurchaseDate && (
                <div className="mt-4 pt-4 border-t border-default">
                  <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-accent mb-1">
                    Test mode active
                  </p>
                  <p className="text-xs text-muted">
                    Next purchase available: {formatNextEligibleDate(testLimits.nextEligibleDate || '')}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Total test purchases: {testLimits.purchaseCount}
                  </p>
                </div>
              )}
              {/* REASON: Show user when they can buy again (transparency) */}

              {/* Security Note */}
              <p className="text-xs text-muted text-center mt-4">
                Payments secured by Flutterwave
              </p>
            </div>
          </div>
        )}

        {/* Test Cards Section */}
        <div className="mt-16">
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-accent mb-3">
                Test mode active
              </p>
              <h3 className="font-amiamie text-2xl text-primary mb-2">
                Test cards for Lyvo credits
              </h3>
              <p className="text-secondary text-sm sm:text-base">
                Use these test cards to purchase Lyvo credits in test mode
              </p>
            </div>

            {/* Important Notice */}
            <div className="border-l-2 border-accent pl-4 py-1 mb-8">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary mb-1">
                    Test mode limitations
                  </p>
                  <ul className="text-xs text-secondary space-y-1">
                    <li>· You can only purchase <span className="text-primary font-medium">once per month</span></li>
                    <li>· Maximum <span className="text-primary font-medium">1,000 credits</span> per purchase</li>
                    <li>· No real payment will be charged</li>
                    <li>· This is for testing purposes only</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Visa Card */}
              <div className="border border-default p-4 hover:border-accent transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary text-sm">Visa Card</h4>
                  <CreditCard className="w-4 h-4 text-muted" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-1">Card Number</p>
                    <div className="flex items-center justify-between border-b border-default pb-1.5">
                      <code className="text-xs font-mono text-primary">4187427415564246</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('4187427415564246');
                          alert('Card number copied!');
                        }}
                        className="text-xs text-secondary hover:text-accent underline decoration-border underline-offset-4"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">CVV</p>
                      <code className="text-xs font-mono text-primary">828</code>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">PIN</p>
                      <code className="text-xs font-mono text-primary">3310</code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Expiry</p>
                    <code className="text-xs font-mono text-primary">09/32</code>
                  </div>
                </div>
              </div>

              {/* Mastercard */}
              <div className="border border-default p-4 hover:border-accent transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary text-sm">Mastercard</h4>
                  <CreditCard className="w-4 h-4 text-muted" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-1">Card Number</p>
                    <div className="flex items-center justify-between border-b border-default pb-1.5">
                      <code className="text-xs font-mono text-primary">5531886652142950</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('5531886652142950');
                          alert('Card number copied!');
                        }}
                        className="text-xs text-secondary hover:text-accent underline decoration-border underline-offset-4"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">CVV</p>
                      <code className="text-xs font-mono text-primary">564</code>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">PIN</p>
                      <code className="text-xs font-mono text-primary">3310</code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Expiry</p>
                    <code className="text-xs font-mono text-primary">09/32</code>
                  </div>
                </div>
              </div>

              {/* International USD Card */}
              <div className="border border-default p-4 hover:border-accent transition-colors sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary text-sm">International USD</h4>
                  <CreditCard className="w-4 h-4 text-muted" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-1">Card Number</p>
                    <div className="flex items-center justify-between border-b border-default pb-1.5">
                      <code className="text-xs font-mono text-primary">4242424242424242</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('4242424242424242');
                          alert('Card number copied!');
                        }}
                        className="text-xs text-secondary hover:text-accent underline decoration-border underline-offset-4"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">CVV</p>
                      <code className="text-xs font-mono text-primary">123</code>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">OTP</p>
                      <code className="text-xs font-mono text-primary">123456</code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Expiry</p>
                    <code className="text-xs font-mono text-primary">12/34</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 border border-default p-5">
              <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mb-3">
                How to use
              </p>
              <ol className="text-sm text-secondary space-y-1.5 list-decimal list-inside">
                <li>Click "Buy Credits" button above</li>
                <li>Enter the amount you want to test (max 1,000 credits worth)</li>
                <li>Copy and paste any test card details at checkout</li>
                <li>Complete the test payment flow</li>
                <li>Your credits will be added instantly</li>
                <li>OTP for all test payment simply enter 123456</li>
              </ol>
              <p className="text-xs text-muted mt-4">
                Remember: you can only make one test purchase per month.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center border border-default p-8">
          <h3 className="font-amiamie text-2xl text-primary mb-3">
            Need help choosing?
          </h3>
          <p className="text-secondary mb-6">
            Not sure which plan is right for you? Start with the free tier and upgrade anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="px-6 py-2.5 border border-default text-sm font-medium text-secondary hover:text-primary hover:border-accent transition-colors">
              Contact Support
            </button>
            <button
              onClick={() => router.push("/documentation")}
              className="px-6 py-2.5 border border-default text-sm font-medium text-secondary hover:text-primary hover:border-accent transition-colors"
            >
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}