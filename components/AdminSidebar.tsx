"use client";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap'; 
import { Loader2 } from 'lucide-react';
import { useCreditBalance } from '@/app/contexts/CreditContext';


interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
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
  <aside className={`${isCollapsed ? 'w-20' : 'w-full lg:w-64'}  bg-[#0207248c] border-r border-default
         flex flex-col h-full transition-all duration-300 ease-in-out`}>      
    {/* LOGO at top */}
    <div className="p-4 border-default flex items-center justify-between">
      {/* Logo Text - hide when collapsed */}
      {!isCollapsed && (
        <div className="flex items-center gap-2">
          <h1 ref={logoRef}
            className="text-2xl font-bold font-amiamie-round text-gray-300">
            Lyvo Admin
          </h1> 
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
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Icon 
          icon={isCollapsed ? "mingcute:menu-fill" : "mingcute:close-fill"} 
          className='text-gray-400'
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
            href="/admin"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 
                rounded-lg transition-colors ${
              isActive('/admin') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="mage:dashboard-bar"
            width="24" height="24" className='text-white' /></span>
            {!isCollapsed && <span ref={addNavRef(0)}>Dashboard</span>}
          </Link>

          <Link 
            href="/admin/users"
            className={`flex items-center mt-3 ${isCollapsed ? 'justify-center' : 'gap-3'} 
            px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/users') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="fa6-solid:users-gear" width="24" height="24" /></span>
            {!isCollapsed && <span ref={addNavRef(1)}>Manage Users</span>}
          </Link>

            <Link 
            href="/admin/payments"
            className={`flex items-center mt-3 ${isCollapsed ? 'justify-center' : 'gap-3'} 
            px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/payments') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="clarity:coin-bag-line" width="23" height="23" /></span>
            {!isCollapsed && <span ref={addNavRef(1)}>Transactions</span>}
          </Link>

        </div>

        {/* Playground Section */}
        <div className="mb-3">
          {!isCollapsed && (
            <p ref={(el) => {if (el) sectionsRef.current[0] = el}} className="text-xs font-semibold text-secondary uppercase mb-2 px-3">
              Voice Managment
            </p>
          )}          
          <Link 
            href="/admin/voices"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/voices') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="iconoir:voice-scan"
             width="24" height="24" className="color: #997aca" /></span>
            {!isCollapsed && <span ref={addNavRef(2)}>Voice Managment</span>}
          </Link>

          <Link 
            href="/admin/clone-voice"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}
             px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/clone-voice') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="streamline-plump:voice-scan-1" width="22" height="22" /></span>
            {!isCollapsed && <span ref={addNavRef(3)}>Clone New Voice</span>}
          </Link>

          <Link 
            href="/admin/preview-editor"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/preview-editor') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="material-symbols-light:edit-note-outline" width="30" height="30" className="color: #2a2d6f" /></span>
            {!isCollapsed && <span ref={addNavRef(4)}>Edit Voice Perview</span>}
          </Link>

       </div>

        {/* Others Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <p ref={(el) => {if (el) sectionsRef.current[1] = el}} className="text-xs font-semibold text-secondary uppercase mb-2 px-3">
              Others
            </p>
          )}
          <Link 
            href=""
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}
             px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/dashboard/voice-cloning') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="lets-icons:question-duotone" width="24" height="24" /></span>
            {!isCollapsed && <span ref={addNavRef(5)}>Bot Questions</span>}
          </Link>
          
          <Link 
            href="/admin/tickets"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/tickets') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="famicons:ticket-sharp" width="25" height="25" className="color: #2a2d6f" /></span>
            {!isCollapsed && <span ref={addNavRef(6)}>Support Tickets</span>}
          </Link>

          <Link 
            href="/admin/bugs"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/bugs') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="marketeq:bug" width="28" height="25" className="color: #828282" /></span>
            {!isCollapsed && <span ref={addNavRef(7)}>Report Bug</span>}
          </Link>

          <Link 
            href="/admin/notifications"
            className={`flex items-center mt-5 ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/notifications') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="solar:bell-broken" width="24" height="24" className="color: #828282" /></span>
            {!isCollapsed && <span ref={addNavRef(8)}>Notification</span>}
          </Link>

          <Link 
            href="/admin/history"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive('/admin/history') 
                ? 'bg-gray-800 text-gray-300' 
                : 'text-secondary hover:bg-gray-700'
            }`}
          >
            <span><Icon icon="solar:history-2-broken" width="24" height="24" className=" #e8be3e" /></span>
            {!isCollapsed && <span ref={addNavRef(9)}>History</span>}
          </Link>
      </div>
      </nav>

    </aside>
  );
}