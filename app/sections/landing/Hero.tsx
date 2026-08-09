"use client"

import { useState, useEffect, useRef } from "react"
import Image from 'next/image'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"

const SLIDES = [
  { id: 1, image: '/images/hero/automation2.jpeg', label: 'Automate your workflow' },
  { id: 2, image: '/images/hero/script.jpeg', label: 'Voiceover for your scripts' },
  { id: 3, image: '/images/hero/teen-content.jpeg', label: 'Create engaging content' },
  { id: 4, image: '/images/hero/success.jpeg', label: 'Tell a story using Lyvo' },
  { id: 5, image: '/images/podcast2.jpg', label: 'Handle your podcast scripts' },
  { id: 6, image: '/images/handbook.jpeg', label: 'Voiceover for audiobooks' },
]

const Hero = () => {
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const stageRef   = useRef<HTMLDivElement>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((current) => {
        const nextIndex = current + direction
        if (nextIndex >= SLIDES.length - 1) {
          setDirection(-1)
          return SLIDES.length - 1
        }
        if (nextIndex <= 0) {
          setDirection(1)
          return 0
        }
        return nextIndex
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [direction])

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  // ── entrance, runs on mount since hero is above the fold ───────────
  useGSAP(() => {
    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('[data-line]'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.08 }
        )
      }
      if (stageRef.current) {
        gsap.fromTo(
          stageRef.current,
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.25 }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="relative w-full pt-28 pb-20 lg:pt-36 lg:pb-28 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#e8e7e4]/40"
    >
      {/* grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#000 2px,transparent 2px),linear-gradient(90deg,#000 2px,transparent 2px)',
          backgroundSize: '80px 60px',
        }}
      />

      <div className="relative max-w-[1180px] mx-auto flex flex-col items-center">

        {/* heading */}
        <div ref={headingRef} className="text-center max-w-2xl mb-14 lg:mb-20">
          <p data-line className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
            AI voice platform
          </p>
          <h1
            data-line
            className="font-amiamie font-bold leading-[1.06] tracking-tight text-[#0a0a0a]
                       text-[clamp(2.25rem,6vw,4rem)]"
          >
            One voice engine,
            <br className="hidden sm:block" />
            {" "}every format you create in.
          </h1>
          <p
            data-line
            className="mt-5 text-[clamp(0.95rem,2vw,1.05rem)] text-black/48 max-w-lg mx-auto leading-relaxed"
          >
            Scripts, podcasts, audiobooks, and automated content narrated,
            branded, and shipped without leaving Lyvo.
          </p>

          <div data-line className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-[26px] py-[13px] rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                         hover:bg-[#2a2a2a] active:scale-[0.97] transition-all duration-200
                         flex items-center gap-1.5 group"
            >
              Get started free
              <svg
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button
              onClick={() => router.push('/documentation')}
              className="px-[26px] py-[13px] rounded-full border border-black/18
                         text-[#0a0a0a] text-sm font-semibold
                         hover:bg-black/[0.04] hover:border-black/35
                         active:scale-[0.97] transition-all duration-200"
            >
              Read the docs
            </button>
          </div>
        </div>

        {/* carousel stage */}
        <div ref={stageRef} className="relative w-full h-[420px] md:h-[520px] flex items-center justify-center overflow-visible">
          {SLIDES.map((slide, index) => {
            const offset = index - currentIndex
            const isActive = index === currentIndex
            const absOffset = Math.abs(offset)

            if (absOffset > 2) return null

            return (
              <div
                key={slide.id}
                className="absolute will-change-transform transition-all duration-700 ease-in-out"
                style={{
                  transform: `translate3d(${offset * 90}%, 0, 0) translateX(${offset * 20}px) scale(${isActive ? 1 : 0.88})`,
                  zIndex: SLIDES.length - absOffset,
                  opacity: absOffset > 1 ? 0.25 : 1,
                  pointerEvents: isActive ? 'auto' : 'none',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="w-[240px] md:w-[360px] rounded-2xl overflow-hidden bg-white border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <div className="relative w-[240px] h-[320px] md:w-[360px] md:h-[460px]">
                    <Image
                      src={slide.image}
                      alt={slide.label}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      quality={80}
                      sizes="(max-width: 768px) 240px, 360px"
                    />
                  </div>
                  <div className="flex items-center px-3.5 py-2.5 bg-[#f0efed] border-t border-black/[0.06]">
                    <p className="text-[13px] font-medium text-[#0a0a0a] truncate">
                      {slide.label}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* dots */}
        <div className="flex items-center justify-center gap-2 mt-10 md:mt-14">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === currentIndex ? '22px' : '6px',
                backgroundColor: index === currentIndex ? '#0a0a0a' : 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero