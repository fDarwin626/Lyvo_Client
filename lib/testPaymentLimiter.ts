/**
 * 🧪 TEST PAYMENT RATE LIMITER
 * 
 * TEMPORARY MODULE - Restricts test card purchases to once per 30 days
 * 
 * WHY IT EXISTS:
 * - Prevents abuse of test payment system
 * - Limits users to 1,000 credits per month during test mode
 * 
 * HOW TO REMOVE (When going production):
 * 1. Delete this file: lib/testPaymentLimiter.ts
 * 2. Remove import from app/dashboard/upgrade/page.tsx
 * 3. Remove eligibility check in handlePayment function
 * 4. Done! No other files affected.
 * 
 * STORAGE: Uses browser localStorage (no backend needed)
 */

const STORAGE_KEY = 'lyvo_test_payment_limits';
const LOCK_PERIOD_DAYS = 30;

export interface TestPaymentLimits {
  lastPurchaseDate: string | null;
  nextEligibleDate: string | null;
  purchaseCount: number;
  totalPurchased: number; // Track lifetime test purchases
}

export interface EligibilityCheck {
  allowed: boolean;
  reason: string;
  nextDate?: string;
  daysRemaining?: number;
}

/**
 * Get current test payment limits from localStorage
 */
export function getTestLimits(): TestPaymentLimits {
  if (typeof window === 'undefined') {
    return {
      lastPurchaseDate: null,
      nextEligibleDate: null,
      purchaseCount: 0,
      totalPurchased: 0
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        lastPurchaseDate: null,
        nextEligibleDate: null,
        purchaseCount: 0,
        totalPurchased: 0
      };
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse test limits:', error);
    return {
      lastPurchaseDate: null,
      nextEligibleDate: null,
      purchaseCount: 0,
      totalPurchased: 0
    };
  }
}

/**
 * Save test payment limits to localStorage
 */
function saveTestLimits(limits: TestPaymentLimits): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
  } catch (error) {
    console.error('Failed to save test limits:', error);
  }
}

/**
 * Calculate days since last purchase
 */
function getDaysSince(dateString: string): number {
  const lastDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate next eligible purchase date
 */
function calculateNextEligibleDate(lastPurchaseDate: string): string {
  const lastDate = new Date(lastPurchaseDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + LOCK_PERIOD_DAYS);
  return nextDate.toISOString();
}

/**
 * Check if user can purchase test credits
 * 
 * RULES:
 * 1. First time: Always allowed
 * 2. After purchase: Must wait 30 days
 * 3. Must have less than 500 credits remaining
 */
export function canPurchaseTestCredits(currentBalance: number = 0): EligibilityCheck {
  const limits = getTestLimits();

  // First time purchase - always allowed
  if (!limits.lastPurchaseDate) {
    return {
      allowed: true,
      reason: 'First test purchase eligible'
    };
  }

  // Check if 30 days have passed
  const daysSince = getDaysSince(limits.lastPurchaseDate);
  const daysRemaining = LOCK_PERIOD_DAYS - daysSince;

  if (daysRemaining > 0) {
    return {
      allowed: false,
      reason: `Test purchases limited to once per ${LOCK_PERIOD_DAYS} days`,
      nextDate: limits.nextEligibleDate || calculateNextEligibleDate(limits.lastPurchaseDate),
      daysRemaining
    };
  }

  // Check balance threshold (optional protection)
  if (currentBalance > 500) {
    return {
      allowed: false,
      reason: 'Please use your remaining credits before purchasing more',
      nextDate: limits.nextEligibleDate || calculateNextEligibleDate(limits.lastPurchaseDate)
    };
  }

  // Eligible for purchase
  return {
    allowed: true,
    reason: 'Eligible for test purchase'
  };
}

/**
 * Record a successful test purchase
 * Call this AFTER payment is confirmed
 */
export function recordTestPurchase(): void {
  const limits = getTestLimits();
  const now = new Date().toISOString();
  const nextDate = calculateNextEligibleDate(now);

  const updatedLimits: TestPaymentLimits = {
    lastPurchaseDate: now,
    nextEligibleDate: nextDate,
    purchaseCount: limits.purchaseCount + 1,
    totalPurchased: limits.totalPurchased + 1000 // Always 1000 credits in test mode
  };

  saveTestLimits(updatedLimits);
}

/**
 * Reset test limits (for testing only - remove in production)
 */
export function resetTestLimits(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format next eligible date for display
 */
export function formatNextEligibleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}