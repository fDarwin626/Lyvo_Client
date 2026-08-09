"use client";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkMode from '@/components/WorkMode';
import { getRandomVoices, Voices, getVoices } from '@/lib/api';
import VoiceCard from '@/components/VoiceCard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AudioPlayer from '@/components/AudioPlayer';
import TopBar from '@/components/Topbar';

export default function DashboardPage() {
  const router = useRouter();
  const [recentVoices, setRecentVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredVoices, setFilteredVoices] = useState<Voices[]>([]);
  const [voices, setVoices] = useState<Voices[]>([]);

  // Audio Player State
  const [playingVoice, setPlayingVoice] = useState<Voices | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

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
    // Fetch random voices for "Recent Voices" section
    async function loadVoices() {
      try {
        const voices = await getRandomVoices(5);
        setRecentVoices(voices);
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVoices();
  }, []);

  const handlePlayVoice = (voice: Voices) => {
    if (!voice.sample_audio_url) {
      alert('Sample not available for this voice');
      return;
    }
    
    setPlayingVoice(voice);
    setShowPlayer(true);
  };

  return (
    <ProtectedRoute>
      {/* Hide TopBar on mobile, show on desktop */}
      <div className="hidden lg:flex flex-1 flex-col">
        <TopBar/>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 lg:mt-15">

        <div className="mb-3 lg:mb-4">
          <WorkMode />
        </div>

         <div className="mb-4 lg:mb-5">
          <p className='text-xs lg:text-sm text-secondary'>Welcome!</p>
          <h2 className="text-2xl lg:text-3xl flex font-amiamie items-center gap-2 font-semibold">
            <span className='text-primary'>Dashboard</span>
          </h2>
        </div>  

        {/* Feature Cards Grid - 3 columns on mobile, 6 on desktop */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-8 lg:mb-12">
          
          {/* Card 1: Instant Speech */}
          <Link href="/dashboard/generate">
            <div className="bg-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-14 sm:h-16 lg:h-20 mb-3 lg:mb-6">
                <div className="absolute top-2 lg:top-4 left-2 lg:left-4 w-8 h-10 sm:w-10 
                sm:h-12 lg:w-14 lg:h-16 bg-blue-50 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:file-document-outline" width="16" height="16" className="sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-blue-400" />
                </div>
                <div className="absolute bottom-0 right-2 lg:right-4 w-8 h-8 sm:w-9 sm:h-9
                 lg:w-12 lg:h-12 bg-blue-500 rounded-full shadow-lg flex items-center justify-center border-2 lg:border-3 border-white">
                  <Icon icon="mdi:account-voice" width="12" height="12" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center pt-2 lg:pt-3">
              <h3 className="text-xs lg:text-sm font-semibold mb-1">Instant speech</h3>
            </div>
          </Link>

          {/* Card 2: Audiobook */}
          <Link href="/dashboard/audiobook">
            <div className="bg-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-14 sm:h-16 lg:h-20 mb-3 lg:mb-6">
                <div className="items-center justify-center">
                  <Icon icon="fxemoji:newspaper" width="60" height="60" className="sm:w-20 sm:h-20 lg:w-[90px] lg:h-[90px]" />
                </div>
                <div className="absolute top-12 sm:top-14 lg:top-17 left-[-4px] lg:left-[-6]
                 w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 bg-indigo-500 border-2 lg:border-3
                  rounded-full shadow-md flex items-center justify-center transform rotate-12 border-white bottom-[-10]">
                  <Icon icon="mdi:book-open-variant" width="10" height="10"
                   className="sm:w-3 sm:h-3 lg:w-[15px] lg:h-[15px] text-white" />
                </div>
                <div className="absolute top-1 lg:top-2 right-3 lg:right-6 w-7 h-7 sm:w-8 sm:h-8 lg:w-11 lg:h-11 bg-red-600 rounded-full shadow-lg flex items-center justify-center border-2 lg:border-3 border-white">
                  <Icon icon="mdi:microphone" width="12" height="12" className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-white" />
                </div>
              </div>
            </div>
            <div className="text-center pt-2 lg:pt-3">
              <h3 className="text-xs lg:text-sm font-semibold mb-1">Audiobook</h3>
            </div>
          </Link>

          {/* Card 3: Lyvo Agents */}
          <Link href="/dashboard/agent-dashboard">
            <div className="bg-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-14 sm:h-16 lg:h-20 mb-3 lg:mb-6">
                <div className="items-center justify-center flex">
                  <Icon icon="noto:optical-disk" width="60" height="60" className="sm:w-20 sm:h-20 lg:w-[90px] lg:h-[90px]" />
                </div>
                <div className="absolute top-1 lg:top-2 right-3 lg:right-6 w-6 h-3 sm:w-7 sm:h-3 lg:w-9 lg:h-4 bg-yellow-400 rounded-lg lg:rounded-xl shadow-md flex items-center justify-center">
                  <Icon icon="mdi:waveform" width="14" height="14" className="sm:w-4 sm:h-4 lg:w-[22px] lg:h-[22px] text-white" />
                </div>
                <div className="absolute bottom-[-8px] lg:bottom-[-10] left-2 lg:left-4 w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 bg-purple-500 rounded-full shadow-lg flex items-center justify-center border-2 lg:border-3 border-white">
                  <Icon icon="mdi:robot-outline" width="16" height="16" className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center pt-2 lg:pt-3">
              <h3 className="text-xs lg:text-sm font-semibold mb-1 text-primary">Lyvo Agents</h3>
            </div>
          </Link>

          {/* Card 4: Voice Swap */}
          <Link href="/dashboard/voice-swap">
            <div className="bg-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-14 sm:h-16 lg:h-20 mb-3 lg:mb-6">
                <div className="absolute top-0 lg:top-1 left-2 lg:left-4 w-16 h-16 sm:w-20 sm:h-20 lg:w-25 lg:h-25 flex items-center justify-center">
                  <Icon icon="token-branded:voice" width="180" height="180" className="sm:w-56 sm:h-56 lg:w-[290px] lg:h-[290px]" />
                </div>
                <div className="absolute bottom-7 sm:bottom-8 lg:bottom-10 right-1 lg:right-2 w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 bg-orange-600 rounded-full shadow-lg flex items-center justify-center border-2 lg:border-3 border-white">
                  <Icon icon="mdi:play-circle" width="10" height="10" className="sm:w-3 sm:h-3 lg:w-[15px] lg:h-[15px] text-white" />
                </div>
                <div className="absolute bottom-[-28px] sm:bottom-[-32px] lg:bottom-[-40] right-16
                 sm:right-20 lg:right-23 w-8 h-6 sm:w-10 
                 sm:h-7 lg:w-12 lg:h-9 flex items-center justify-center">
                  <div className="sm:hidden lg:block opacity-0 lg:opacity-100">
                  <Icon icon="icon-park-outline:music-rhythm" width="34" height="32" 
                  className="sm:w-11 sm:h-10 lg:w-[52px] 
                  lg:h-[48px] text-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center pt-2 lg:pt-3">
              <h3 className="text-xs lg:text-sm font-semibold mb-1">voice Swap</h3>
            </div>
          </Link>

          {/* Card 5: Dubbed Video */}
          <Link href="/dashboard/dubbing">
            <div className="bg-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-14 sm:h-16 lg:h-20 mb-3 lg:mb-6">
                <div className="absolute top-2 lg:top-4 right-1 lg:right-2 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-amber-400 rounded-lg lg:rounded-xl shadow-md flex items-center justify-center transform -rotate-6">
                  <Icon icon="mdi:account" width="18" height="18" className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div className="absolute bottom-1 lg:bottom-2 left-1 lg:left-2 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-teal-500 rounded-full shadow-lg flex items-center justify-center border-2 lg:border-3 border-white">
                  <Icon icon="mdi:video" width="12" height="12" className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-white" />
                </div>
                <div className="absolute top-5 sm:top-6 lg:top-8 left-5 sm:left-6 lg:left-8 w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 bg-green-400 rounded-full shadow-sm flex items-center justify-center border-2 border-white">
                  <Icon icon="mdi:translate" width="10" height="10" className="sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center pt-2 lg:pt-3">
              <h3 className="text-xs lg:text-sm font-semibold mb-1">Dubbed video</h3>
            </div>
          </Link>

          {/* Card 6: Empty slot for symmetry on mobile */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Recent Voices & Create or Clone sections - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 px-3 lg:px-0">
        
        {/* LEFT SIDE - Recent Voices */}
        <div className="bg-background p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">Recent Voices</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 lg:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 lg:h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-1">
              {recentVoices.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  onPlay={() => handlePlayVoice(voice)}
                />
              ))}
            </div>
          )}
          <Link href="/dashboard/voices">
            <button className="mt-4 lg:mt-6 w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-xs lg:text-sm font-medium">
              Explore Library
            </button>
          </Link>
        </div>

        {/* RIGHT SIDE - Create or Clone */}
        <div className="bg-background p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">Create or clone a voice</h2>
          <div className="space-y-3 lg:space-y-4">
            
            {/*Clone Your Voice */} 
            <Link href="/dashboard/voice-cloning">
              <div className="flex items-center mb-4 lg:mb-5 gap-3 lg:gap-4 p-3 lg:p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                <div className="w-10 h-10 lg:w-12 lg:h-12  bg-teal-500 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 group-hover:text-blue-600"> Clone your Voice</h3>
                  <p className="text-xs lg:text-sm text-gray-600"> Create a realistic digital clone of your voice</p>
                </div>
              </div>
            </Link>

            {/*Voice Design*/}
            <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 lg:w-12 lg:h-12  bg-red-500 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900">Voice Design</h3>
                <p className="text-xs lg:text-sm text-gray-600">Design an entirely new voice from a text prompt </p>
                <span className="text-xs text-gray-500 italic">Coming soon</span>
              </div>
            </div>

            {/* Voice Collections */}
            <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900">Voice Collections</h3>
                <p className="text-xs lg:text-sm text-gray-600">Curated AI voices for every use case</p>
                <span className="text-xs text-gray-500 italic">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player (Bottom Floating) */}
      {showPlayer && playingVoice && playingVoice.sample_audio_url && (
        <AudioPlayer
          audioUrl={playingVoice.sample_audio_url}
          voiceName={playingVoice.display_name || playingVoice.name}
          onClose={() => {
            setShowPlayer(false);
            setPlayingVoice(null);
          }}
        />
      )}
  
    </ProtectedRoute>
  );
} 