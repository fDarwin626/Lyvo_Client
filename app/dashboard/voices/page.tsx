"use client";

import { useEffect, useState } from 'react';
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
  const [playingVoice, setPlayingVoice] = useState<Voices | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredVoices(voices);
    } else {
      setFilteredVoices(voices.filter(v => v.gender?.toLowerCase() === activeFilter));
    }
  }, [activeFilter, voices]);

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-20 px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Voice Library</h1>
            <p className="text-gray-600">Browse and preview all available voices</p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Voices ({voices.length})
            </button>
            <button
              onClick={() => setActiveFilter('male')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'male'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Male ({voices.filter(v => v.gender === 'male').length})
            </button>
            <button
              onClick={() => setActiveFilter('female')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'female'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Female ({voices.filter(v => v.gender === 'female').length})
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="bg-background hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center p-4 gap-4">
                    
                    {/* Avatar */}
                    <div 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#43C6AC] to-[#191654] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handlePlaySample(voice)}
                    >
                      {voice.display_name?.charAt(0) || voice.name.charAt(0)}
                    </div>
                    
                    {/* Voice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {voice.display_name || voice.name}
                        </h3>
                        {voice.is_premium && (
                          <span className="text-xs bg-yellow-100 px-2 py-0.2 rounded">
                            <Icon icon="fluent:premium-20-regular" width="20" height="20" className="text-[#D4AF37]" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {voice.description || `A ${voice.gender} voice`}
                      </p>
                    </div>

                    {/* Language Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full capitalize">
                        {voice.language}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {voice.gender}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* 3-Dot Menu */}
                      <div className="relative group">
                        <button 
                          onClick={() => toggleMenu(voice.id)}
                          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <Icon icon="flowbite:dots-vertical-outline" width="24" height="24" className="text-gray-600" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 transition-all z-10 md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible ${
                          openMenuId === voice.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}>
                          <button
                            onClick={() => handleUseVoice(voice.id, 'generate')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="material-symbols-light:bolt-outline" width="24" height="24" />
                            Use for TTS
                          </button>

                          <button
                            onClick={() => handleUseVoice(voice.id, 'audiobook')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="arcticons:audiobookshelf" width="24" height="24" />
                            Use for AudioBook
                          </button>

                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="mdi-light:heart" width="24" height="24" />
                            Add to Favorites
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredVoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No voices found</p>
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