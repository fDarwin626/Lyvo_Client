"use client"

import { useState, useEffect } from "react"

const Hero = () => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const sliders = [
    {id: 1, image: '/images/hero/automation.jpg', text:'Automate Your Workflow'},
    {id: 2, image: '/images/hero/script.jpg', text:'Voice over for your scripts'},
    {id: 3, image: '/images/hero/teen-content.jpg', text: 'Create Engaging Contents'},
    {id: 4, image: '/images/hero/success.jpg', text:'Tell a story using Lyvo'},
    {id:5, image: '/images/podcast.jpg', text: "Handle your podcast scrips"},
    {id: 6, image: '/images/audiobook.jpg', text:'Voice over for AudioBooks'},
  ]

  useEffect(() => {
    const duration = 3000; // 3 seconds per slide
    
    const timer = setTimeout(() => {
      setCurrentIndex((current) => {
        const nextIndex = current + direction;
        
        // If we've reached the end, reverse direction
        if (nextIndex >= sliders.length - 1) {
          setDirection(-1);
          return sliders.length - 1;
        }
        
        // If we've reached the beginning, reverse direction
        if (nextIndex <= 0) {
          setDirection(1);
          return 0;
        }
        
        return nextIndex;
      });
    }, duration);
    
    return () => clearTimeout(timer);
  }, [currentIndex, direction, sliders.length]);

  return (
    <section className="min-h-screen flex flex-col mt-4 overflow-hidden px-4">
        <div className="relative w-full h-[500px] flex items-center justify-center overflow-visible">    
          {sliders.map((slide, index) => {
            const offset = index - currentIndex
            const isActive = index === currentIndex

            return(
              <div className="absolute transition-all duration-500 ease-out"
              key={slide.id}
              style={{
                transform: `translateX(${offset * 290}px) scale(${isActive ? 1.2 : 0.85})`,
                zIndex: sliders.length - Math.abs(offset),
                opacity: Math.abs(offset) > 2 ? 0 : 1,
              }}
                 >
                  <div className="relative">
                  <img
                    src={slide.image}
                    className="w-[350px] h-[650px] object-cover mx-4 rounded-lg shadow-2xl"
                  />

             <div className="absolute bottom-0 left-0 right-0 text-black/25 p-6 mx-4 rounded-b-lg
             text-3xl font-bold tracking-tight"
               >
              <h1 className="text-2xl">{slide.text}</h1>
            </div>
         
              </div>    
          </div>        
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-50">
        {sliders.map((_, index) => (
          <button
          key={index}
          onClick={() => {
            setCurrentIndex(index);
            setProgress(0);
          }}
          className="relative w-3 h-3 rounded-full bg-gray-300"
          >
            {index === currentIndex && (
              <svg className="absolute inset-0 -rotate-90"
              viewBox="0 0 12 12">
              <circle
                cx="6"
                cy="6"
                r="5"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 5}`}
                strokeDashoffset={`${2 * Math.PI * 5 * (1 - progress / 100)}`}
                className="transition-all duration-100"
              />
              </svg>
           
            )}

          </button>
        ))}
      </div>  
    </section>
  )
}

export default Hero