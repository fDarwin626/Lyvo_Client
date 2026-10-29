"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVoices, Voices, getToken, generateSpeech, getAudioUrl } from '@/lib/api';
import Link from 'next/link';
import { useGeneration } from '@/app/contexts/GenerationContext';

// Static "resting" waveform — varied bar heights, no animation.
// Doubles as the button icon and as the visual motif for the whole page.
const IDLE_BAR_HEIGHTS = [6, 12, 8, 16, 10];

function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {IDLE_BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current ${active ? 'animate-waveform-bar' : ''}`}
          style={{
            height: active ? undefined : `${h}px`,
            animationDelay: active ? `${i * 0.12}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}

function ArrowDown() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v13m0 0l-5-5m5 5l5-5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [voices, setVoices] = useState<Voices[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voices | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const { activeGeneration, beginTracking, clearGeneration } = useGeneration();

  const isThisGeneration = activeGeneration?.kind === 'tts';
  const isProcessing = isThisGeneration && activeGeneration?.state === 'processing';
  const isCompleted = isThisGeneration && activeGeneration?.state === 'completed';
  const isFailed = isThisGeneration && activeGeneration?.state === 'failed';
  const generatedAudioUrl = isCompleted && activeGeneration?.audioUrl ? getAudioUrl(activeGeneration.audioUrl) : null;
  const generationPercent = activeGeneration?.totalChunks && activeGeneration?.currentChunk != null
    ? (activeGeneration.currentChunk / activeGeneration.totalChunks) * 100
    : 12;

  useEffect(() => {
    async function loadVoices() {
      try {
        const data = await getVoices();
        setVoices(data);

        const voiceId = searchParams.get('voice');
        if (voiceId) {
          const voice = data.find(v => v.id === voiceId);
          if (voice) setSelectedVoice(voice);
        } else if (data.length > 0) {
          setSelectedVoice(data[0]);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      }
    }

    loadVoices();
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Enter text before generating.');
      return;
    }

    if (!selectedVoice) {
      setError('Select a voice before generating.');
      return;
    }

    setError('');

    try {
      const result = await generateSpeech(text, selectedVoice.id);
      beginTracking(result.id, 'tts', result.credit_used);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    }
  };

  const characterCount = text.length;
  const maxCharacters = 5000;
  const nearLimit = characterCount > maxCharacters * 0.9;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-16 sm:pt-20 px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <header className="mb-10 sm:mb-14 pb-6 sm:pb-8 border-b border-default">
            <p className="font-[ArchivoBlack] text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted mb-3">
              Text to speech
            </p>
            <h1 className="font-amiamie text-3xl sm:text-4xl lg:text-5xl text-primary">
              Generate speech
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">

            {/* Voice rail */}
            <aside className="lg:border-r border-default lg:pr-8">
              <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
                Voice
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent flex items-center justify-center text-accent font-[ArchivoBlack] text-xs flex-shrink-0">
                  {selectedVoice?.display_name?.charAt(0)?.toUpperCase() || '—'}
                </div>
                <div className="min-w-0">
                  <p className="text-primary text-sm font-medium truncate">
                    {selectedVoice?.display_name || selectedVoice?.name || 'No voice selected'}
                  </p>
                  <p className="text-xs text-muted capitalize truncate">
                    {selectedVoice?.gender} · {selectedVoice?.language}
                  </p>
                </div>
              </div>

              <Link
                href="voices"
                className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
              >
                Change voice
                <ArrowRight />
              </Link>
            </aside>

            {/* Manuscript */}
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here…"
                maxLength={maxCharacters}
                className="w-full h-56 sm:h-64 bg-transparent text-primary placeholder:text-muted text-base leading-relaxed resize-none focus:outline-none border-b border-default pb-4"
              />

              <div className="flex justify-between items-baseline mt-3 mb-8">
                <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted">
                  {characterCount} / {maxCharacters}
                </p>
                {nearLimit && (
                  <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-danger">
                    Approaching limit
                  </p>
                )}
              </div>

              {/* Validation error */}
              {error && (
                <div className="mb-6 pt-4 border-t border-danger">
                  <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-danger mb-1">
                    Error
                  </p>
                  <p className="text-sm text-secondary">{error}</p>
                </div>
              )}

              {/* Failed generation */}
              {isFailed && (
                <div className="mb-6 pt-4 border-t border-danger flex items-start justify-between gap-4">
                  <div>
                    <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-danger mb-1">
                      Generation failed
                    </p>
                    <p className="text-sm text-secondary">{activeGeneration?.error || 'Something went wrong.'}</p>
                  </div>
                  <button
                    onClick={clearGeneration}
                    className="text-xs text-muted hover:text-primary underline decoration-border underline-offset-4 flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Generate */}
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !text.trim() || !selectedVoice}
                className="w-full py-4 bg-invert text-invert font-medium text-sm tracking-wide flex items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:bg-border disabled:text-muted disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                <Waveform active={!!isProcessing} />
                {isProcessing ? 'Generating' : 'Generate speech'}
              </button>

              {isProcessing && (
                <div className="mt-4">
                  <div className="h-[2px] bg-border relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                      style={{ width: `${generationPercent}%` }}
                    />
                  </div>
                  {activeGeneration?.totalChunks != null && (
                    <p className="font-[ArchivoBlack] text-[10px] tracking-[0.15em] uppercase text-muted mt-2">
                      Chunk {activeGeneration.currentChunk} / {activeGeneration.totalChunks}
                    </p>
                  )}
                </div>
              )}

              {/* Completed */}
              {generatedAudioUrl && (
                <div className="mt-10 pt-8 border-t border-default">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-[ArchivoBlack] text-[10px] tracking-[0.2em] uppercase text-accent">
                      Ready
                    </p>
                    <button
                      onClick={clearGeneration}
                      aria-label="Dismiss"
                      className="text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <audio controls className="w-full mb-4" style={{ accentColor: 'rgb(var(--accent))' }}>
                    <source src={generatedAudioUrl} type="audio/wav" />
                    Your browser does not support audio playback.
                  </audio>

                  <a
                    href={generatedAudioUrl}
                    download
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
                  >
                    Download audio
                    <ArrowDown />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GenerateContent />
    </Suspense>
  );
}