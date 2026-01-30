"use client"
import RippleGrid from "@/components/RippleGrid"
import { useRouter } from "next/navigation";
import Link from 'next/link';

const Footer = () => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  
  return (

    <section className="min-h-screen mt-70">
        <div className="relative w-full h-[500px] mt-10">
     <RippleGrid
      enableRainbow={false}
      gridColor="#3b82f6"
      rippleIntensity={0.05}
      gridSize={10}
      gridThickness={15}
      mouseInteraction={true}
      mouseInteractionRadius={1.2}
      opacity={0.8}
    />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="backdrop-blur-md  bg-white/10 border border-white/20 
          rounded-3xl p-8 max-w-md w-full shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center mb-25">
              <img src="/images/hero/Icon.png" alt="lyvo logo"  className="w-30 h-20 object-contain"/>
            </div>
            
            {/* Heading */}
            <h2 className="text-4xl  font-amiamie font-bold text-center text-black mb-10">
              Created with You in mind
            </h2>

            <button 
              onClick={() => router.push('/auth/signup')}

            className="w-full bg-black text-gray-200 font-bold
            font-amiamie py-4 rounded-full hover:bg-gray-800 transition-colors mb-4">
            GET STARTED FREE
            </button>
             <p className="text-center text-gray/70 text-sm">
            Already have an account? <Link
            href="auth/signin"
            className="text-blue-700 hover:underline cursor-pointer"
            >Log in</Link>
            </p>
          </div>
        </div>       
      </div>
<div className="w-full border-t border-gray-300 mt-30"></div>

{/* Footer */}
<footer className="w-full py-8 px-4">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
    {/* Left side - Brand and Copyright */}
    <div className="flex items-center gap-8">
      <h3 className="text-xl font-bold">LYVO</h3>
      <p className="text-sm text-gray-600">© {currentYear} CoCoNuTStudios</p>
    </div>
    
    {/* Right side - Links */}
    <div className="flex gap-6 text-sm">
      <a href="/" className="text-gray-600 hover:text-black transition-colors">Privacy</a>
      <a href="/" className="text-gray-600 hover:text-black transition-colors">Terms</a>
      <a href="/" className="text-gray-600 hover:text-black transition-colors">Safety</a>
      <a href="/" className="text-gray-600 hover:text-black transition-colors">Modify cookies</a>
    </div>
  </div>
</footer>
    </section>
  )
}

export default Footer