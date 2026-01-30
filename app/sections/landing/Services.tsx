"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from 'next/image'
import { gsap } from 'gsap'
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

const Services = () => {
  const router = useRouter();

  const servicesData = useMemo(() => [
    {
      id: 0,
      title: "Text-to-Speech (TTS)",
      description: "Transform any text into human-like voices. Clone with a single click to choose from a wide variety of AI-generated audio that sounds naturally alive.",
      image: "/images/Ai_Voice.jpg",
      icon: <Icon icon="mdi:text-to-speech-off" width="24" height="24" />,
    },
    {
      id: 1,
      title: "Speech-to-Text (STT)",
      description: "Convert spoken audio into accurate written transcripts. Perfect for documentation, subtitles, or content repurposing.",
      image: "/images/Educational.jpg",
      icon: <Icon icon="oi:audio" width="28" height="28" />,
    },
    {
      id: 2,
      title: "Audiobook Generation",
      description: "Turn your PDFs, TXT files, and ePUBs into professional audiobooks in minutes. One-Click Text-to-Audio format.",
      image: "/images/content.jpg",
      icon: <Icon icon="mdi:book-open-page-variant-outline" width="28" height="28" />,
    },
    {
      id: 3,
      title: "AI Agent Creation",
      description: "Create custom AI voice agents tailored to your specific needs with a single prompt. Share agents with colleagues via password or secured access.",
      image: "/images/call.jpg",
      icon: <Icon icon="hugeicons:android" width="24" height="24" />,
    },
  ], [])

  // Memoize orbit items to prevent recalculation
  const orbitItems = useMemo(() => 
    [...servicesData, ...servicesData, ...servicesData],
    [servicesData]
  )

  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [rotation, setRotation] = useState(0)
  const orbitRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const detailRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const lastTimeRef = useRef(performance.now())
  const isMobileRef = useRef(false)

  // Check if mobile once and cache it
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768
    
    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Highly optimized continuous rotation using requestAnimationFrame
  useEffect(() => {
    if (selectedService !== null) return

    const rotationSpeed = 0.3
    let frameCount = 0

    const animate = (currentTime: number) => {
      frameCount++
      
      // Only update rotation every frame for smooth 60fps
      if (frameCount % 1 === 0) {
        const deltaTime = currentTime - lastTimeRef.current
        const fps = Math.max(1000 / deltaTime, 1)
        const adjustedSpeed = rotationSpeed * (60 / fps)
        
        setRotation(prev => (prev + adjustedSpeed) % 360)
        lastTimeRef.current = currentTime
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [selectedService])

  // Animate hand on mount - optimized
  useEffect(() => {
    if (handRef.current) {
      gsap.fromTo(handRef.current,
        {
          x: -600,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power3.out",
          delay: 0.5,
          force3D: true,
        }
      )
    }
  }, [])

  // Optimized service click handler
  const handleServiceClick = useCallback((serviceId: number) => {
    if (isAnimating || selectedService !== null) return
    
    setIsAnimating(true)
    setSelectedService(serviceId)

    const targetIndex = orbitItems.findIndex(item => item.id === serviceId)
    const targetElement = itemsRef.current[targetIndex]

    if (targetElement && detailRef.current) {
      const rect = targetElement.getBoundingClientRect()
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      gsap.set(detailRef.current, {
        x: rect.left + rect.width / 2 - centerX,
        y: rect.top + rect.height / 2 - centerY,
        scale: 0.15,
        opacity: 0,
        rotationY: 0,
        rotationZ: Math.random() * 30 - 15,
        force3D: true,
      })

      gsap.to(orbitRef.current, {
        opacity: 0.1,
        scale: 0.9,
        filter: 'blur(10px)',
        duration: 0.6,
        ease: "power2.out",
        force3D: true,
      })

      gsap.to(detailRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        rotationY: 360,
        rotationZ: 0,
        duration: 1.2,
        ease: "power3.out",
        force3D: true,
        onComplete: () => setIsAnimating(false)
      })
    }
  }, [isAnimating, selectedService, orbitItems])

  // Optimized close handler
  const handleClose = useCallback(() => {
    setIsAnimating(true)

    if (detailRef.current) {
      gsap.to(detailRef.current, {
        scale: 0.15,
        opacity: 0,
        rotationY: -360,
        rotationZ: Math.random() * 30 - 15,
        duration: 1,
        ease: "power3.in",
        force3D: true,
        onComplete: () => {
          setSelectedService(null)
          setIsAnimating(false)
        }
      })
    }

    if (orbitRef.current) {
      gsap.to(orbitRef.current, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: "power2.out",
        force3D: true,
      })
    }
  }, [])

  // Memoize orbital calculations
  const getOrbitalTransform = useCallback((index: number) => {
    const angle = (360 / orbitItems.length) * index + rotation
    const radian = (angle * Math.PI) / 180
    
    const radiusX = isMobileRef.current ? 160 : 280
    const radiusY = isMobileRef.current ? 100 : 180
    
    const x = Math.cos(radian) * radiusX
    const y = Math.sin(radian) * radiusY * 0.6
    const z = Math.sin(radian) * radiusY
    
    const scale = 0.5 + (z + radiusY) / (radiusY * 2) * 0.7
    const opacity = 0.3 + (z + radiusY) / (radiusY * 2) * 0.7

    return { x, y, z, scale, opacity }
  }, [rotation, orbitItems.length])

  return (
  <section className="relative min-h-screen py-20 pb-64 lg:py-50 lg:pb-96 overflow-hidden flex flex-col items-center justify-center">
      
      {/* Header */}
      <div className="text-center mb-16 lg:mb-20 z-10 px-4">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-current/20 text-sm font-medium tracking-wider backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            EXPLORE OUR SERVICES
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 tracking-tight">
          What You'll Get
        </h1>
        
        <p className="text-base lg:text-xl max-w-2xl mx-auto opacity-70 font-light">
          Click a service below to explore
        </p>
      </div>

      {/* 3D Orbital Container with Paper Fragments */}
      <div className="relative w-full max-w-[900px] h-[400px] lg:h-[550px] mb-16">
        {/* Animated Hand - Optimized with transform-gpu */}
        <div 
          ref={handRef}
          className="absolute -bottom-80 left-0 w-full h-full pointer-events-none z-0 transform-gpu
                     lg:-bottom-200 lg:-left-60 lg:w-[120%] lg:h-[120%]"
          style={{ 
            mixBlendMode: 'normal',
          }}
        >
          <div className="relative w-full h-full flex items-end justify-start">
            <div className="relative w-[600px] h-[600px] lg:w-[1200px] lg:h-[1200px]">
              <Image
                src="/images/hand.png"
                alt="Hand"
                fill
                className="object-contain opacity-80 lg:opacity-80 scale-100 lg:scale-[1.3]"
                style={{
                  filter: 'brightness(1.1) contrast(0.9)',
                  mixBlendMode: 'normal',
                }}
                priority
                quality={85}
                sizes="(max-width: 768px) 600px, 1200px"
              />
            </div>
          </div>
        </div>

        <div 
          ref={orbitRef}
          className="absolute inset-0 flex items-center justify-center will-change-transform transform-gpu"
          style={{ perspective: '1500px' }}
        >
          {orbitItems.map((service, index) => {
            const { x, y, z, scale, opacity } = getOrbitalTransform(index)
            const paperRotation = (index * 17) % 360

            return (
              <div
                key={index}
                ref={(el) => { itemsRef.current[index] = el }}
                className="absolute cursor-pointer group will-change-transform transform-gpu"
                style={{
                  transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale}) rotate(${paperRotation}deg)`,
                  opacity: opacity,
                  zIndex: Math.floor(z + (isMobileRef.current ? 100 : 180)),
                  backfaceVisibility: 'hidden',
                }}
                onClick={() => handleServiceClick(service.id)}
              >
                <div 
                  className="relative w-32 h-32 lg:w-40 lg:h-40 transition-all duration-300 group-hover:scale-110"
                  style={{
                    clipPath: 'polygon(15% 5%, 85% 10%, 95% 40%, 90% 85%, 50% 95%, 10% 80%, 5% 35%)',
                  }}
                >
                  <div className="relative w-full h-full overflow-hidden shadow-2xl">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                      quality={80}
                      loading={index < 4 ? "eager" : "lazy"}
                    />
                    
                    <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
                    
                    <div className="absolute inset-0 border-4 border-white/20 group-hover:border-white/50 transition-all pointer-events-none" 
                      style={{
                        clipPath: 'polygon(15% 5%, 85% 10%, 95% 40%, 90% 85%, 50% 95%, 10% 80%, 5% 35%)',
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-4xl lg:text-5xl">{service.icon}</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="absolute inset-0 -z-10 bg-black/30 blur-md pointer-events-none"
                  style={{
                    clipPath: 'polygon(15% 5%, 85% 10%, 95% 40%, 90% 85%, 50% 95%, 10% 80%, 5% 35%)',
                    transform: 'translate(4px, 4px)',
                  }}
                />
              </div>
            )
          })}
          {/* Center Earth guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-32 lg:w-80 lg:h-52 rounded-full border-2 border-dashed border-current/10" />
            <div className="absolute w-24 h-20 lg:w-56 lg:h-36">
              <Image
                src="/images/hero/Icon.png" 
                alt="Earth guide"
                fill
                className="object-contain opacity-80"
                sizes="(max-width: 768px) 96px, 224px"
                quality={85}
                priority
              />
            </div>
          </div>
      </div>
      </div>

      {/* Service Selection Buttons - Optimized with useCallback */}
      <div className="grid grid-cols-2 gap-3 px-4 z-10 mb-8 max-w-4xl w-full lg:flex lg:flex-wrap lg:justify-center">
        {servicesData.map((service, idx) => (
          <button
            key={idx}
            onClick={() => handleServiceClick(idx)}
            disabled={isAnimating || selectedService !== null}
            className="group relative px-4 py-2.5 lg:px-6 lg:py-3 rounded-full 
            bg-black/20 backdrop-blur-md border border-black/40 
            text-black shadow-lg
            hover:bg-white/30 hover:border-white/60 hover:shadow-xl
            transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)',
            }}
          >
            <div className="flex items-center gap-2 justify-center">
              <span className="text-base lg:text-xl">{service.icon}</span>
              <span className="text-xs lg:text-sm font-semibold whitespace-nowrap">{service.title}</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 
            transition-opacity blur-xl -z-10 pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Detail View - Optimized */}
      {selectedService !== null && (
        <div 
          ref={detailRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 will-change-transform transform-gpu"
          style={{ 
            perspective: '1500px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
            onClick={handleClose}
          />

          {/* Content Card */}
          <div className="relative max-w-4xl w-full bg-gradient-to-br from-white/10 to-white/5 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="absolute top-4 right-4 lg:top-6 lg:right-6 z-50 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/80 backdrop-blur-md border-2 border-white/40 flex items-center justify-center hover:bg-red-600 hover:border-red-400 hover:scale-110 transition-all shadow-xl active:scale-95"
              aria-label="Close"
            >
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left: Image */}
              <div className="relative h-64 lg:h-full min-h-[400px]">
                <Image
                  src={servicesData[selectedService].image}
                  alt={servicesData[selectedService].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />
                
                {/* Icon Badge */}
                <div className="absolute top-6 left-6">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center text-3xl lg:text-4xl">
                    {servicesData[selectedService].icon}
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center bg-black/40 backdrop-blur-sm">
                <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight text-white drop-shadow-lg">
                  {servicesData[selectedService].title}
                </h2>
                
                <p className="text-base lg:text-lg text-white/90 leading-relaxed mb-8 drop-shadow-md">
                  {servicesData[selectedService].description}
                </p>

                {/* Action Button */}
                <button 
                  onClick={() => router.push('/documentation')}
                  className="group relative px-8 py-4 rounded-full bg-white text-black font-semibold overflow-hidden transition-all hover:scale-105 hover:shadow-2xl active:scale-95">
                  <span className="relative z-10 flex items-center gap-2 justify-center">
                    Learn More
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 pointer-events-none" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}

export default Services