"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserProfile  } from '@/lib/api';

// ========== TYPES ==========
interface CreditContextType {
  // Credits
  freeCredits: number;
  paidCredits: number;
  totalCredits: number;
  percentage: number;
  
  // Tier
  planTier: number;
  tierName: string;
  premiumUnlocked: boolean;
  
  // Limits
  maxAgents: number;
  agentsUsed: number;
  maxClones: number;
  clonesUsed: number;

  // User Info
  userName: string;
  userEmail: string;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshBalance: () => Promise<void>;
  deductCredits: (amount: number, isFromFree?: boolean) => void;
  addCredits: (amount: number) => void;
}

// ========== CONTEXT ==========
const CreditContext = createContext<CreditContextType | undefined>(undefined);

// ========== PROVIDER ==========
export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [freeCredits, setFreeCredits] = useState<number>(0);
  const [paidCredits, setPaidCredits] = useState<number>(0);
  const [planTier, setPlanTier] = useState<number>(1);
  const [tierName, setTierName] = useState<string>('Free');
  const [premiumUnlocked, setPremiumUnlocked] = useState<boolean>(false);
  const [maxAgents, setMaxAgents] = useState<number>(2);
  const [agentsUsed, setAgentsUsed] = useState<number>(0);
  const [maxClones, setMaxClones] = useState<number>(3);
  const [clonesUsed, setClonesUsed] = useState<number>(0);
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');

  // Calculate percentage (0-100)
  const totalCredits = freeCredits + paidCredits;
  const percentage = 1000 > 0 
    ? Math.max(0, Math.min(100, (totalCredits / 1000) * 100))
    : 0;
  /**
   * ✅ FETCH REAL BALANCE FROM BACKEND
   * Calls GET /agent/user/balance
   */
const refreshBalance = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);

    const data = await getUserProfile();
    
    setFreeCredits(data.free_credits);
    setPaidCredits(data.paid_credits);
    setPlanTier(data.plan_tier);
    setTierName(data.tier_name);
    setPremiumUnlocked(data.premium_unlocked);
    setMaxAgents(data.max_agents);
    setAgentsUsed(data.agents_used);
    setMaxClones(data.max_clones);
    setClonesUsed(data.clones_used);
    setUserEmail(data.email);

    // if user has a name, (from Google login) use it
      // otherwise default to 'User'
    const extractedName = data.user_name || data.email.split('@')[0];
    setUserName(extractedName);

    console.log('💰 Profile loaded:', {
      tier: data.tier_name,
      free: data.free_credits,
      paid: data.paid_credits,
      total: data.total_credits,
      premium: data.premium_unlocked,
      userName: extractedName,
    });
    } catch (err: any) {
      console.error('❌ Failed to fetch balance:', err);
      setError(err.message || 'Failed to load credits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ✅ DEDUCT CREDITS (Optimistic Update)
   * Call this after TTS, Agent chat, STT, etc.
   */
const deductCredits = useCallback((amount: number, isFromFree: boolean = true) => {
  // Deduct from free first, then paid (matches backend logic)
  let remaining = amount;
  
  setFreeCredits(prev => {
    if (prev >= remaining) {
      remaining = 0;
      return prev - amount;
    } else {
      remaining -= prev;
      return 0;
    }
  });
  
  if (remaining > 0) {
    setPaidCredits(prev => Math.max(0, prev - remaining));
  }
  
  console.log(`💳 Credits deducted: -${amount}`);
}, []);

  /**
   * ✅ ADD CREDITS (for purchases)
   */
const addCredits = useCallback((amount: number) => {
  // Add to paid credits (purchases always go to paid bucket)
  setPaidCredits(prev => {
    const newBalance = prev + amount;
    console.log(`💰 Credits added: +${amount} (${prev} → ${newBalance})`);
    return newBalance;
  });
}, []);
  /**
   * ✅ LOAD BALANCE ON MOUNT
   */
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  /**
   * ✅ AUTO-REFRESH EVERY 5 MINUTES
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshBalance]);

const value: CreditContextType = {
  freeCredits,
  paidCredits,
  totalCredits,
  percentage,
  planTier,
  tierName,
  premiumUnlocked,
  maxAgents,
  agentsUsed,
  maxClones,
  clonesUsed,
  isLoading,
  error,
  refreshBalance,
  deductCredits,
  addCredits,
  userName,
  userEmail
};
  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
}

// ========== CUSTOM HOOK ==========
export function useCreditBalance() {
  const context = useContext(CreditContext);
  
  if (context === undefined) {
    throw new Error('useCreditBalance must be used within a CreditProvider');
  }
  
  return context;
}