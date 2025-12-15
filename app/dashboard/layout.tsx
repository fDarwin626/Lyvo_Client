"use client";
import { ReactNode, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { CreditProvider } from '../contexts/CreditContext';
import { Icon } from '@iconify/react';

export default function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  return (
    <CreditProvider>
      <div className="h-screen bg-background flex overflow-hidden">
        
        {/* Mobile Overlay - only shows on mobile when sidebar is open */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-700/30 bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR COMPONENT - 60% width on mobile, slides in from left */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-[60%] lg:w-auto
        `}>
          <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        </div>

        {/* MAIN AREA - Right side */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          
          {/* Mobile Menu Bar - Only shows on mobile (below lg breakpoint) */}
          <div className="lg:hidden h-14 border-b border-default bg-surface flex items-center justify-between px-4">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Icon icon="mingcute:menu-fill" width="24" height="24" />
            </button>
            <h1 className="text-lg font-bold" style={{ fontFamily: 'Cal Sans, sans-serif' }}>
              Lyvo
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* CONTENT - This changes based on route */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            {children}
          </main>
          
        </div>
      </div>
    </CreditProvider>
  );
}