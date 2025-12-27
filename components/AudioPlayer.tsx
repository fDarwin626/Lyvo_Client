"use client";

import { Icon } from '@iconify/react';
import { useState, useRef, useEffect } from 'react';
import { getAudioUrl } from '@/lib/api';
interface AudioPlayerProps {
  audioUrl: string;
  voiceName: string;
  onClose: () => void;
}

export default function AudioPlayer({ audioUrl, voiceName, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Auto-play when component mounts
    audio.play();
    setIsPlaying(true);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 
    bg-transparent px-4 sm:px-6 py-3 sm:py-3
    flex items-center justify-center sm:justify-start gap-2 sm:gap-4 z-50 animate-fade-in
    w-[95%] sm:w-auto max-w-md sm:max-w-none">
      <audio ref={audioRef} src={getAudioUrl(audioUrl)} />
      {/* Voice Name */}
      <span className="text-xl sm:text-xl font-amiamie font-medium text-gray-900 truncate sm:flex-initial">
        {voiceName}
      </span>
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 sm:w-10 sm:h-10 bg-black rounded-full 
        flex items-center justify-center flex-shrink-0
        hover:bg-gray-800 transition-colors"
      >
        {isPlaying ? (
          <Icon icon="game-icons:pause-button" width="15" height="15" className="text-white" />
        ) : (
          <Icon icon="gridicons:play" width="20" height="20" className="text-white" />
        )}
      </button>
      
      {/* Time Display */}
      <span className="text-[10px] sm:text-xs text-gray-600 font-mono whitespace-nowrap">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-8 h-8 sm:w-8 sm:h-8 rounded-full flex-shrink-0
        hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}