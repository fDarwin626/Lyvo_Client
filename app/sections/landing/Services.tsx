"use client"
import { useState, useEffect, useRef } from "react"


const Services = () => {
  const servicesData = [
    {
      title: "AI Voice Assistant",
      description: "Premium voice agents at your services. Get to production in days Scale with full control over LLM.",
      color: "bg-teal-600",
      image: "/images/Ai_Voice.jpg",
    },
    {
      title: "Education Tech",
     description: "Build more engaging experiences with Conversational AI.",
     color: "bg-purple-600" ,
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

  ]

  const [activeIndex, setActiveIndex] = useState(0);

useEffect(() => {
  const duration = 5000; // 5 seconds per card
  
  const timer = setTimeout(() => {
    setActiveIndex((current) => (current + 1) % servicesData.length);
  }, duration);
  
  return () => clearTimeout(timer);
}, [activeIndex, servicesData.length]);


  return (
  <section className="min-h-screen py-20">
    <div className="text-center mb-10">
      <h1 className="lg:text-5xl text-4xl font-amiamie font-semibold">What you'll get</h1>
      <p className="lg:text-xl mt-5 text-sm font-serif">Professional Voice models for your workflow</p>
    </div>

<div className="relative">
  <div className="flex gap-5 px-10 overflow-x-auto scroll-smooth snap-x snap-mandatory"
       style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
       ref={(el) => {
         if (el) {
           const cardWidth = 420; // card width + gap
           el.scrollLeft = activeIndex * cardWidth;
         }
       }}
  >
    {servicesData.map((service, index) => (
      <div 
        key={index}
        className={`min-w-[400px] h-[500px] rounded-3xl overflow-hidden transition-all duration-500 snap-center ${activeIndex === index ? 'blur-0 scale-100' : 'blur-sm scale-95 opacity-70'}`}
        onMouseEnter={() => setActiveIndex(index)}
      >
        {/* TOP HALF - COLOR */}
        <div className={`h-1/2 ${service.color} flex flex-col items-start justify-center p-8`}>
          <h3 className="text-white font-amiamie-round text-2xl font-bold mb-3">{service.title}</h3>
          <p className="text-white text-sm font-serif">{service.description}</p>
        </div>  
        {/* BOTTOM HALF - IMAGE */}
        <div className="h-1/2">
          <img 
            src={service.image} 
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ))}
  </div>
</div>

    {/* DOTS - MOVED OUTSIDE */}
<div className="flex justify-center gap-3 mt-8">
  {servicesData.map((_, index) => (
    <button
      key={index}
      onClick={() => setActiveIndex(index)}
      className={`w-3 h-3 rounded-full transition-all
         ${activeIndex === index ? 'bg-slate-900 w-8' : 'bg-gray-300'}`}
    />
  ))}
</div>
  </section>
    
  )
}

export default Services