"use client";

import { Icon } from '@iconify/react';
import { useState, useRef, useEffect } from 'react';

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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background 
    px-6 py-3 flex items-center gap-4 z-50 animate-fade-in">
      <audio ref={audioRef} src={`http://127.0.0.1:8000${audioUrl}`} />
      
      {/* Voice Name */}
      <span className="text-2xl  font-amiamie font-medium text-gray-900">{voiceName}</span>
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
        {isPlaying ? (
            <Icon icon="game-icons:pause-button" width="15" height="12"  className="text-[#ffffff]" />
        ) : (
            <Icon icon="gridicons:play" width="24" height="24"  className="text-white" />
        )}
      </button>
      
      {/* Time Display */}
      <span className="text-xs text-gray-600 font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}