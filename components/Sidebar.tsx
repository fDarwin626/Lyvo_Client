"use client";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap'; 
import { Loader2 } from 'lucide-react';
import { useCreditBalance } from '@/app/contexts/CreditContext';


interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { tierName, totalCredits, percentage, isLoading, error, planTier, userName, userEmail  } = useCreditBalance();
  const router = useRouter();

  const logoRef = useRef(null);
  const navItemsRef = useRef<HTMLDivElement[]>([]);
  const sectionsRef = useRef<HTMLParagraphElement[]>([]);
  const creditRef = useRef(null);
  const profileTextRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    if (isCollapsed) {
      // COLLAPSING ANIMATION (fast fade out)
      const elementsToAnimate = [
        logoRef.current, 
        ...navItemsRef.current, 
        ...sectionsRef.current, 
        creditRef.current, 
        profileTextRef.current
      ].filter(el => el !== null);

      if (elementsToAnimate.length > 0) {
        gsap.to(elementsToAnimate, {
          opacity: 0,
          x: -20,
          duration: 0.2,
          ease: "power2.in"
        });
      }
    } else {
      // EXPANDING ANIMATION (staggered fade in)
      
      // Logo slides in
      if (logoRef.current) {
        gsap.fromTo(logoRef.current, 
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
        );
      }

      // Nav items stagger in
      const validNavItems = navItemsRef.current.filter(el => el !== null);
      if (validNavItems.length > 0) {
        gsap.fromTo(validNavItems,
          { opacity: 0, x: -20 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.1
          }
        );
      }

      // Section headers fade in
      const validSections = sectionsRef.current.filter(el => el !== null);
      if (validSections.length > 0) {
        gsap.fromTo(validSections,
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: 0.3,
            stagger: 0.1,
            delay: 0.2
          }
        );
      }

      // Credit circle scales up
      if (creditRef.current) {
        gsap.fromTo(creditRef.current,
          { opacity: 0, scale: 0.8 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.5,
            ease: "back.out(1.7)",
            delay: 0.3
          }
        );
      }

      // Profile text slides in
      if (profileTextRef.current) {
        gsap.fromTo(profileTextRef.current,
          { opacity: 0, x: -20 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.4,
            ease: "power2.out",
            delay: 0.2
          }
        );
      }
    }
  }, [isCollapsed]);

  // Helper function to check if link is active
  const isActive = (path: string) => pathname === path;

  const addNavRef = (index: number) => (el: HTMLSpanElement | null) => {
    if (el) navItemsRef.current[index] = el as any;
  };

  
return (
  <aside className={`${isCollapsed ? 'w-20' : 'w-full lg:w-64'} bg-surface border-r border-default
         flex flex-col h-full transition-all duration-300 ease-in-out`}>      
    {/* LOGO at top */}
    <div className="p-4 border-default flex items-center justify-between">
      {/* Logo Text - hide when collapsed */}
      {!isCollapsed && (
        <div className="flex items-center gap-2">
          <h1 ref={logoRef}
            className="text-2xl font-bold" style={{ fontFamily: 'Cal Sans, sans-serif' }}>
            Lyvo
          </h1>
          {/* Premium badge - show crown for tier 2 users */}
          {planTier === 2 && (
            <Icon 
              icon="fluent:premium-person-16-regular" 
              width="17" 
              height="17" 
              className="text-[#D4AF37]"
            />
          )}
        </div>
      )}
      
      
      {/* Toggle Button - Different behavior on mobile vs desktop */}
      <button
        ref={toggleBtnRef}
        onClick={() => {
          // Add bounce animation to button
          gsap.to(toggleBtnRef.current, {
            scale: 1.2,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          });
          
          // On mobile: close the sidebar (slide it off-screen)
          // On desktop: toggle collapse state
          if (window.innerWidth < 1024) {
            onCloseMobile?.();
          } else {
            setIsCollapsed(!isCollapsed);
          }
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Icon 
          icon={isCollapsed ? "mingcute:menu-fill" : "mingcute:close-fill"} 
          width="18" 
          height="18" 
        />
      </button>
    </div>
      {/* NAVIGATION MENU */}
      <nav className="flex-1 p-4 overflow-y-auto">
        
        {/* Home Section */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 
                rounded-lg transition-colors ${
              isActive('/dashboard') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="streamline-freehand-color:home-chimney-2"
            width="24" height="24" /></span>
            {!isCollapsed && <span ref={addNavRef(0)}>Home</span>}
          </Link>

          <Link 
            href="/dashboard/voices"
            className={`flex items-center mt-3 ${isCollapsed ? 'justify-center' : 'gap-3'} 
            px-3 py-2 rounded-lg transition-colors ${
              isActive('/dashboard/voices') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="twemoji:computer-disk" width="28" height="28" /></span>
            {!isCollapsed && <span ref={addNavRef(1)}>Models</span>}
          </Link>
        </div>

        {/* Playground Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <p ref={(el) => {if (el) sectionsRef.current[0] = el}} className="text-xs font-semibold text-secondary uppercase mb-2 px-3">
              Playground
            </p>
          )}          
          <Link 
            href="/dashboard/generate"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/generate') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="ri:text-to-speech-line"
             width="25" height="25" className="color: #997aca" /></span>
            {!isCollapsed && <span ref={addNavRef(2)}>Text to Speech</span>}
          </Link>

          <Link 
            href="/dashboard/create_agent"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/voice-swap') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="arcticons:landroid" width="28" height="28" /></span>
            {!isCollapsed && <span ref={addNavRef(3)}>Agents</span>}
          </Link>

          <Link 
            href="/dashboard/speech-to-text"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/speech-to-text') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="mdi:text-to-speech-off" width="24" height="24" className="color: #2a2d6f" /></span>
            {!isCollapsed && <span ref={addNavRef(4)}>Speech to Text</span>}
          </Link>
        </div>

        {/* PRODUCT Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <p ref={(el) => {if (el) sectionsRef.current[1] = el}} className="text-xs font-semibold text-secondary uppercase mb-2 px-3">
              Products
            </p>
          )}
          <Link 
            href="/dashboard/voice-cloning"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}
             px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/voice-cloning') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="noto:cyclone" width="22" height="22" /></span>
            {!isCollapsed && <span ref={addNavRef(5)}>Voice Cloning</span>}
          </Link>
          
          <Link 
            href="/dashboard/dubbing"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/dubbing') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="file-icons:dub" width="25" height="25" className="color: #2a2d6f" /></span>
            {!isCollapsed && <span ref={addNavRef(6)}>Dubbing</span>}
          </Link>

          <Link 
            href="/dashboard/creators"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/creators') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="marketeq:bug" width="28" height="25" className="color: #828282" /></span>
            {!isCollapsed && <span ref={addNavRef(7)}>Report Bug</span>}
          </Link>

          <Link 
            href="/dashboard/notifications"
            className={`flex items-center mt-5 ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/notifications') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="solar:bell-broken" width="24" height="24" className="color: #828282" /></span>
            {!isCollapsed && <span ref={addNavRef(8)}>Notification</span>}
          </Link>

          <Link 
            href="/dashboard/history"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/history') 
                ? 'bg-gray-100 text-secondary' 
                : 'text-secondary hover:bg-gray-100'
            }`}
          >
            <span><Icon icon="solar:history-2-broken" width="24" height="24" className=" #e8be3e" /></span>
            {!isCollapsed && <span ref={addNavRef(9)}>History</span>}
          </Link>

          {/* Upgrade Button */}
          <div className="mt-7 px-1">
            <button
              onClick={() => router.push('/dashboard/upgrade')}
             className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' :
               'justify-center gap-2 px-4'} py-1 bg-white border border-black rounded-lg
                hover:bg-gray-800 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]`}>
              <Icon icon="fluent:premium-20-regular" width="20" height="20" className="text-[#D4AF37]" />
              {!isCollapsed && <span className="font-medium">Upgrade</span>}
            </button>
          </div>
        </div>  

        {/* Circular Credit Display - Hide when collapsed */}
        {!isCollapsed && (
          <div ref={creditRef} className="mt-6 px-3 mb-20">
            <div className="bg-background rounded-lg p-4 border border-default flex flex-col items-center">
              {isLoading ? (
                // LOADING STATE
                <div className="w-24 h-24 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                // ERROR STATE
                <div className="text-center">
                  <p className="text-xs text-red-500 mb-2">Failed to load credits</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                // SUCCESS STATE - SHOW DYNAMIC CREDITS
                <>
                  {/* Circular Progress */}
                  <div className="relative w-24 h-24 mb-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <defs>
                        <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF1493" />
                          <stop offset="50%" stopColor="#FF69B4" />
                          <stop offset="100%" stopColor="#9D50FF" />
                        </linearGradient>
                      </defs>
                      
                      {/* Background Circle */}
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-gray-200"
                      />
                      
                      {/* Progress Circle - DYNAMIC */}
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="url(#creditGradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-brand transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Center Text - DYNAMIC PERCENTAGE */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-amiamie text-primary">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Info Text - DYNAMIC BALANCE */}
                  <div className="text-center">
                    <p className="text-xs font-medium text-secondary mb-1">Credits Remaining</p>
                    <p className="text-sm font-semibold text-primary">
                      {totalCredits.toLocaleString()} <span className='text-[#D4AF37]'>/</span> {totalCredits.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

        {/* USER PROFILE at bottom */}
<div ref={profileTextRef} className="p-4 border-t border-default">
  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
    {/* **REPLACE THIS** - Dynamic avatar with first letter of email */}
    <div className="w-10 h-10 rounded-full bg-brand flex items-center 
    justify-center text-white font-semibold uppercase">
      {userEmail ? userEmail[0] : 'U'}
    </div>
    {!isCollapsed && (
      <div className="flex-1">
        {/* **REPLACE THIS** - Show actual username */}
        <p className="text-sm font-medium capitalize">{userName}</p>
        <p className="text-xs text-secondary">My Workspace</p>
      </div>
    )}
  </div>
</div>
    </aside>
  );
}