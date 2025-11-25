"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeColors, setTimeColors] = useState('');
  const [timeIcon, SetTimeIcon] = useState('');

  // Greet users Based on Time of day 
  useEffect(() => {
    const hour = new Date().getHours();
    if(hour < 12){
        setGreeting("Good Morning");
        setTimeColors("text-[#A7D8FF]");
        SetTimeIcon('meteocons:time-late-morning-fill');
    }else if (hour < 16 ){
        setGreeting("Good Afternoon");
        setTimeColors("text-[#FF5C00]");
        SetTimeIcon('meteocons:clear-day-fill')
    }else{
        setGreeting("Good Evening")
        setTimeColors("text-secondary")
        SetTimeIcon('meteocons:extreme-night-hail')

    }
  }, [])
    return (
    <header className="h-16 border-b border-default
     bg-background flex items-center justify-between px-6">
     {/* LEFT SIDE - Greeting */}
          <div className="">
             <p className='text-sm text-secondary mt-3'>My WorkSpace</p>
            <h2 className={`text-3xl flex font-amiamie items-center gap-2 font-semibold ${timeColors}`}>
             {greeting}<span className='text-primary'>,</span>
             <span className='text-primary'>CoCoNuT</span>
             <Icon icon={timeIcon} width="50" height="50" className={timeColors} />
 
           </h2>
          </div>  

     {/* RIGHT SIDE - Actions */}
        <div className="flex items-center gap-4">
             {/* Dark  And Light Mode Toggle */}
             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
               aria-label="Toggle dark mode"
            >
            {isDarkMode ? (
              <Icon icon="mdi:white-balance-sunny" width="24" height="24" className="text-black" />
            ) : (
             <Icon icon="mdi:moon-waning-crescent" width="24" height="24" className="text-primary" />
            )}
             </button>

     {/* Talk to Lyvo Button */}
        <button className="flex items-center gap-2 px-4  py-1 bg-whitw text-black 
         border border-gray-400 rounded-full hover:bg-opacity-90 transition-colors
         font-amiamie font-extralight  hover:bg-gray-800 hover:text-white">
          <Icon icon="mdi:message-text" width="20" height="20" />
          <span className="font-medium">Talk to Lyvo</span>
        </button>
        </div>
    </header>
    )
}

