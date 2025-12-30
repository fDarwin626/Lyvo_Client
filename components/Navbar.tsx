"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="top-0 w-full bg-surface/80 backdrop-blur-md z-50 border-b border-default">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo with Cal Sans */}
        <div 
          className="lg:text-3xl text-2xl font-semibold tracking-tight" 
          style={{ fontFamily: 'Cal Sans, sans-serif' }}
        >
          Lyvo
        </div>
        
        {/* Desktop - 3 buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button 
          onClick={() => router.push('/auth/signin')}
          className="px-5 py-2 text-primary hover:bg-gray-50 rounded-lg 
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
          className="px-5 py-2 bg-black text-white rounded-lg
           hover:bg-gray-800 transition-colors text-sm font-medium tracking-tighter">
            Contact Us
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-gray-800" />
          ) : (
            <Menu className="w-5 h-5 text-gray-800" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-default bg-surface/80 backdrop-blur-md">
          <div className="py-2 px-6 flex flex-col gap-2">
            <button 
            onClick={() => {
              router.push('/auth/signin');
              setIsMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-primary hover:bg-gray-50 rounded-lg 
            transition-colors text-sm font-medium font-amiamie text-left">
              Log in
            </button>
            <button 
            onClick={() => {
              router.push('/auth/signup');
              setIsMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-primary hover:bg-gray-50 rounded-lg
            font-amiamie transition-colors text-sm font-medium border border-default text-left">
              Sign in 
            </button>
            <button 
            onClick={() => {
              router.push('/sections/contact');
              setIsMenuOpen(false);
            }}
            className="w-full px-4 py-2 bg-black text-white rounded-lg
             hover:bg-gray-800 transition-colors text-sm font-medium tracking-tighter text-left">
              Contact Us
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}