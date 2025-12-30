"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sliders = [
    {id: 1, image: '/images/hero/automation.jpg', text:'Automate Your Workflow'},
    {id: 2, image: '/images/hero/script.jpg', text:'Voice over for your scripts'},
    {id: 3, image: '/images/hero/teen-content.jpg', text: 'Create Engaging Contents'},
    {id: 4, image: '/images/hero/success.jpg', text:'Tell a story using Lyvo'},
    {id: 5, image: '/images/podcast.jpg', text: "Handle your podcast scripts"},
    {id: 6, image: '/images/audiobook.jpg', text:'Voice over for AudioBooks'},
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sliders.length);
        setIsTransitioning(false);
      }, 300); // Half of transition duration
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [sliders.length]);

  const goToSlide = (index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  return (
    <section className="min-h-screen flex flex-col mt-4 overflow-hidden px-4">
      <div className="relative w-full h-[500px] flex items-center justify-center">    
        {sliders.map((slide, index) => {
          const offset = index - currentIndex;
          const isActive = index === currentIndex;
          const isVisible = Math.abs(offset) <= 2;

          return (
            <div 
              className={`absolute transition-all ease-in-out ${
                isTransitioning ? 'duration-500' : 'duration-700'
              }`}
              key={slide.id}
              style={{
                transform: `translateX(${offset * 290}px) scale(${isActive ? 1.2 : 0.85})`,
                zIndex: sliders.length - Math.abs(offset),
                opacity: isVisible ? (isActive ? 1 : 0.6) : 0,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="relative">
                <img
                  src={slide.image}
                  alt={slide.text}
                  className="w-[350px] h-[650px] object-cover mx-4 rounded-lg shadow-2xl"
                  loading="lazy"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 mx-4 rounded-b-lg">
                  <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                    {slide.text}
                  </h1>
                </div>
              </div>    
            </div>        
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-black w-8' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>  
    </section>
  )
}

export default Hero