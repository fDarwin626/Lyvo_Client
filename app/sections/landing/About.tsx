"use client"
import AnimatedHeaderSection from "@/components/AnimatedHeader"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"
import Image from 'next/image'
import { useRouter } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

const About = () => {
    const text = `Deliver new experiences and save costs for your enterprise
    Build the most advanced audio models into your product with our Agents`
const router = useRouter()

    const heroImageRef = useRef<HTMLDivElement>(null)
    const featureCardsRef = useRef<(HTMLDivElement | null)[]>([])
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
        // Optimized ScrollTrigger defaults
        ScrollTrigger.config({
          limitCallbacks: true,
          syncInterval: 150, // Reduced from default for better performance
        })

        // Hero image parallax effect - optimized
        if (heroImageRef.current) {
          gsap.to(heroImageRef.current, {
            yPercent: 20,
            ease: "none",
            force3D: true, // Hardware acceleration
            scrollTrigger: {
              trigger: heroImageRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              fastScrollEnd: true,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            }
          })
        }

        // Optimized staggered card animations with batch processing
        const validCards = featureCardsRef.current.filter(card => card !== null)
        
        if (validCards.length > 0) {
          // Use ScrollTrigger.batch for better performance
          ScrollTrigger.batch(validCards, {
            onEnter: (elements) => {
              gsap.fromTo(
                elements,
                {
                  y: 80,
                  opacity: 0,
                },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.9,
                  ease: "power3.out",
                  stagger: 0.1,
                  force3D: true,
                  overwrite: 'auto',
                }
              )
            },
            onLeaveBack: (elements) => {
              gsap.to(elements, {
                y: 80,
                opacity: 0,
                duration: 0.5,
                stagger: 0.05,
                overwrite: 'auto',
              })
            },
            start: "top 85%",
            end: "top 60%",
            fastScrollEnd: true,
          })
        }

        // CTA section animation - optimized
        if (ctaRef.current) {
          gsap.fromTo(
            ctaRef.current,
            {
              y: 60,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              force3D: true,
              scrollTrigger: {
                trigger: ctaRef.current,
                start: "top 85%",
                fastScrollEnd: true,
                once: true,
              },
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
  <section ref={containerRef} className="min-h-screen bg-black mt-20 lg:mt-30 rounded-t-[3rem] lg:rounded-t-[4rem] rounded-b-[3rem] lg:rounded-b-[4rem] overflow-hidden will-change-transform">
    
    {/* Header Section */}
    <AnimatedHeaderSection
      subtitle="Next Gen, AI Voice Platform"
      title='Agents'
      text={text}
      textcolor='text-white'
      withScrollTrigger={true}
    />

    {/* Title Section */}
    <div className="px-6 lg:px-16 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-white/10 pt-8 lg:pt-12">
          <h2 className="text-3xl lg:text-6xl font-bold text-white mb-4 font-amiamie">
            Lyvo AI Agent
          </h2>
          <p className="text-base lg:text-xl text-gray-400 max-w-2xl">
            Own a personal AI agents accessible anytime. Share links with friends and co-workers
          </p>
        </div>
      </div>
    </div>
    
    {/* Hero Image Section with Parallax */}
    <div className="relative w-full overflow-hidden px-6 lg:px-16 mb-20 lg:mb-32">
      <div className="max-w-7xl mx-auto">
        <div ref={heroImageRef} className="relative h-[400px] lg:h-[600px] rounded-2xl lg:rounded-3xl overflow-hidden transform-gpu">
          <Image
            src="/images/photo3.jpg" 
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
          
          <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 lg:px-6 lg:py-3">
              <span className="text-white text-xs lg:text-sm font-semibold">AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Feature Cards - Minimalist Design */}
    <div className="px-6 lg:px-16 pb-24 lg:pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6 lg:space-y-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => { featureCardsRef.current[index] = el }}
              className="group relative transform-gpu"
            >
              <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl lg:rounded-3xl p-8 lg:p-12 overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/20">
                
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                  {/* Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                      <span className="text-2xl lg:text-3xl font-bold text-white/60 group-hover:text-white/90 transition-colors duration-300">
                        {feature.number}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 lg:mb-4 font-amiamie">
                      {feature.title}
                    </h3>
                    <p className="text-base lg:text-lg text-gray-400 leading-relaxed max-w-3xl">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative arrow */}
                  <div className="flex-shrink-0 hidden lg:block">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom CTA Section - Refined Design */}
    <div className="px-6 lg:px-16 pb-16 lg:pb-24">
      <div className="max-w-7xl mx-auto">
        <div ref={ctaRef} className="relative transform-gpu">
          {/* Main CTA Container */}
          <div className="relative bg-white/[0.02] backdrop-blur-sm border-t border-white/10 rounded-3xl lg:rounded-[3rem] overflow-hidden">
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="relative px-8 lg:px-16 py-12 lg:py-20">
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              <div className="relative text-center max-w-3xl mx-auto">
                <div className="mb-6">
                  <span className="inline-block px-4 py-2 rounded-full border border-white/20 text-xs lg:text-sm text-white/70 backdrop-blur-sm">
                    Start Building Today
                  </span>
                </div>

                <h3 className="text-3xl lg:text-5xl font-bold text-white mb-4 lg:mb-6 font-amiamie leading-tight">
                  Ready to Create Your Agent?
                </h3>
                
                <p className="text-base lg:text-lg text-gray-400 mb-10 lg:mb-12">
                  Join thousands of users already building with Lyvo AI
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                   onClick={() => router.push('/auth/signup')}
                  className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-white/10 w-full sm:w-auto active:scale-95">
                    <span className="relative z-10 flex items-center gap-2 justify-center">
                      Get Started
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </button>

                  <button
                  onClick={() => router.push('/documentation')}
                  className="group px-8 py-4 bg-white/5 backdrop-blur-sm text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all w-full sm:w-auto active:scale-95">
                    <span className="flex items-center gap-2 justify-center">
                      View Documentation
                      <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
  )
}

export default About