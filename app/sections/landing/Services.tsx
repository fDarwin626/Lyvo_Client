"use client"
import { useState, useEffect, useRef, useMemo } from "react"

const Services = () => {
  const servicesData = useMemo(() => [
    {
      title: "AI Voice Assistant",
      description: "Premium voice agents at your services. Get to production in days Scale with full control over LLM.",
      color: "bg-teal-600",
      image: "/images/Ai_Voice.jpg",
    },
    {
      title: "Education Tech",
      description: "Build more engaging experiences with Conversational AI.",
      color: "bg-purple-600",
      image: "/images/Educational.jpg" 
    },
    {
      title: "Call Centers",
      description: "Power inbound and outbound AI calls at scale. Schedule and automate Calls",
      color: "bg-blue-600",
      image: "/images/call.jpg"
    },
    {
      title: "Content Creation/media",
      description: "Add Ai audio into your content Creation providing your audience with a premium content and quality text to speech models",
      color: "bg-gradient-to-r from-purple-600 to-pink-600",
      image: "/images/content.jpg",
    },
  ], [])

  const [activeIndex, setActiveIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserInteracting = useRef(false)

  // Preload images
  useEffect(() => {
    servicesData.forEach((service, index) => {
      const img = new Image()
      img.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }))
      }
      img.src = service.image
    })
  }, [servicesData])

// Auto-scroll functionality - OPTIMIZED
useEffect(() => {
  if (isUserInteracting.current) return

  const timer = setTimeout(() => {
    setActiveIndex((current) => (current + 1) % servicesData.length)
  }, 5000)
  
  return () => clearTimeout(timer)
}, [activeIndex, servicesData.length])

// Smooth scroll to active card - OPTIMIZED
useEffect(() => {
  const container = scrollContainerRef.current
  if (!container) return
  
  const cardWidth = 420
  const scrollPosition = activeIndex * cardWidth
  
  // Use requestAnimationFrame for smoother scrolling
  requestAnimationFrame(() => {
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
  })
}, [activeIndex])

  const handleCardInteraction = (index: number) => {
    isUserInteracting.current = true
    setActiveIndex(index)
    
    // Reset auto-scroll after user stops interacting
    if (timerRef.current) clearTimeout(timerRef.current)
    
    setTimeout(() => {
      isUserInteracting.current = false
    }, 1000)
  }

  const handleDotClick = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActiveIndex(index)
    isUserInteracting.current = true
    
    setTimeout(() => {
      isUserInteracting.current = false
    }, 1000)
  }

  return (
    <section className="min-h-screen py-20">
      <div className="text-center mb-10">
        <h1 className="lg:text-5xl text-4xl font-amiamie font-semibold">What you'll get</h1>
        <p className="lg:text-xl mt-5 text-sm font-serif">Professional Voice models for your workflow</p>
      </div>

      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex gap-5 px-10 overflow-x-auto scroll-smooth snap-x snap-mandatory"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {servicesData.map((service, index) => {
            const isActive = activeIndex === index
            
            return (
              <div 
                  key={index}
                  className={`lg:min-w-[400px] min-w-[350px] h-[500px] rounded-3xl overflow-hidden
                    snap-center transition-all duration-500 ease-out will-change-transform
                    ${isActive ? 'blur-0 scale-100 opacity-100' : 'blur-sm scale-95 opacity-70'}`}
                  onMouseEnter={() => handleCardInteraction(index)}
                  onClick={() => handleCardInteraction(index)}
                  style={{ transform: 'translateZ(0)' }}
                >
                {/* TOP HALF - COLOR */}
                <div className={`h-1/2 ${service.color} flex flex-col items-start justify-center p-8`}>
                  <h3 className="text-white font-amiamie-round text-2xl font-bold mb-3">
                    {service.title}
                  </h3>
                  <p className="text-white text-sm font-serif">
                    {service.description}
                  </p>
                </div>
                
                {/* BOTTOM HALF - IMAGE */}
                <div className="h-1/2 relative bg-gray-200">
                  {!imagesLoaded[index] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className={`w-full h-full object-cover transition-opacity duration-300
                      ${imagesLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DOTS */}
      <div className="flex justify-center gap-3 mt-8">
        {servicesData.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`rounded-full transition-all duration-300
              ${activeIndex === index ? 'bg-slate-900 w-8 h-3' : 'bg-gray-300 w-3 h-3'}`}
            aria-label={`Go to service ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

export default Services