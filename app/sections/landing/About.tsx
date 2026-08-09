"use client"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"
import Image from 'next/image'
import { useRouter } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

const About = () => {
  const router = useRouter()

  const headingRef = useRef<HTMLDivElement>(null)
  const heroImageRef = useRef<HTMLDivElement>(null)
  const imageWrapRef = useRef<HTMLDivElement>(null)
  const featureRowsRef = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const features = [
    {
      title: "Crafting Agents",
      description: "Create an AI agent with a single prompt, using Lyvo's advanced generation technology",
      number: "01"
    },
    {
      title: "Select Voices",
      description: "Pick a unique voice that suits your agent character from numerous voices on our voice library",
      number: "02"
    },
    {
      title: "Share with Others",
      description: "Create shareable links. Share with friends, teams or co-workers instantly",
      number: "03"
    }
  ]

  useGSAP(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.config({
        limitCallbacks: true,
        syncInterval: 150,
      })

      // header, matches the rest of the page's entrance style
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('[data-line]'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.08,
            scrollTrigger: { trigger: headingRef.current, start: 'top 85%', once: true } }
        )
      }

      // image entrance
      if (imageWrapRef.current) {
        gsap.fromTo(
          imageWrapRef.current,
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: imageWrapRef.current, start: 'top 85%', once: true } }
        )
      }

      // parallax on the image itself
      if (heroImageRef.current) {
        gsap.to(heroImageRef.current, {
          yPercent: 14,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: heroImageRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            fastScrollEnd: true,
            invalidateOnRefresh: true,
          }
        })
      }

      const validRows = featureRowsRef.current.filter(row => row !== null)
      if (validRows.length > 0) {
        ScrollTrigger.batch(validRows, {
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1, force3D: true, overwrite: 'auto' }
            )
          },
          start: "top 88%",
          fastScrollEnd: true,
          once: true,
        })
      }

      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { y: 32, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, ease: "power2.out", force3D: true,
            scrollTrigger: { trigger: ctaRef.current, start: "top 88%", fastScrollEnd: true, once: true },
          }
        )
      }
    }, containerRef)

    return () => {
      ctx.revert()
      ScrollTrigger.clearScrollMemory()
    }
  }, { scope: containerRef, dependencies: [] })

  return (
    <section ref={containerRef} className="relative w-full py-24 lg:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#e8e7e4]/40">

      {/* grid, matches Hero / AboutSummary / Services */}
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

        {/* header, same formula as every other section */}
        <div ref={headingRef} className="max-w-2xl mb-14 lg:mb-20">
          <p data-line className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
            Next gen, AI voice platform
          </p>
          <h1
            data-line
            className="font-amiamie font-bold leading-[1.06] tracking-tight text-[#0a0a0a]
                       text-[clamp(2.25rem,6vw,4rem)] mb-5"
          >
            Agents
          </h1>
          <p
            data-line
            className="text-[clamp(0.95rem,2vw,1.05rem)] text-black/48 leading-relaxed max-w-lg"
          >
            Deliver new experiences and save costs for your enterprise
            build the most advanced audio models into your product with our agents.
          </p>
        </div>

        {/* image, footer-bar treatment matches the video card elsewhere, no boxed border */}
        <div ref={imageWrapRef} className="mb-20 lg:mb-28">
          <div className="relative rounded-2xl overflow-hidden">
            <div ref={heroImageRef} className="relative h-[320px] lg:h-[500px] transform-gpu">
              <Image
                src="/images/lady-landing2.jpeg"
                alt="AI Agent visualization"
                fill
                className="object-cover"
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                priority
                loading="eager"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA2gA8/9k="
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 px-1">
            <span className="text-[13px] font-medium text-black/45">AI-powered agent preview</span>
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-black/30">Lyvo</span>
          </div>
        </div>

        {/* feature list — ghost numerals + dividers */}
        <div className="mb-20 lg:mb-28">
          <div className="border-t border-black/[0.08]">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => { featureRowsRef.current[index] = el }}
                className="group relative transform-gpu border-b border-black/[0.08] py-8 lg:py-12
                           transition-colors duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-12">
                  <span className="font-amiamie font-bold text-black/10 group-hover:text-black/20
                                    text-[clamp(3rem,7vw,5rem)] leading-none transition-colors duration-300
                                    lg:w-40 flex-shrink-0 select-none">
                    {feature.number}
                  </span>

                  <div className="flex-1">
                    <h3 className="text-xl lg:text-3xl font-bold text-[#0a0a0a] mb-2 font-amiamie">
                      {feature.title}
                    </h3>
                    <p className="text-sm lg:text-base text-black/50 leading-relaxed max-w-2xl">
                      {feature.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 hidden lg:block">
                    <svg
                      className="w-5 h-5 text-black/20 group-hover:text-black/60 group-hover:translate-x-1.5
                                 transition-all duration-300"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — open banner, no card wrapper */}
        <div ref={ctaRef} className="transform-gpu">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-t border-black/[0.08] pt-12 lg:pt-16">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 mb-4">
                Start building today
              </p>
              <h3 className="font-amiamie font-bold leading-[1.05] tracking-tight text-[#0a0a0a]
                              text-[clamp(2rem,5vw,3.5rem)]">
                Ready to create
                <br />
                your agent?
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 flex-shrink-0">
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-[26px] py-[13px] rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                           hover:bg-[#2a2a2a] active:scale-[0.97] transition-all duration-200
                           flex items-center gap-1.5 group"
              >
                Get started
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
                View documentation
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default About