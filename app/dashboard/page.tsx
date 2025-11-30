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
      <div className="flex-1 flex flex-col">
      <TopBar/>
      </div>
      <div className="max-w-7xl mx-auto mt-15 ">

        <div className="mb-4">
          <WorkMode />
        </div>

         <div className="mb-5">
             <p className='text-sm text-secondary'>Welcome!</p>
            <h2 className="text-3xl flex font-amiamie items-center gap-2 font-semibold">
             <span className='text-primary'>Dashboard</span>
 
           </h2>
          </div>  


{/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          
          {/* Card 1: Instant Speech */}
          <Link href="/dashboard/generate">
            <div className="bg-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer">
              {/* Icon illustration container */}
              <div className="relative w-full h-20 mb-6">
                {/* Icon 1 - Document */}
                <div className="absolute top-4 left-4 w-14 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:file-document-outline" width="28" height="28" className="text-blue-400" />
                </div>
                {/* Icon 2 - Speaker circle */}
                <div className="absolute bottom-0 right-4 w-12 h-12 bg-blue-500 rounded-full shadow-lg flex items-center justify-center border-3 border-white">
                  <Icon icon="mdi:account-voice" width="20" height="20" className="text-white" />
                </div>
              </div>
              
            </div>
              {/* Text content - centered */}
              <div className="text-center pt-3">
                <h3 className="text-sm font-semibold mb-1">Instant speech</h3>
              </div>
    
          </Link>

          {/* Card 2: Audiobook */}
          <Link href="/dashboard/audiobook">
            <div className="bg-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-20 mb-6">
                 <div className="items-center justify-center">
                        <Icon icon="fxemoji:newspaper" width="90" height="" />
                </div>

                <div className="absolute top-17 left-[-6] w-9 h-9 bg-indigo-500  border-3
                 rounded-full shadow-md flex items-center justify-center transform rotate-12
                 border-white bottom-[-10]">
                  <Icon icon="mdi:book-open-variant" width="15" height="15" className="text-white" />
                </div>
                <div className="absolute top-2 right-6 w-11 h-11 bg-red-600 rounded-full shadow-lg 
                flex items-center justify-center border-3 border-white">
                  <Icon icon="mdi:microphone" width="18" height="18" className="text-white" />
                </div>
              </div>
            </div>
               <div className="text-center pt-3">
                <h3 className="text-sm font-semibold mb-1">Audiobook</h3>
              </div>
           
          </Link>


          {/* Card 4: Lyvo Agents */}
          <Link href="/dashboard/agents">
            <div className="bg-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-20 mb-6">
                <div className="items-center justify-center flex">
                  <Icon icon="noto:optical-disk" width="90" height="90" />
                </div>
                <div className="absolute top-2 right-6 w-9 h-4 bg-yellow-400 rounded-xl shadow-md flex items-center justify-center">
                  <Icon icon="mdi:waveform" width="22" height="22" className="text-white" />
                </div>
                <div className="absolute bottom-[-10] left-4 w-9 h-9 bg-purple-500 rounded-full shadow-lg flex items-center justify-center border-3 border-white">
                  <Icon icon="mdi:robot-outline" width="24" height="24" className="text-white" />
                </div>
              </div>
            </div>
              <div className="text-center pt-3">
                <h3 className="text-sm font-semibold mb-1 text-primary">Lyvo Agents</h3>
              </div>

          </Link>

          {/* Card 5: Voice Swap */}
          <Link href="/dashboard/music">
            <div className="bg-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-20 mb-6">
                <div className="absolute top-1 left-4 w-25 h-25 flex items-center justify-center">
                  <Icon icon="token-branded:voice" width="290" height="290" />
                </div>
                <div className="absolute bottom-10 right-2 w-9 h-9 bg-orange-600 rounded-full shadow-lg flex items-center justify-center border-3 border-white">
                  <Icon icon="mdi:play-circle" width="15" height="15" className="text-white" />
                </div>
                <div className="absolute bottom-[-40] right-23 w-12 h-9 flex items-center justify-center">
                   <Icon icon="icon-park-outline:music-rhythm" width="52" height="48"  className="text-[#D4AF37]" />
               </div>
              </div>
            </div>
              <div className="text-center pt-3">
                <h3 className="text-sm font-semibold mb-1">voice Swap</h3>
              </div>

          </Link>

          {/* Card 6: Dubbed Video */}
          <Link href="/dashboard/dubbing">
            <div className="bg-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="relative w-full h-20 mb-6">
                <div className="absolute top-4 right-2 w-16 h-16 bg-amber-400 rounded-xl shadow-md flex items-center justify-center transform -rotate-6">
                  <Icon icon="mdi:account" width="28" height="28" className="text-white" />
                </div>
                <div className="absolute bottom-2 left-2 w-10 h-10 bg-teal-500 rounded-full shadow-lg flex items-center justify-center border-3 border-white">
                  <Icon icon="mdi:video" width="18" height="18" className="text-white" />
                </div>
                <div className="absolute top-8 left-8 w-9 h-9 bg-green-400 rounded-full shadow-sm flex items-center justify-center border-2 border-white">
                  <Icon icon="mdi:translate" width="16" height="16" className="text-white" />
                </div>
              </div>
            </div>
              <div className="text-center pt-3">
                <h3 className="text-sm font-semibold mb-1">Dubbed video</h3>
              </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT SIDE - Recent Voices */}
      <div className="bg-background p-6">
           <h2 className="text-xl font-bold mb-4">Recent Voices</h2>
          {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
          ): (
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
           <Link href="\dashboard\voices">
                <button className="mt-6 w-50 py-2 border border-gray-300 rounded-full
                 hover:bg-gray-100 transition-colors text-sm font-medium">
                  Explore Library
                </button>
              </Link>
      </div>

              {/* RIGHT SIDE - Create or Clone */}
            <div className="bg-background p-6">
              <h2 className="text-xl font-bold mb-4">Create or clone a voice</h2>
              <div className="space-y-4">
                {/* Voice Design */} 
                <Link href="/generate">
                  <div className="flex items-center  mb-5 gap-4 p-4 border border-gray-200 rounded-xl
                   hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Voice Design</h3>
                      <p className="text-sm text-gray-600">Design an entirely new voice from a text prompt</p>
                    </div>
                  </div>
                </Link>

                {/* Clone Your Voice */}
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                  <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Clone your Voice</h3>
                    <p className="text-sm text-gray-600">Create a realistic digital clone of your voice</p>
                    <span className="text-xs text-gray-500 italic">Coming soon</span>
                  </div>
                </div>

                {/* Voice Collections */}
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Voice Collections</h3>
                    <p className="text-sm text-gray-600">Curated AI voices for every use case</p>
                    <span className="text-xs text-gray-500 italic">Coming soon</span>
                  </div>
             </div>
            </div>
              
        </div>
     </div>


         {/* ADD THIS - Audio Player (Bottom Floating) */}
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