"use client";
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/Topbar';


export default function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  
  return (
    <div className="min-h-screen bg-background flex">
      
      {/* SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN AREA - Right side */}
      <div className="flex-1 flex flex-col">
        
        {/* TOP BAR COMPONENT */}
        <TopBar />

        {/* CONTENT - This changes based on route */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        
      </div>
    </div>
  );
}