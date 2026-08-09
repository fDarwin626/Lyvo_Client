"use client"
import { useRef, useState, useCallback, useEffect } from 'react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRouter } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    label: "Studio-quality speech",
    desc: "Turn any script into natural, expressive audio in seconds.",
  },
  {
    label: "AI agents",
    desc: "Spin up voice agents that answer, guide, and convert.",
  },
  {
    label: "Instant audiobooks",
    desc: "Drop in a document, walk away with a finished narration.",
  },
]

const AboutSummary = () => {
  const router = useRouter()
  const sectionRef  = useRef<HTMLDivElement>(null)
  const headingRef  = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const fillRef     = useRef<HTMLDivElement>(null)
  const timeLabelRef = useRef<HTMLSpanElement>(null)

  const [isPlaying, setIsPlaying]   = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isMuted, setIsMuted]       = useState(false)

  // ── scroll entrances ───────────────────────────────────────────────
  useGSAP(() => {
    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('[data-line]'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.08,
            scrollTrigger: { trigger: headingRef.current, start: 'top 85%', once: true } }
        )
      }
      if (videoWrapRef.current) {
        gsap.fromTo(videoWrapRef.current,
          { x: -32, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1,
            scrollTrigger: { trigger: videoWrapRef.current, start: 'top 82%', once: true } }
        )
      }
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.querySelectorAll('[data-feature]'),
          { x: 24, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12, delay: 0.2,
            scrollTrigger: { trigger: featuresRef.current, start: 'top 80%', once: true } }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  // ── setup video to show poster frame ──────────────────────────────
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const seekToEnd = () => {
      if (vid.duration && isFinite(vid.duration)) {
        vid.currentTime = vid.duration - 0.01
      }
    }
    const isMobile = window.innerWidth < 768

    vid.addEventListener('loadedmetadata', seekToEnd, { once: true })
    if (isMobile) vid.addEventListener('loadeddata', seekToEnd, { once: true })
    vid.load()

    return () => {
      vid.removeEventListener('loadedmetadata', seekToEnd)
      if (isMobile) vid.removeEventListener('loadeddata', seekToEnd)
    }
  }, [])

  // ── progress ───────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v?.duration) return
    if (fillRef.current) fillRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`
    if (timeLabelRef.current) {
      const m = Math.floor(v.currentTime / 60)
      const sec = String(Math.floor(v.currentTime % 60)).padStart(2, '0')
      timeLabelRef.current.textContent = `${m}:${sec}`
    }
  }, [])

  // ── play, explicitly unmuted on user gesture ───────────────────────
  const handleOverlayClick = useCallback(() => {
    const v = videoRef.current
    if (!v || hasStarted) return
    setHasStarted(true)
    setIsLoading(true)
    v.addEventListener('canplay', () => {
      setIsLoading(false)
      setIsPlaying(true)
      v.muted = false
      v.volume = 1
      setIsMuted(false)
      v.play().catch(() => {})
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0, duration: 0.3,
          onComplete: () => { if (overlayRef.current) overlayRef.current.style.display = 'none' },
        })
      }
    }, { once: true })
    v.load()
  }, [hasStarted])

  const handleTogglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  const handleToggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }, [])

  const handleEnded = useCallback(() => setIsPlaying(false), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handlePlay  = useCallback(() => setIsPlaying(true), [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 lg:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#e8e7e4]/40"
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

      <div className="relative max-w-[1180px] mx-auto">

        {/* heading */}
        <div ref={headingRef} className="max-w-xl mb-14 lg:mb-20">
          <p data-line className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
            See it live
          </p>
          <h2
            data-line
            className="font-amiamie font-bold leading-[1.08] tracking-tight text-[#0a0a0a]
                       text-[clamp(2rem,4.5vw,3.25rem)]"
          >
            Everything you need,
            <br className="hidden sm:block" />
            {" "}in under a minute.
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start">

          {/* video card */}
          <div ref={videoWrapRef} className="w-full">
            <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-black/[0.08]">
              <div className="relative aspect-video bg-[#e8e7e4bd]">

                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  preload={typeof window !== 'undefined' && window.innerWidth < 768 ? 'auto' : 'metadata'}
                  playsInline
                  muted={false}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  onPause={handlePause}
                  onPlay={handlePlay}
                >
                  <source src="/videos/LyvoSFx.mp4" type="video/mp4" />
                </video>

                {!hasStarted && (
                  <div
                    ref={overlayRef}
                    onClick={handleOverlayClick}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  >
                    <div
                      className="w-[clamp(52px,8vw,64px)] h-[clamp(52px,8vw,64px)] rounded-full
                                 bg-white/92 backdrop-blur-sm flex items-center justify-center
                                 shadow-[0_2px_12px_rgba(0,0,0,0.14)]
                                 transition-transform duration-200 group-hover:scale-[1.07]"
                    >
                      <svg className="w-5 h-5 ml-0.5 text-[#0a0a0a]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15 z-10">
                    <div
                      className="w-[clamp(52px,8vw,64px)] h-[clamp(52px,8vw,64px)] rounded-full
                                 bg-white/92 backdrop-blur-sm flex items-center justify-center
                                 shadow-[0_2px_12px_rgba(0,0,0,0.14)]"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-black/15 border-t-black/70 animate-spin" />
                    </div>
                  </div>
                )}

                {hasStarted && !isLoading && (
                  <button
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer"
                  />
                )}
              </div>

              {/* bottom bar */}
              <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[#f0efed] border-t border-black/[0.06]">
                <button
                  onClick={handleToggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="flex-shrink-0 text-black/40 hover:text-black/70 transition-colors"
                >
                  {isMuted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2 2m0-2l-2 2M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l4 4V5L9 9z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l4 4V5L9 9zM19 8a5 5 0 010 8M16.5 10.5a2 2 0 010 3" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 h-0.5 bg-black/[0.08] rounded-full overflow-hidden">
                  <div
                    ref={fillRef}
                    className="h-full w-0 bg-black/40 rounded-full"
                    style={{ transition: 'width 0.25s linear' }}
                  />
                </div>
                <span
                  ref={timeLabelRef}
                  className="text-[11px] font-mono text-black/30 flex-shrink-0 min-w-[28px] text-right tabular-nums"
                >
                  –:––
                </span>
              </div>
            </div>
          </div>

          {/* feature list + CTAs */}
          <div ref={featuresRef} className="flex flex-col gap-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                data-feature
                className="flex items-start gap-4 p-4 rounded-xl border border-black/[0.08] bg-white
                           hover:border-black/20 transition-colors duration-200"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0a0a0a] text-white
                                  text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0a]">{f.label}</p>
                  <p className="text-[13px] text-black/50 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 mt-3">
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full px-6 py-3.5 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                           hover:bg-[#2a2a2a] active:scale-[0.98] transition-all duration-200
                           flex items-center justify-center gap-1.5 group"
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
                className="w-full px-6 py-3.5 rounded-full border border-black/18 text-[#0a0a0a] text-sm font-semibold
                           hover:bg-black/[0.04] hover:border-black/35
                           active:scale-[0.98] transition-all duration-200"
              >
                Read the docs
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default AboutSummary