"use client"

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function VoiceSwapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [scrambledText, setScrambledText] = useState('');
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    // Auto-play audio on mount
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio autoplay prevented:', err));
    }

    const container = containerRef.current;
    const text = textRef.current;
    const image = imageRef.current;

    if (!container || !text || !image) return;

    // Initial screen glitch/corruption
    const glitchFlash = () => {
      container.style.filter = 'hue-rotate(180deg) saturate(3)';
      container.style.transform = 'translate(10px, -10px)';
      
      setTimeout(() => {
        container.style.filter = 'hue-rotate(0deg) saturate(1)';
        container.style.transform = 'translate(-5px, 5px)';
      }, 50);
      
      setTimeout(() => {
        container.style.filter = '';
        container.style.transform = '';
      }, 100);
    };

    glitchFlash();
    setTimeout(glitchFlash, 200);
    setTimeout(glitchFlash, 400);

    // Text scramble effect
    const originalText = "This feature isn't available yet";
    const chars = 'ABC0DE1FG0HIJKLMNOPQ0RSTUV1WXYZ0123456789!@#$%^&*()';
    let iterations = 0;
    const maxIterations = 30;

    const scrambleInterval = setInterval(() => {
      if (iterations >= maxIterations) {
        setScrambledText(originalText);
        setIsResolved(true);
        clearInterval(scrambleInterval);
        return;
      }

      const scrambled = originalText
        .split('')
        .map((char, index) => {
          if (index < iterations) {
            return originalText[index];
          }
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      setScrambledText(scrambled);
      iterations++;
    }, 50);

    // Image pixelate effect
    let pixelLevel = 20;
    const pixelateInterval = setInterval(() => {
      if (pixelLevel <= 0) {
        clearInterval(pixelateInterval);
        image.style.filter = 'none';
        return;
      }
      image.style.filter = `blur(${pixelLevel}px) contrast(0.5) brightness(1.5)`;
      pixelLevel -= 0.5;
    }, 50);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(pixelateInterval);
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div ref={containerRef} className=" items-center justify-center flex min-h-screen flex-col relative overflow-hidden">
        <div className="flex items-center gap-2">
    </div>
      {/* Scan Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="scanlines"></div>
      </div>

      {/* Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-30">
        <div className="glitch-overlay"></div>
      </div>

      {/* Main Content */}
      <h1 
        ref={textRef}
        className="mt-10 flex font-amiamie text-3xl lg:text-6xl font-extrabold text-center px-4"
        style={{
          textShadow: isResolved 
            ? ''
            : 'none',
          transition: 'text-shadow 0.3s ease'
        }}
      >
        {scrambledText || "This feature isn't available yet"}
      </h1>

      <img 
        ref={imageRef}
        src="/images/flat-engineering-construction.png" 
        alt="Voice Swap Coming Soon" 
        className="mt-10 w-96 lg:w-[800px] h-auto"
        style={{
          filter: 'blur(20px) contrast(0.5) brightness(1.5)',
        }}
      />

      <p 
        className="text-sm mt-6"
        style={{
          color: 'gray-400',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      >
        We are working hard to bring this feature soon!
      </p>

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes glitch-anim {
          0% { 
            clip-path: inset(40% 0 61% 0);
            transform: translate(0);
          }
          20% {
            clip-path: inset(92% 0 1% 0);
            transform: translate(-5px, 5px);
          }
          40% {
            clip-path: inset(43% 0 1% 0);
            transform: translate(5px, -5px);
          }
          60% {
            clip-path: inset(25% 0 58% 0);
            transform: translate(-5px, -5px);
          }
          80% {
            clip-path: inset(54% 0 7% 0);
            transform: translate(5px, 5px);
          }
          100% {
            clip-path: inset(58% 0 43% 0);
            transform: translate(0);
          }
        }

        .scanlines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 200%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 255, 0.1) 0px,
            transparent 1px,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 3px
          );
          animation: scanline 8s linear infinite;
        }

        .glitch-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 0, 255, 0.3) 0%,
            rgba(0, 255, 255, 0.3) 50%,
            rgba(0, 255, 0, 0.3) 100%
          );
          animation: glitch-anim 3s infinite;
          opacity: 0.3;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}