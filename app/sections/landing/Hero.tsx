"use client"

import { useState, useEffect, useRef } from "react"

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoaded, setIsLoaded] = useState<Record<string, boolean>>({});
  const [allLoaded, setAllLoaded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sliders = [
    {id: 1, image: '/images/hero/automation.jpg', text:'Automate Your Workflow'},
    {id: 2, image: '/images/hero/script.jpg', text:'Voice over for your scripts'},
    {id: 3, image: '/images/hero/teen-content.jpg', text: 'Create Engaging Contents'},
    {id: 4, image: '/images/hero/success.jpg', text:'Tell a story using Lyvo'},
    {id: 5, image: '/images/podcast.jpg', text: "Handle your podcast scripts"},
    {id: 6, image: '/images/audiobook.jpg', text:'Voice over for AudioBooks'},
  ];

  // Preload images
  useEffect(() => {
    const loadImage = (src: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setIsLoaded(prev => ({ ...prev, [src]: true }));
          resolve();
        };
        img.onerror = () => {
          setIsLoaded(prev => ({ ...prev, [src]: true }));
          resolve();
        };
        img.src = src;
      });
    };

    Promise.all(sliders.map(slide => loadImage(slide.image)))
      .then(() => setAllLoaded(true));
  }, []);

  useEffect(() => {
    if (!allLoaded) return;

    const duration = 3000;
    
    timerRef.current = setTimeout(() => {
      setCurrentIndex((current) => {
        const nextIndex = current + direction;
        
        if (nextIndex >= sliders.length - 1) {
          setDirection(-1);
          return sliders.length - 1;
        }
        
        if (nextIndex <= 0) {
          setDirection(1);
          return 0;
        }
        
        return nextIndex;
      });
    }, duration);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, direction, sliders.length, allLoaded]);

  const handleDotClick = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex(index);
  };

  if (!allLoaded) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex flex-col mt-4 overflow-hidden px-4">
      <div className="relative w-full h-[500px] md:h-[650px] flex items-center justify-center overflow-visible">    
        {sliders.map((slide, index) => {
          const offset = index - currentIndex;
          const isActive = index === currentIndex;
          const absOffset = Math.abs(offset);

          // Don't render slides that are too far away
          if (absOffset > 2) return null;

          return (
            <div 
              className="absolute will-change-transform transition-all duration-700 ease-in-out"
              key={slide.id}
              style={{
                transform: `translateX(${offset * 90}%) translateX(${offset * 20}px) scale(${isActive ? 1 : 0.85})`,
                zIndex: sliders.length - absOffset,
                opacity: absOffset > 1 ? 0.3 : 1,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="relative">
                <img
                  src={slide.image}
                  alt={slide.text}
                  className="w-[280px] h-[400px] md:w-[450px] 
                  md:h-[550px] lg:h-[650px] object-cover rounded-b-lg shadow-2xl"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 md:p-6 rounded-b-lg">
                  <h2 className="text-white text-lg md:text-2xl font-bold tracking-tight drop-shadow-lg">
                    {slide.text}
                  </h2>
                </div>
              </div>    
            </div>        
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-8 md:mt-12">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className="relative w-3 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index === currentIndex ? '#000' : '#d1d5db',
              transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>  
    </section>
  );
};

export default Hero;