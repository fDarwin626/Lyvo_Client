"use client"
import Marquee from "@/components/Marquee"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Lazy load RippleGrid with no SSR - only for desktop
const RippleGrid = dynamic(() => import('@/components/RippleGrid'), {
  ssr: false,
  loading: () => null
});

const AboutSummary = () => {
  const router = useRouter();
  const [showRipple, setShowRipple] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR
  const rippleRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer - load RippleGrid only when visible AND on desktop
  useEffect(() => {
    // Don't load RippleGrid on mobile at all
    if (isMobile) {
      setShowRipple(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowRipple(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (rippleRef.current) {
      observer.observe(rippleRef.current);
    }

    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <section className="min-h-screen mt-20 flex-col items-center text-center justify-between">

      <div className="flex flex-col items-center justify-center mt-20">
        <h1 className="lg:text-5xl text-3xl font-amiamie font-medium">
          The World Most Innovative Mordern Ai Voice Platform
        </h1>
        <p className="flex text-center justify-center lg:text-2xl mt-5 text-sm font-normal">
          AI voice models and products powering creators, 
          and enterprises. <br />From conversational agents to the leading AI
          voice generator for voiceovers and audiobooks.
        </p>
      </div>

      <div className="relative w-full h-[500px] mt-20">
        {/* Background Layer */}
        <div ref={rippleRef} className="absolute inset-0">
          
          {/* Wave Image - Mobile only */}
          {isMobile && (
            <div className="absolute inset-0">
              <Image
                src="/images/wave.png"
                alt="Background wave"
                fill
                className="object-cover object-center opacity-30 pointer-events-none"
                priority
                loading="eager"
                quality={75}
                sizes="100vw"
              />
            </div>
          )}

          {/* RippleGrid - Desktop only */}
          {!isMobile && showRipple && (
            <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                <RippleGrid
                  enableRainbow={false}
                  gridColor="#3b82f6"
                  rippleIntensity={0.05}
                  gridSize={10}
                  gridThickness={15}
                  mouseInteraction={true}
                  mouseInteractionRadius={1.2}
                  opacity={0.8}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-2xl md:text-6xl lg:font-semibold 
           text-gray-950 text-center mb-8 font-amiamie font-bold">
            Experience our full audio platform,<br />
            Get Started today
          </h1>
          
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/auth/signup')}
              className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-100 transition 
              hover:text-black active:scale-95">
              Get Started
            </button>
            
            <button
              onClick={() => router.push("/documentation")}
              className="px-8 py-3 bg-transparent border-2 border-black
              text-black rounded-full font-semibold hover:bg-black hover:text-white transition active:scale-95">
              Learn More
            </button>
          </div>
        </div>
      </div>

    </section>
  )
}

export default AboutSummary