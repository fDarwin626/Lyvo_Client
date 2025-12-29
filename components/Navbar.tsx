"use client"
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full bg-surface/80 backdrop-blur-md z-50 border-b border-default">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo with Cal Sans */}
        <div 
          className="lg:text-3xl font-2xl font-semibold tracking-tight" 
          style={{ fontFamily: 'Cal Sans, sans-serif' }}
        >
          Lyvo
        </div>
        
        {/* Right side - 3 buttons */}
        <div className="flex items-center lg:gap-3  gap-4 ">
          <button 
          onClick={() => router.push('/auth/signin')}
          className="lg:px-5 px-2 py-2 text-primary hover:bg-gray-50 rounded-lg 
          transition-colors text-sm font-medium font-amiamie">
            Log in
          </button>
          <button 
          onClick={() => router.push('/auth/signup')}
          className="px-5 py-2 text-primary hover:bg-gray-50 rounded-lg
          font-amiamie transition-colors text-sm font-medium border border-default">
            Sign in 
          </button>
          <button 
          onClick={() => router.push('/sections/contact')}
          className="lg:px-5 px-2 py-2 bg-black text-white rounded-lg
           hover:bg-gray-800 transition-colors text-sm lg:font-medium font-normal tracking-tighter">
            Contact Us
          </button>
        </div>
      </div>
    </nav>
  );
}