"use client";

import { Voices } from '@/lib/api';

interface VoiceCardProps {
  voice: Voices;
  onPlay?: () => void;
}

export default function VoiceCard({ voice, onPlay }: VoiceCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 
    rounded-lg transition-colors cursor-pointer group">
      {/* Voice Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br
       from-[#43C6AC] to-[#191654]
        flex items-center justify-center text-white font-amiamie
         flex-shrink-0 uppercase">
        {voice.display_name?.charAt(0) || voice.name.charAt(0)}
      </div>
      
      {/* Voice Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className=" text-sm text-gray-900
           font-amiamie-round truncate font-normal">
            {voice.display_name || voice.name}
          </h3>
          {voice.is_premium && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
              Premium
            </span>
          )}
        </div>
        
        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
          {voice.description || `${voice.gender} voice`}
        </p>
      </div>

      {/* Play Button (on the right side) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay?.();
        }}
        className="text-xs text-black hover:text-blue-700 font-medium 
         border  border-gray-500 rounded-full py-2 px-4 opacity-0
          group-hover:opacity-100 transition-opacity "
      >
        view
      </button>
    </div>
  );
}