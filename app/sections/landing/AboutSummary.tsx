"use client"
import { useRef, useState, useCallback, useEffect } from 'react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRouter } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

const AboutSummary = () => {
  const router = useRouter()
  const sectionRef   = useRef<HTMLDivElement>(null)
  const headingRef   = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const fillRef      = useRef<HTMLDivElement>(null)
  const timeLabelRef = useRef<HTMLSpanElement>(null)
  const dotRef       = useRef<HTMLDivElement>(null)

  const [isPlaying,  setIsPlaying]  = useState(false)
  const [isLoading,  setIsLoading]  = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showPause,  setShowPause]  = useState(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── scroll entrances ───────────────────────────────────────────────
  useGSAP(() => {
    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('[data-line]'),
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.09,
            scrollTrigger: { trigger: headingRef.current, start: 'top 82%', once: true } }
        )
      }
      if (videoWrapRef.current) {
        gsap.fromTo(videoWrapRef.current,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.95, ease: 'power3.out', delay: 0.15,
            scrollTrigger: { trigger: videoWrapRef.current, start: 'top 84%', once: true } }
        )
      }
      if (bottomRef.current) {
        gsap.fromTo(bottomRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: 'power2.out', delay: 0.28,
            scrollTrigger: { trigger: bottomRef.current, start: 'top 88%', once: true } }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

// ── setup video to show poster frame without needing a separate image file ──
 useEffect(() => {
  const vid = videoRef.current;
  if (!vid) return;
      const seekToEnd = () => {
        if (vid.duration && isFinite(vid.duration)) {
          vid.currentTime = vid.duration - 0.01;
        }
      };
      vid.addEventListener('loadedmetadata', seekToEnd, { once: true });
      vid.load();
      return () => vid.removeEventListener('loadedmetadata', seekToEnd);
  }, [])

  // ── progress ───────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v?.duration) return
    if (fillRef.current) fillRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`
    if (timeLabelRef.current) {
      const m   = Math.floor(v.currentTime / 60)
      const sec = String(Math.floor(v.currentTime % 60)).padStart(2, '0')
      timeLabelRef.current.textContent = `${m}:${sec}`
    }
  }, [])

  // ── play ───────────────────────────────────────────────────────────
  const handleOverlayClick = useCallback(() => {
    const v = videoRef.current
    if (!v || hasStarted) return
    setHasStarted(true)
    setIsLoading(true)
    v.addEventListener('canplay', () => {
      setIsLoading(false)
      setIsPlaying(true)
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

  // ── pause toggle ───────────────────────────────────────────────────
  const handlePauseBtn = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
      setShowPause(true)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => setShowPause(false), 650)
    }
  }, [])

  const handleEnded = useCallback(() => setIsPlaying(false), [])
  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (dotRef.current) dotRef.current.style.background = 'rgba(0,0,0,0.22)'
  }, [])
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (dotRef.current) dotRef.current.style.background = 'rgba(0,0,0,0.55)'
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full  py-24 lg:py-36 px-4 sm:px-8 lg:px-16 overflow-hidden"
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

      <div className="relative max-w-[800px] mx-auto flex flex-col items-center gap-12 lg:gap-16">

        {/* heading */}
        <div ref={headingRef} className="text-center w-full max-w-[560px]">
          <p data-line className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
            See it live
          </p>
          <h2
            data-line
            className="font-amiamie font-bold leading-[1.08] tracking-tight text-[#0a0a0a]
                       text-[clamp(2rem,5vw,3.25rem)]"
          >
            Everything you need,
            <br className="hidden sm:block" />
            {" "}in under a minute.
          </h2>
          <p
            data-line
            className="mt-4 text-[clamp(0.95rem,2vw,1.05rem)] text-black/48 max-w-lg mx-auto leading-relaxed"
          >
            Watch Lyvo turn text into studio-quality audio, create AI agents,
            and generate audiobooks all without leaving the dashboard.
          </p>
        </div>

        {/* video card */}
        <div ref={videoWrapRef} className="w-full ">
          <div
            className="relative w-full rounded-2xl overflow-hidden
                       bg-back border border-black/[0.08]
                       "
          >
            <div className="relative aspect-video bg-[#e8e7e4bd]">

              {/*
                preload="metadata" loads just enough to show the first frame as poster.
                PRODUCTION TIP: add poster="/images/lyvo-thumb.jpg" for instant thumbnail.

                Cut file size ~60% with webm:
                  ffmpeg -i public/videos/LyvoSFx.mp4 \
                    -c:v libvpx-vp9 -crf 33 -b:v 0 \
                    public/videos/LyvoSFx.webm
                Then uncomment the webm <source>.
              */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                preload="metadata"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPause={handlePause}
                onPlay={handlePlay}
              >
                {/* <source src="/videos/LyvoSFx.webm" type="video/webm" /> */}
                <source src="/videos/LyvoSFx.mp4" type="video/mp4" />
              </video>

              {/* pre-play: transparent overlay, play button floats over poster frame */}
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

              {/* loading spinner */}
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

              {/* pause flash */}
              {showPause && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                             w-[52px] h-[52px] rounded-full bg-black/25 backdrop-blur-sm
                             flex items-center justify-center pointer-events-none"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </div>
              )}

              {/* tap to pause/resume once started */}
              {hasStarted && !isLoading && (
                <button
                  onClick={handlePauseBtn}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer"
                />
              )}
            </div>

            {/* bottom bar */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[#f0efed] border-t border-black/[0.06]">
              <div
                ref={dotRef}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
                style={{ background: 'rgba(0,0,0,0.18)' }}
              />
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

        {/* CTAs */}
        <div
          ref={bottomRef}
          className="flex flex-wrap items-center justify-center gap-3.5 w-full"
        >
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
    </section>
  )
}

export default AboutSummary