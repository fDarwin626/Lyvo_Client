"use client"
import { ReactNode } from "react";


export default function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {

  return (
    <div className="min-h-screen bg-background flex">
      {/* SIDEBAR - Left side*/}
       <aside className="w-70 bg-surface border-r border-default">
        <div className="p-4">
            <h2 className="text xl font-bold">
                Lyvo
            </h2>
            <p className="text-sm text-secondary mt-2">Navigation will go here</p>
        </div>
       </aside>
       {/* MAIN AREA - Right side */}
      <div className="flex-1 flex flex-col">
        
        {/* TOP BAR - Stays fixed */}
        <header className="h-16 border-b border-default bg-background flex items-center px-6">
          <h2 className="text-lg font-semibold">Top Bar</h2>
        </header>

        {/* CONTENT - This changes based on route */}
        <main className="flex-1 p-6">
          {children}
        </main>
        
      </div>


    </div>
  )  
}
