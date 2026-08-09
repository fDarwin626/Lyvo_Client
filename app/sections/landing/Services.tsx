"use client"
import { useState, useCallback, useRef } from "react"
import Image from 'next/image'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Icon } from "@iconify/react"
import { useRouter } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

const SERVICES = [
  {
    id: 0,
    title: "Text-to-Speech",
    short: "TTS",
    description: "Transform any text into human-like voices. Clone with a single click and choose from a wide variety of AI-generated audio that sounds naturally alive.",
    image: "/images/voice.jpeg",
    icon: "mdi:text-to-speech-off",
  },
  {
    id: 1,
    title: "Speech-to-Text",
    short: "STT",
    description: "Convert spoken audio into accurate written transcripts. Perfect for documentation, subtitles, or content repurposing.",
    image: "/images/Educational2.jpg",
    icon: "oi:audio",
  },
  {
    id: 2,
    title: "Audiobook Generation",
    short: "Audiobooks",
    description: "Turn your PDFs, TXT files, and ePUBs into professional audiobooks in minutes with one-click text-to-audio conversion.",
    image: "/images/content.jpg",
    icon: "mdi:book-open-page-variant-outline",
  },
  {
    id: 3,
    title: "AI Agent Creation",
    short: "Agents",
    description: "Create custom AI voice agents tailored to your specific needs with a single prompt. Share agents with colleagues via password or secured access.",
    image: "/images/vocal.jpeg",
    icon: "hugeicons:android",
  },
]

const Services = () => {
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useState<number | null>(null)

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
      const cards = gridRef.current?.querySelectorAll('[data-card]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08,
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%', once: true } }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  const openService = useCallback((id: number) => setSelected(id), [])
  const closeService = useCallback(() => setSelected(null), [])

  const active = selected !== null ? SERVICES[selected] : null

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
        <div ref={headingRef} className="text-center max-w-xl mx-auto mb-14 lg:mb-20">
          <p data-line className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
            Explore our services
          </p>
          <h2
            data-line
            className="font-amiamie font-bold leading-[1.08] tracking-tight text-[#0a0a0a]
                       text-[clamp(2rem,4.5vw,3.25rem)]"
          >
            What you'll get
          </h2>
          <p data-line className="mt-4 text-[clamp(0.95rem,2vw,1.05rem)] text-black/48 leading-relaxed">
            Tap a service to see how it fits into your workflow.
          </p>
        </div>

        {/* service grid — horizontal scroll on mobile, grid from sm up */}
        <div
          ref={gridRef}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4
                     overflow-x-auto sm:overflow-visible
                     snap-x snap-mandatory sm:snap-none
                     -mx-4 px-4 sm:mx-0 sm:px-0
                     scrollbar-hide"
        >
          {SERVICES.map((service) => (
            <button
              key={service.id}
              data-card
              onClick={() => openService(service.id)}
              className="group text-left rounded-2xl overflow-hidden bg-white border border-black/[0.08]
                         hover:border-black/20 transition-colors duration-300
                         flex-shrink-0 w-[72vw] sm:w-auto snap-start sm:snap-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 72vw, 25vw"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm
                                 flex items-center justify-center">
                  <Icon icon={service.icon} width="18" height="18" className="text-[#0a0a0a]" />
                </div>
              </div>
              <div className="flex items-center justify-between px-3.5 py-3 bg-[#f0efed] border-t border-black/[0.06]">
                <span className="text-[13px] font-semibold text-[#0a0a0a] truncate">{service.title}</span>
                <svg
                  className="w-3.5 h-3.5 text-black/30 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-black/60 transition-all"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-14 lg:mt-16">
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-[26px] py-[13px] rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                       hover:bg-[#2a2a2a] active:scale-[0.97] transition-all duration-200
                       flex items-center gap-1.5 group"
          >
            Get started free
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/documentation')}
            className="px-[26px] py-[13px] rounded-full border border-black/18 text-[#0a0a0a] text-sm font-semibold
                       hover:bg-black/[0.04] hover:border-black/35
                       active:scale-[0.97] transition-all duration-200"
          >
            Read the docs
          </button>
        </div>
      </div>

      {/* detail panel */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeService}
          />
          <div className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-white border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <button
              onClick={closeService}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm
                         border border-black/[0.08] flex items-center justify-center
                         hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid sm:grid-cols-2">
              <div className="relative h-56 sm:h-full min-h-[280px]">
                <Image
                  src={active.image}
                  alt={active.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  quality={90}
                />
              </div>

              <div className="p-7 sm:p-9 flex flex-col justify-center">
                <div className="w-11 h-11 rounded-full bg-[#0a0a0a] flex items-center justify-center mb-5">
                  <Icon icon={active.icon} width="20" height="20" className="text-white" />
                </div>
                <h3 className="font-amiamie font-bold text-2xl text-[#0a0a0a] mb-3 leading-tight">
                  {active.title}
                </h3>
                <p className="text-[14px] text-black/50 leading-relaxed mb-7">
                  {active.description}
                </p>
                <button
                  onClick={() => router.push('/documentation')}
                  className="self-start px-6 py-3 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                             hover:bg-[#2a2a2a] active:scale-[0.97] transition-all duration-200
                             flex items-center gap-1.5 group"
                >
                  Learn more
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-7 sm:px-9 py-3 bg-[#f0efed] border-t border-black/[0.06]">
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-black/35">Lyvo · {active.short}</span>
              <span className="text-[11px] text-black/35">{selected! + 1} / {SERVICES.length}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Services