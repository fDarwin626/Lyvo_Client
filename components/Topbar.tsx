"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useCreditBalance } from '@/app/contexts/CreditContext';
import SupportChatWidget from './chat/SupportChatWidget';

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const [timeColors, setTimeColors] = useState('');
  const [timeIcon, setTimeIcon] = useState('');
  const [showChat, setShowChat] = useState(false); // ✅ Control chat state

  const { theme, toggleTheme } = useTheme();
  const { userName, isLoading} = useCreditBalance();

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
    <header className="h-12 sm:h-14 lg:h-16 border-b border-default bg-background 
    flex items-center justify-between px-3 sm:px-4 lg:px-6">
      {/* LEFT SIDE - Greeting */}
      <div className="">
        <p className='text-xs lg:text-sm text-secondary'>My WorkSpace</p>
        <h2 className={`text-lg sm:text-xl lg:text-3xl flex font-amiamie items-center gap-1 sm:gap-2 font-semibold ${timeColors}`}>
          <span className='hidden sm:inline'>{greeting}</span>,
          <span className='text-primary capitalize font-amiamie'>
            {isLoading ? 'Loading...' : userName}
          </span>
           <Icon icon={timeIcon} width="30" height="30" className={`sm:w-10 sm:h-10 lg:w-[50px] lg:h-[50px] ${timeColors}`} />
        </h2>
      </div>  

      {/* RIGHT SIDE - Actions */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Dark And Light Mode Toggle */}
       { /* <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Icon icon="mdi:white-balance-sunny" width="20" height="20" className="sm:w-6 sm:h-6 text-yellow-400" />
          ) : (
            <Icon icon="mdi:moon-waning-crescent" width="20" height="20" className="sm:w-6 sm:h-6 text-primary" />
          )}
        </button> */}

        {/* ✅ Your TopBar Button - Controls the widget */}
        <button 
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1 bg-white dark:bg-surface
           text-black dark:text-primary 
            border border-gray-400 dark:border-gray-600 rounded-full hover:bg-gray-800 hover:text-white 
            dark:hover:bg-gray-700 transition-colors font-amiamie font-extralight text-xs sm:text-sm lg:text-base"
        >
          <Icon icon="mdi:message-text" width="16" height="16" className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium">
            {showChat ? 'Close Chat' : 'Talk to Lyvo'}
          </span>
          <span className="sm:hidden font-medium">Chat</span>
        </button>

        {/* ✅ Widget with external control */}
        <SupportChatWidget 
          isOpen={showChat}
          onToggle={() => setShowChat(!showChat)}
        />
      </div>
    </header>
  )
}