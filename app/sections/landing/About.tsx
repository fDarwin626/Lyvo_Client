"use client"
import AnimatedHeaderSection from "@/components/AnimatedHeader"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"

gsap.registerPlugin(ScrollTrigger)

const About = () => {
    const text = `Deliver new experiences and save costs for your enterprise
    Build the most advanced audio models into your product with our Agents`

    const card1Ref = useRef(null)
    const card2Ref = useRef(null)
    const card3Ref = useRef(null)
    const mobileTextRef = useRef(null)
    const containerRef = useRef(null)

    useGSAP(() => {
      // Animation for card 1 - slides from left
      if (card1Ref.current) {
        gsap.fromTo(
          card1Ref.current,
          {
            x: -100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card1Ref.current,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        )
      }

      // Animation for card 2 - slides from right
      if (card2Ref.current) {
        gsap.fromTo(
          card2Ref.current,
          {
            x: 100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card2Ref.current,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        )
      }

      // Animation for card 3 - slides from left
      if (card3Ref.current) {
        gsap.fromTo(
          card3Ref.current,
          {
            x: -100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card3Ref.current,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        )
      }

      // Animation for mobile text - slides from left
      if (mobileTextRef.current) {
        gsap.fromTo(
          mobileTextRef.current,
          {
            x: -100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: mobileTextRef.current,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        )
      }
    }, { scope: containerRef, dependencies: [] })

  return (
  <section className="min-h-screen bg-black mt-30 rounded-t-4xl sticky rounded-b-4xl">
    <AnimatedHeaderSection
      subtitle= "Next Gen, Ai Voice Platform"
      title='Agents'
      text={text}
      textcolor='text-white'
      withScrollTrigger={true}
    />
    <div className="items-center justify-center mb-10">
      <div className="min-w-screen border flex flex-row mb-3"/>
        <div className="flex flex-col text-2xl lg:text-4xl text-gray-200 p-4">
            <h1 className="mb-5 font-amiamie font-normal">Lyvo Ai Agent</h1>
            <p className="text-sm lg:text-xl">Own a personal Ai agents accessable anytime. share links with friends and co-workers</p>
        </div>
    </div>
    
    {/* Image with text overlay */}
    <div ref={containerRef} className="flex items-center justify-center relative">
      <img 
        src="/images/photo3.jpg" 
        className="w-[100%] h-[60%] mix-blend-lighten" 
        alt="agent photo"
      />
      
      {/* DESKTOP CARDS - Hidden on mobile */}
      <div ref={card1Ref} className="hidden md:block absolute left-8 md:left-16 lg:left-17 top-1/4 -translate-y-1/2 max-w-md">
        <div className="border-2 border-red-500 p-6 bg-black/50 backdrop-blur-sm rounded-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-yellow-400 tracking-wider font-amiamie">
           Crafting agents 
          </h2>
          <p className="text-gray-200 mt-4 text-sm md:text-base font-serif">
            Create an ai agent with a single prompt, using lyvo
          </p>
        </div>
      </div>

      <div ref={card2Ref} className="hidden md:block absolute right-8 md:right-16 lg:right-17 top-1/2 -translate-y-1/2 max-w-md">
        <div className="border-2 border-red-500 p-6 bg-black/50 backdrop-blur-sm rounded-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-yellow-400 tracking-wider font-amiamie">
           Select Voices
          </h2>
          <p className="text-gray-200 mt-4 text-sm md:text-base font-serif">
            Pick a unique voice that suits your agent character from numerious voices on our voice library
          </p>
        </div>
      </div>

      <div ref={card3Ref} className="hidden md:block absolute left-8
       md:left-16 lg:left-17 top-300 -translate-y-1/2 max-w-md">
        <div className="border-2 border-red-500 p-6 bg-black/50 backdrop-blur-sm rounded-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-yellow-400 tracking-wider font-amiamie">
           Share with others
          </h2>
          <p className="text-gray-200 mt-4 text-sm md:text-base font-serif">
            Create shareable links. share with friends, teams or co-workers.
          </p>
        </div>
      </div>

      {/* MOBILE TEXT ONLY - No cards, just plain text */}
      <div ref={mobileTextRef} className="md:hidden absolute left-4 top-75 -translate-y-1/2 max-w-xs">
        <h2 className="text-2xl font-semibold text-yellow-400 tracking-wider font-amiamie mb-2">
          Crafting agents
        </h2>
        <p className="text-gray-200 text-sm font-serif">
          Create an ai agent with a single prompt, using lyvo
        </p>
      </div>

    </div>

  </section>
  )
}

export default About