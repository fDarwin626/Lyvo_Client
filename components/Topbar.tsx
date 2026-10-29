"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useCreditBalance } from '@/app/contexts/CreditContext';
import SupportChatWidget from './chat/SupportChatWidget';

export default function TopBar() {
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { userName, isLoading } = useCreditBalance();

  // Greet users based on time of day — icon changes, color stays on-brand
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
      setTimeIcon('ph:sun-horizon-bold');
    } else if (hour < 16) {
      setGreeting("Good afternoon");
      setTimeIcon('ph:sun-bold');
    } else {
      setGreeting("Good evening");
      setTimeIcon('ph:moon-stars-bold');
    }
  }, []);

  return (
    <header className="h-12 sm:h-14 lg:h-16 border-b border-default bg-background
    flex items-center justify-between px-3 sm:px-4 lg:px-6">
      {/* LEFT SIDE - Greeting */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border border-default flex items-center justify-center flex-shrink-0">
          <Icon
            icon={timeIcon}
            width="16"
            height="16"
            className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5 text-accent"
          />
        </div>
        <div>
          <p className="text-[10px] lg:text-[11px] tracking-[0.15em] uppercase text-muted leading-none mb-1">
            My workspace
          </p>
          <h2 className="text-base sm:text-lg lg:text-xl font-[ArchivoBlack] tracking-tight text-primary flex items-center gap-1.5">
            <span className="hidden sm:inline text-secondary font-normal font-sans">{greeting},</span>
            <span className="capitalize">{isLoading ? 'Loading…' : userName}</span>
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE - Actions */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Dark / light mode toggle — left as-is, not wired up */}
        {/* <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-surface transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Icon icon="mdi:white-balance-sunny" width="20" height="20" className="sm:w-6 sm:h-6 text-accent" />
          ) : (
            <Icon icon="mdi:moon-waning-crescent" width="20" height="20" className="sm:w-6 sm:h-6 text-primary" />
          )}
        </button> */}

        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-full border text-xs sm:text-sm font-medium transition-colors ${
            showChat
              ? 'border-accent text-accent bg-accent-soft'
              : 'border-default text-secondary hover:text-primary hover:border-[rgb(var(--text-primary))]'
          }`}
        >
          <Icon icon="mdi:message-text-outline" width="16" height="16" />
          <span className="hidden sm:inline">{showChat ? 'Close chat' : 'Talk to Lyvo'}</span>
          <span className="sm:hidden">Chat</span>
        </button>

        <SupportChatWidget
          isOpen={showChat}
          onToggle={() => setShowChat(!showChat)}
        />
      </div>
    </header>
  );
}