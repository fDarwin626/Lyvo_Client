"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVoices, Voices } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import { Icon } from '@iconify/react';

export default function VoicesPage() {
  const router = useRouter();
  const [voices, setVoices] = useState<Voices[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoice, setPlayingVoice] = useState<Voices | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadVoices() {
      try {
        const data = await getVoices();
        setVoices(data);
        setFilteredVoices(data);
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVoices();
  }, []);

  // Gender filter + name search combined, same source of truth as before
  useEffect(() => {
    let result = voices;

    if (activeFilter !== 'all') {
      result = result.filter(v => v.gender?.toLowerCase() === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(v =>
        (v.display_name || v.name).toLowerCase().includes(q)
      );
    }

    setFilteredVoices(result);
  }, [activeFilter, voices, searchQuery]);

  const handlePlaySample = (voice: Voices) => {
    if (!voice.sample_audio_url) {
      alert('Sample not available for this voice');
      return;
    }

    setPlayingVoice(voice);
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setPlayingVoice(null);
  };

  const handleUseVoice = (voiceId: string, route: string) => {
    router.push(`${route}?voice=${voiceId}`);
    setOpenMenuId(null);
  };

  const toggleMenu = (voiceId: string) => {
    setOpenMenuId(openMenuId === voiceId ? null : voiceId);
  };

  const maleCount = voices.filter(v => v.gender === 'male').length;
  const femaleCount = voices.filter(v => v.gender === 'female').length;

  const filterOptions = [
    { key: 'all', label: 'All voices', count: voices.length },
    { key: 'male', label: 'Male', count: maleCount },
    { key: 'female', label: 'Female', count: femaleCount },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Voice library</p>
            <h1 className="font-[ArchivoBlack] text-3xl sm:text-4xl text-primary tracking-tight mb-1">
              Voices
            </h1>
            <p className="text-secondary text-sm">Browse and preview every available voice.</p>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2 mb-6 pb-5 border-b border-default">
            {/* Search */}
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
                width="16"
                height="16"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voices by name"
                className="w-full h-10 pl-10 pr-9 text-sm bg-surface border border-default rounded-full text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  <Icon icon="mdi:close" width="14" height="14" />
                </button>
              )}
            </div>

            {/* Filters button + popover */}
            <div className="relative flex-shrink-0" ref={filterRef}>
              <button
                onClick={() => setShowFilterMenu(prev => !prev)}
                className={`h-10 px-4 flex items-center gap-2 rounded-full border text-sm font-medium transition-colors ${
                  showFilterMenu
                    ? 'border-accent text-accent'
                    : activeFilter !== 'all'
                    ? 'border-[rgb(var(--text-primary))] text-primary'
                    : 'border-default text-secondary hover:text-primary hover:border-[rgb(var(--text-primary))]'
                }`}
              >
                <Icon icon="mdi:tune-variant" width="16" height="16" />
                Filters
                {activeFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>

              {showFilterMenu && (
                <>
                  {/* click-outside catcher */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 top-12 z-20 w-52 bg-surface border border-default rounded-xl shadow-sm py-1.5">
                    <p className="px-4 pt-1.5 pb-2 text-[10px] tracking-[0.15em] uppercase text-muted">
                      Gender
                    </p>
                    {filterOptions.map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveFilter(key);
                          setShowFilterMenu(false);
                        }}
                        className="w-full px-4 py-2 flex items-center justify-between gap-3 text-sm hover:bg-background transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              activeFilter === key ? 'border-accent' : 'border-default'
                            }`}
                          >
                            {activeFilter === key && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            )}
                          </span>
                          <span className={activeFilter === key ? 'text-primary font-medium' : 'text-secondary'}>
                            {label}
                          </span>
                        </span>
                        <span className="text-muted text-xs">{count}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-b border-default py-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-surface border border-default"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-surface border border-default rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-surface border border-default rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {filteredVoices.map((voice) => {
                const isPlaying = showPlayer && playingVoice?.id === voice.id;
                return (
                  <div
                    key={voice.id}
                    className="border-b border-default transition-colors hover:bg-surface"
                  >
                    <div className="flex items-center p-3 sm:p-4 gap-3 sm:gap-4">

                      {/* Avatar / play control */}
                      <button
                        onClick={() => handlePlaySample(voice)}
                        className={`relative w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 font-[ArchivoBlack] text-sm transition-colors ${
                          isPlaying
                            ? 'border-accent text-accent'
                            : 'border-default text-primary hover:border-accent hover:text-accent'
                        }`}
                        title="Play sample"
                      >
                        {isPlaying ? (
                          <Icon icon="mdi:volume-high" width="18" height="18" />
                        ) : (
                          voice.display_name?.charAt(0) || voice.name.charAt(0)
                        )}
                      </button>

                      {/* Voice Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-primary text-sm truncate">
                            {voice.display_name || voice.name}
                          </h3>
                          {voice.is_premium && (
                            <span className="text-[10px] tracking-wide uppercase text-accent border border-accent rounded-full px-2 py-[1px] flex-shrink-0">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary truncate">
                          {voice.description || `A ${voice.gender} voice`}
                        </p>
                      </div>

                      {/* Language / gender tags */}
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] tracking-wide uppercase text-muted border border-default rounded-full px-3 py-1 capitalize">
                          {voice.language}
                        </span>
                        <span className="text-[11px] tracking-wide uppercase text-muted capitalize">
                          {voice.gender}
                        </span>
                      </div>

                      {/* 3-Dot Menu */}
                      <div className="relative group flex-shrink-0">
                        <button
                          onClick={() => toggleMenu(voice.id)}
                          className="w-9 h-9 rounded-full hover:bg-background border border-transparent hover:border-default flex items-center justify-center transition-colors"
                        >
                          <Icon icon="flowbite:dots-vertical-outline" width="18" height="18" className="text-secondary" />
                        </button>

                        <div className={`absolute right-0 top-11 bg-surface border border-default rounded-xl shadow-sm py-1.5 w-48 transition-all z-10 md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible ${
                          openMenuId === voice.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}>
                          <button
                            onClick={() => handleUseVoice(voice.id, 'generate')}
                            className="w-full px-4 py-2 text-left text-sm text-secondary hover:text-primary hover:bg-background flex items-center gap-2 transition-colors"
                          >
                            <Icon icon="material-symbols-light:bolt-outline" width="18" height="18" />
                            Use for TTS
                          </button>

                          <button
                            onClick={() => handleUseVoice(voice.id, 'audiobook')}
                            className="w-full px-4 py-2 text-left text-sm text-secondary hover:text-primary hover:bg-background flex items-center gap-2 transition-colors"
                          >
                            <Icon icon="arcticons:audiobookshelf" width="18" height="18" />
                            Use for audiobook
                          </button>

                          <button
                            className="w-full px-4 py-2 text-left text-sm text-secondary hover:text-primary hover:bg-background flex items-center gap-2 transition-colors"
                          >
                            <Icon icon="mdi-light:heart" width="18" height="18" />
                            Add to favorites
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredVoices.length === 0 && (
            <div className="border border-default py-16 px-6 text-center mt-2">
              <svg width="64" height="20" viewBox="0 0 64 20" className="mx-auto mb-5 opacity-40">
                <line x1="0" y1="10" x2="64" y2="10" stroke="rgb(var(--text-muted))" strokeWidth="2" />
              </svg>
              <h3 className="font-[ArchivoBlack] text-lg text-primary mb-2">No voices found</h3>
              <p className="text-secondary text-sm max-w-xs mx-auto">
                {searchQuery
                  ? `Nothing matches "${searchQuery}". Try a different name or clear the search.`
                  : 'Try a different filter.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audio Player (Bottom Floating) */}
      {showPlayer && playingVoice && playingVoice.sample_audio_url && (
        <AudioPlayer
          audioUrl={playingVoice.sample_audio_url}
          voiceName={playingVoice.display_name || playingVoice.name}
          onClose={handleClosePlayer}
        />
      )}
    </ProtectedRoute>
  );
}