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
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [calculatedCredits, setCalculatedCredits] = useState<number>(0);
  const [amountError, setAmountError] = useState<string>('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
      icon: <Zap className="w-6 h-6" />,
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
      icon: <Sparkles className="w-6 h-6" />,
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12 font-amiamie">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-amiamie-round">
          Unlock more voices, agents, and premium features
        </p>
        
        {/* Current Balance */}
        {userProfile && (
          <div className="mt-6 inline-block bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-2xl font-bold text-purple-700">
              {userProfile.total_credits.toLocaleString()} credits
            </p>
            <p className="text-xs text-gray-500">
              {userProfile.free_credits} free + {userProfile.paid_credits} paid
            </p>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 px-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden
                 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
              plan.isCurrent ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500
               text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                {plan.badge}
              </div>
            )}
            
            {plan.isCurrent && currentTier === 1 && (
              <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-br-lg">
                CURRENT PLAN
              </div>
            )}

            {/* Card Header */}
            <div className={`bg-gradient-to-r ${plan.gradient} p-8 text-white`}>
              <div className="flex items-center gap-3 mb-4">
                {plan.icon}
                <h2 className="text-3xl font-bold font-amiamie">{plan.name}</h2>
              </div>
              
              <div className="flex items-baseline gap-2 mb-2 font-amiamie-round">
                <span className="text-5xl font-bold">
                  <span className=''>$</span>{plan.price}
                </span>
                <span className="text-sm opacity-90">/ {plan.period}</span>
              </div>
              
              <p className="text-sm opacity-90">{plan.tagline}</p>
            </div>

            {/* Features List */}
            <div className="p-8">
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${feature.isWarning ? 'text-yellow-500' : 'text-green-500'}`} />
                    ) : (
                      <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`text-gray-700 ${!feature.included ? 'line-through opacity-50' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.id === 2 ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200
                    bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105"
                >
                  <CreditCard className="inline w-5 h-5 mr-2" />
                  {plan.buttonText}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-6 rounded-lg font-semibold text-lg
                    bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  Current Plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-500/45 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
            {/* Close button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Buy Credits
              </h2>
              <p className="text-gray-600 text-sm">
                Pay as you go - buy exactly what you need
              </p>
            </div>

            {/* Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrency('NGN')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    currency === 'NGN'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🇳🇬 NGN (Naira)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    currency === 'USD'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🇺🇸 USD (Dollar)
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({currency === 'NGN' ? '₦' : '$'})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={currency === 'NGN' ? '1537.30' : '1.03'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 
                  focus:outline-none text-lg"
              />
              
              {/* Pricing hint */}
              <p className="text-xs text-gray-500 mt-1">
                {currency === 'NGN' ? '₦1,537.30' : '$1.03'} = 1,000 credits
              </p>
            </div>

            {/* Credits Preview */}
            {calculatedCredits > 0 && !amountError && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">You will receive:</p>
                <p className="text-3xl font-bold text-green-700">
                  {calculatedCredits.toLocaleString()} credits
                </p>
              </div>
            )}

            {/* Error Message */}
            {amountError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{amountError}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={paymentLoading || !customAmount || !!amountError || calculatedCredits === 0}
              className="w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200
                bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="inline w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="inline w-5 h-5 mr-2" />
                  Pay {customAmount ? formatAmount(Math.round(parseFloat(customAmount) * 100), currency) : ''}
                </>
              )}
            </button>

            {/* Security Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment powered by Flutterwave
            </p>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help Choosing?
          </h3>
          <p className="text-gray-600 mb-6">
            Not sure which plan is right for you? Start with the free tier and upgrade anytime!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
              Contact Support
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}