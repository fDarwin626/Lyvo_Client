"use client";
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';


export default function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* ^^^ CHANGE: h-screen + overflow-hidden (locks outer container) */}
      
      {/* SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN AREA - Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ^^^ ADD: overflow-hidden */}
        
        {/* TOP BAR COMPONENT (if you uncomment it later) */}

        {/* CONTENT - This changes based on route */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* ^^^ This already has overflow-y-auto - PERFECT! */}
          {children}
        </main>
        
      </div>
    </div>
  );
}