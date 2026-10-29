"use client";

import { Voices } from '@/lib/api';
import { Icon } from '@iconify/react';

interface VoiceCardProps {
  voice: Voices;
  isPlaying?: boolean;
  onPlay?: () => void;
}

export default function VoiceCard({ voice, isPlaying, onPlay }: VoiceCardProps) {
  return (
    <div className="border-b border-default transition-colors hover:bg-surface">
      <div className="flex items-center p-3 sm:p-4 gap-3 sm:gap-4">

        {/* Avatar / play control */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
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
      </div>
    </div>
  );
}