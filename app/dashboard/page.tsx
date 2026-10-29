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

const featureCards = [
  { href: '/dashboard/generate', label: 'Instant speech', icon: 'mdi:waveform' },
  { href: '/dashboard/audiobook', label: 'Audiobook', icon: 'simple-icons:audiobookshelf' },
  { href: '/dashboard/agent-dashboard', label: 'Lyvo Agents', icon: 'dinkie-icons:android' },
  { href: '/dashboard/media', label: 'Devox Library', icon: 'arcticons:cinema-pro' },
  { href: '#', label: 'Visage Studio', icon: 'fa6-brands:studiovinari' },
];

const createOrClone = [
  {
    href: '/dashboard/voice-cloning',
    icon: 'mdi:microphone-outline',
    title: 'Clone your voice',
    description: 'Create a realistic digital clone of your voice',
    disabled: false,
  },
  {
    href: '/dashboard/media',
    icon: 'mdi:video-outline',
    title: 'Convert video to MP3',
    description: 'Convert your videos to high-quality MP3 files',
    disabled: false,
  },
  {
    href: null,
    icon: 'mdi:layers-outline',
    title: 'Voice collections',
    description: 'Curated AI voices for every use case',
    disabled: true,
  },
];

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
        <TopBar />
      </div>

      <div className="max-w-7xl mx-auto mt-8 lg:mt-15 px-3 lg:px-0">

        <div className="mb-3 lg:mb-4">
          <WorkMode />
        </div>

        <div className="mb-5 lg:mb-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Overview</p>
          <h2 className="text-2xl lg:text-3xl font-[ArchivoBlack] tracking-tight text-primary">
            Dashboard
          </h2>
        </div>

        {/* Feature Cards Grid - 3 columns on mobile, 6 on desktop */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-10 lg:mb-14">
          {featureCards.map(({ href, label, icon }) => (
            <Link key={href} href={href}>
              <div className="group border border-default rounded-xl lg:rounded-full aspect-square flex flex-col 
              items-center justify-center gap-2 lg:gap-3 p-2 hover:border-[rgb(var(--text-primary))] transition-colors bg-surface">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center group-hover:border-accent transition-colors">
                  <Icon
                    icon={icon}
                    width="18"
                    height="18"
                    className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary group-hover:text-accent transition-colors"
                  />
                </div>
                <h3 className="text-[10px] sm:text-xs lg:text-sm font-medium text-primary text-center leading-tight">
                  {label}
                </h3>
              </div>
            </Link>
          ))}

          {/* Empty slot for symmetry on desktop */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Recent Voices & Create or Clone sections - Stack on mobile */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 px-3 lg:px-0">

        {/* LEFT SIDE - Recent Voices */}
        <div className="bg-background">
          <h2 className="text-base lg:text-lg font-[ArchivoBlack] tracking-tight text-primary mb-4">
            Recent voices
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-default bg-surface"></div>
                  <div className="flex-1">
                    <div className="h-3 lg:h-4 rounded w-3/4 mb-2 border border-default bg-surface"></div>
                    <div className="h-2 lg:h-3 rounded w-full border border-default bg-surface"></div>
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
            <button className="mt-4 lg:mt-6 w-full sm:w-auto px-6 h-10 border border-default rounded-full hover:border-[rgb(var(--text-primary))] hover:text-primary text-secondary transition-colors text-xs lg:text-sm font-medium">
              Explore library
            </button>
          </Link>
        </div>

        {/* RIGHT SIDE - Create or Clone */}
        <div className="bg-background">
          <h2 className="text-base lg:text-lg font-[ArchivoBlack] tracking-tight text-primary mb-4">
            Create or clone a voice
          </h2>
          <div className="space-y-3">
            {createOrClone.map(({ href, icon, title, description, disabled }) => {
              const content = (
                <div
                  className={`group flex items-center mb-3.5 gap-3 lg:gap-4 p-3 lg:p-4 border border-default rounded-xl transition-colors ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-[rgb(var(--text-primary))] cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg border border-default flex items-center justify-center flex-shrink-0 transition-colors ${
                      !disabled ? 'group-hover:border-accent' : ''
                    }`}
                  >
                    <Icon
                      icon={icon}
                      width="18"
                      height="18"
                      className={`lg:w-5 lg:h-5 text-primary transition-colors ${
                        !disabled ? 'group-hover:text-accent' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm lg:text-base font-medium text-primary">{title}</h3>
                    <p className="text-xs lg:text-sm text-secondary">{description}</p>
                    {disabled && (
                      <span className="inline-block mt-1.5 text-[10px] tracking-wide uppercase text-muted border border-default rounded-full px-2 py-[1px]">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              );

              return href ? (
                <Link key={title} href={href}>
                  {content}
                </Link>
              ) : (
                <div key={title}>{content}</div>
              );
            })}
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