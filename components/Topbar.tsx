"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/app/contexts/ThemeContext'; // ADD THIS

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const [timeColors, setTimeColors] = useState('');
  const [timeIcon, setTimeIcon] = useState('');
  
  const { theme, toggleTheme } = useTheme(); // USE THEME CONTEXT

  // Greet users Based on Time of day 
  useEffect(() => {
    const hour = new Date().getHours();
    if(hour < 12){
        setGreeting("Good Morning");
        setTimeColors("text-[#A7D8FF]");
        setTimeIcon('meteocons:time-late-morning-fill');
    }else if (hour < 16 ){
        setGreeting("Good Afternoon");
        setTimeColors("text-[#FF5C00]");
        setTimeIcon('meteocons:clear-day-fill')
    }else{
        setGreeting("Good Evening")
        setTimeColors("text-secondary")
        setTimeIcon('meteocons:extreme-night-hail')
    }
  }, [])

  return (
    <header className="h-16 border-b border-default bg-background flex items-center justify-between px-6">
      {/* LEFT SIDE - Greeting */}
      <div className="">
        <p className='text-sm text-secondary'>My WorkSpace</p>
        <h2 className={`text-3xl flex font-amiamie items-center gap-2 font-semibold ${timeColors}`}>
          {greeting}<span className='text-primary'>,</span>
          <span className='text-primary'>CoCoNuT</span>
          <Icon icon={timeIcon} width="50" height="50" className={timeColors} />
        </h2>
      </div>  

      {/* RIGHT SIDE - Actions */}
      <div className="flex items-center gap-4">
        {/* Dark And Light Mode Toggle */}
        <button
          onClick={toggleTheme} // TRIGGER THEME CHANGE
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Icon icon="mdi:white-balance-sunny" width="24" height="24" className="text-yellow-400" />
          ) : (
            <Icon icon="mdi:moon-waning-crescent" width="24" height="24" className="text-primary" />
          )}
        </button>

        {/* Talk to Lyvo Button */}
        <button className="flex items-center gap-2 px-4 py-1 bg-white dark:bg-surface text-black dark:text-primary 
          border border-gray-400 dark:border-gray-600 rounded-full hover:bg-gray-800 hover:text-white 
          dark:hover:bg-gray-700 transition-colors font-amiamie font-extralight">
          <Icon icon="mdi:message-text" width="20" height="20" />
          <span className="font-medium">Talk to Lyvo</span>
        </button>
      </div>
    </header>
  )
}