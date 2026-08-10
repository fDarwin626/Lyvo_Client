"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { checkGenerationStatus, checkAudiobookStatus } from '@/lib/api';
import { useCreditBalance } from './CreditContext';

type GenerationKind = 'tts' | 'audiobook';
type GenerationState = 'processing' | 'completed' | 'failed';

interface ActiveGeneration {
  id: string;
  kind: GenerationKind;
  state: GenerationState;
  currentChunk: number | null;
  totalChunks: number | null;
  audioUrl: string | null;
  duration: number | null;
  title: string | null;
  error: string | null;
  startedAt: number;
  cost: number;
}

interface GenerationContextType {
  activeGeneration: ActiveGeneration | null;
  beginTracking: (id: string, kind: GenerationKind, cost: number, title?: string) => void;
  clearGeneration: () => void;
}

const STORAGE_KEY = 'lyvo_active_generation';
const POLL_INTERVAL = 4000;

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null);
  const { deductCredits, addCredits } = useCreditBalance();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
// Resume an in-flight job after a full page reload. Note: cost isn't
  // re-deducted here — it was already deducted optimistically when
  // beginTracking first fired, before the reload happened.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { id, kind, title, startedAt, cost } = JSON.parse(saved);
      setActiveGeneration({
        id, kind, title: title ?? null, startedAt,
        cost: cost ?? 0,
        state: 'processing',
        currentChunk: null,
        totalChunks: null,
        audioUrl: null,
        duration: null,
        error: null,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const beginTracking = useCallback((id: string, kind: GenerationKind, cost: number, title?: string) => {
    const startedAt = Date.now();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, kind, title, startedAt, cost }));
    }
    // Deduct immediately — this mirrors the backend placing a hold at
    // the same moment. If the generation fails, we add it back below.
    deductCredits(cost);
    setActiveGeneration({
      id, kind, startedAt, cost,
      title: title ?? null,
      state: 'processing',
      currentChunk: null,
      totalChunks: null,
      audioUrl: null,
      duration: null,
      error: null,
    });
  }, [deductCredits]);
  const clearGeneration = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    setActiveGeneration(null);
  }, []);

  useEffect(() => {
    if (!activeGeneration || activeGeneration.state !== 'processing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const poll = async () => {
      try {
          if (activeGeneration.kind === 'tts') {
          const status = await checkGenerationStatus(activeGeneration.id);
          if (status.status === 'completed') {
            // Already deducted optimistically in beginTracking — the
            // backend's real charge happened too, but the frontend
            // balance shouldn't move twice for one generation.
            if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
            setActiveGeneration(prev => prev && {
              ...prev, state: 'completed',
              audioUrl: status.audio_url, duration: status.duration,
              currentChunk: status.total_chunks, totalChunks: status.total_chunks,
            });
          } else if (status.status === 'failed') {
            // Backend released its hold — put the visual balance back too
            addCredits(activeGeneration.cost);
            if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
            setActiveGeneration(prev => prev && { ...prev, state: 'failed', error: 'Generation failed' });
          } else {           
            setActiveGeneration(prev => prev && {
              ...prev, currentChunk: status.current_chunk, totalChunks: status.total_chunks,
            });
          }
          } else {
          const status = await checkAudiobookStatus(activeGeneration.id);
          if (status.status === 'completed') {
            // Already deducted optimistically in beginTracking
            if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
            setActiveGeneration(prev => prev && {
              ...prev, state: 'completed',
              audioUrl: status.audio_url, duration: status.duration,
              title: status.title ?? prev.title,
              currentChunk: status.total_chunks, totalChunks: status.total_chunks,
            });
          } else if (status.status === 'failed') {
            // Backend released its hold — put the visual balance back too
            addCredits(activeGeneration.cost);
            if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
            setActiveGeneration(prev => prev && { ...prev, state: 'failed', error: 'Audiobook generation failed' });
          } else {

            setActiveGeneration(prev => prev && {
              ...prev, currentChunk: status.current_chunk, totalChunks: status.total_chunks,
            });
          }
        }
      } catch (err) {
        console.error('Generation poll failed:', err);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGeneration?.id, activeGeneration?.state, activeGeneration?.kind]);

  return (
    <GenerationContext.Provider value={{ activeGeneration, beginTracking, clearGeneration }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}