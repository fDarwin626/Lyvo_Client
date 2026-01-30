"use client"
import Marquee from "@/components/Marquee"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Lazy load RippleGrid with no SSR
const RippleGrid = dynamic(() => import('@/components/RippleGrid'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 animate-pulse" />
});

const AboutSummary = () => {
  const router = useRouter();
  const [showRipple, setShowRipple] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rippleRef = useRef<HTMLDivElement>(null);


  // Check if mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer - load RippleGrid only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowRipple(true);
          observer.disconnect(); // Load once and stop observing
        }
      },
      { threshold: 0.1 }
    );

    if (rippleRef.current) {
      observer.observe(rippleRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
        {/* RippleGrid Background */}
        <div ref={rippleRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
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
            
            <Image
              src="/images/wave.png"
              alt="Background"
              fill
              className="object-cover object-center lg:opacity-30 -mt-20 "
              priority
            />
            {showRipple && (
              <div ref={rippleRef} className="absolute inset-0">
                <RippleGrid />
              </div>
            )}
          </div>
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
              hover:text-black">
              Get Started
            </button>
            
            <button
              onClick={() => router.push("/documentation")}
              className="px-8 py-3 bg-transparent border-2 border-black
              text-black rounded-full font-semibold hover:bg-black hover:text-white transition">
              Learn More
            </button>
          </div>
        </div>
      </div>

    </section>
  )
}

export default AboutSummary