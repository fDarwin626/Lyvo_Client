"use client"
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full bg-surface/80 backdrop-blur-md z-50 border-b border-default">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo with Cal Sans */}
        <div 
          className="text-3xl font-semibold tracking-tight" 
          style={{ fontFamily: 'Cal Sans, sans-serif' }}
        >
          Lyvo
        </div>
        
        {/* Right side - 3 buttons */}
        <div className="flex items-center gap-3">
          <button 
          onClick={() => router.push('/auth/signin')}
          className="px-5 py-2 text-primary hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium">
            Log in
          </button>
          <button 
          onClick={() => router.push('/auth/signup')}
          className="px-5 py-2 text-primary hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium border border-default">
            Sign in 
          </button>
          <button className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            Get started for free
          </button>
        </div>
      </div>
    </nav>
  );
}