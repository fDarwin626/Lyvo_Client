"use client"

import { useEffect, useRef, useState } from 'react';

export default function DubbingDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const oopsRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{left: string, top: string, duration: string, delay: string, emoji: string}>>([]);

  useEffect(() => {
    // Generate particles only on client
    const emojis = ['🔨', '🔧', '⚙️', '🏗️', '⚠️'];
    const newParticles = [...Array(15)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${5 + Math.random() * 5}s`,
      delay: `${Math.random() * 2}s`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    }));
    setParticles(newParticles);

    // GSAP-like animations using Web Animations API
    const container = containerRef.current;
    const image = imageRef.current;
    const oops = oopsRef.current;
    const text = textRef.current;

    if (!container || !image || !oops || !text) return;

    // Screen shake
    container.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(-5px, 5px)' },
      { transform: 'translate(5px, -5px)' },
      { transform: 'translate(-3px, 3px)' },
      { transform: 'translate(3px, -3px)' },
      { transform: 'translate(0, 0)' }
    ], {
      duration: 500,
      easing: 'ease-in-out'
    });

    // OOPS letters explode in
    const oopsLetters = oops.querySelectorAll('span');
    oopsLetters.forEach((letter, i) => {
      const angle = (i * 360) / oopsLetters.length;
      const distance = 300;
      const x = Math.cos(angle * Math.PI / 180) * distance;
      const y = Math.sin(angle * Math.PI / 180) * distance;
      
      letter.animate([
        { 
          transform: `translate(${x}px, ${y}px) rotate(${angle}deg) scale(0)`,
          opacity: 0 
        },
        { 
          transform: 'translate(0, 0) rotate(0deg) scale(1)',
          opacity: 1 
        }
      ], {
        duration: 1000,
        delay: 200 + (i * 100),
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: 'forwards'
      });
    });

    // Image zoom and tilt
    image.animate([
      { 
        transform: 'scale(0.5) rotateX(20deg)',
        opacity: 0,
        filter: 'blur(10px)'
      },
      { 
        transform: 'scale(1) rotateX(0deg)',
        opacity: 1,
        filter: 'blur(0px)'
      }
    ], {
      duration: 1500,
      delay: 1200,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });

    // Typewriter effect with glitch
    const textContent = "This page is Under";
    text.textContent = '';
    text.style.opacity = '1';
    
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < textContent.length) {
        text.textContent += textContent[charIndex];
        
        // Random glitch effect
        if (Math.random() > 0.7) {
          text.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
          text.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
          setTimeout(() => {
            text.style.transform = 'translate(0, 0)';
            text.style.filter = 'hue-rotate(0deg)';
          }, 50);
        }
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    // Mouse/Touch parallax effect
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = ('clientX' in e ? e.clientX : e.touches[0]?.clientX) || 0;
      const y = ('clientY' in e ? e.clientY : e.touches[0]?.clientY) || 0;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;
      
      setMousePos({ x: percentX * 20, y: percentY * 20 });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      clearInterval(typeInterval);
    };
  }, []);

  return (
    <div ref={containerRef} className="p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-screen">

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-20"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `float ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10">
        <h1 
          ref={oopsRef}
          className="text-3xl lg:text-5xl mt-5 text-primary flex flex-wrap justify-center items-center gap-3 font-bold tracking-wide lg:tracking-widest px-4"
        >
          <span className="text-4xl lg:text-6xl font-['ArchivoBlack'] inline-block">O</span>
          <span className="text-4xl lg:text-6xl font-['ArchivoBlack'] inline-block">O</span>
          <span className="text-4xl lg:text-6xl font-['ArchivoBlack'] inline-block">P</span>
          <span className="text-4xl lg:text-6xl font-['ArchivoBlack'] inline-block">S</span>
          <span 
            ref={textRef}
            className="mt-2 lg:mt-10 opacity-0 transition-all duration-200 inline-block text-2xl lg:text-3xl"
          >
          </span>
          <span className="text-4xl lg:text-6xl font-['ArchivoBlack']">construction</span>
        </h1>
        
        <div 
          ref={imageRef}
          className="mt-10 w-full max-w-4xl perspective-1000 opacity-0"
          style={{
            transform: `rotateX(${mousePos.y * 0.1}deg) rotateY(${mousePos.x * 0.1}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <img 
            src="/images/hand-drawn-construction-background.png" 
            alt="Under Construction"
            className="w-full h-96 object-contain drop-shadow-2xl"
          />
        </div>
        
        <div className="text-lg lg:text-sm mt-8 text-center px-4">
          <p>We are working hard to bring this feature soon!</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}