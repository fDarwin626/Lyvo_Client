"use client"
import RippleGrid from "@/components/RippleGrid"
import { useRouter } from "next/navigation"
import Link from 'next/link'

const Footer = () => {
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  return (
    <section className="relative w-full bg-[#e8e7e4]/40 overflow-hidden">

      {/* grid, matches the rest of the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#000 2px,transparent 2px),linear-gradient(90deg,#000 2px,transparent 2px)',
          backgroundSize: '80px 60px',
        }}
      />

      {/* ripple + signup card */}
      <div className="relative w-full h-[520px] mt-4">
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
          <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.08]
                           max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="p-8 lg:p-10">
              {/* logo */}
              <div className="flex justify-center mb-10">
                <img src="/images/hero/Icon.png" alt="Lyvo logo" className="w-24 h-16 object-contain" />
              </div>

              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/35 text-center mb-4">
                Ready when you are
              </p>

              <h2 className="font-amiamie font-bold text-center text-[#0a0a0a] leading-[1.1] tracking-tight
                              text-[clamp(1.6rem,4vw,2.25rem)] mb-9">
                Created with you in mind
              </h2>

              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full px-6 py-[13px] rounded-full bg-[#0a0a0a] text-white text-sm font-semibold
                           hover:bg-[#2a2a2a] active:scale-[0.98] transition-all duration-200
                           flex items-center justify-center gap-1.5 group mb-4"
              >
                Get started free
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              <p className="text-center text-black/45 text-sm">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-[#0a0a0a] font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center px-6 py-3 bg-[#f0efed] border-t border-black/[0.06]">
              <span className="text-[11px] font-medium text-black/35">No credit card required</span>
            </div>
          </div>
        </div>
      </div>

      {/* footer strip */}
      <footer className="relative w-full py-8 px-4 border-t border-black/[0.08]">
        <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-8">
            <h3 className="text-lg font-bold font-amiamie text-[#0a0a0a] tracking-tight">LYVO</h3>
            <p className="text-sm text-black/45">© {currentYear} CoCoNuTStudios</p>
          </div>

          <div className="flex gap-6 text-sm">
            <a href="/" className="text-black/45 hover:text-[#0a0a0a] transition-colors">Privacy</a>
            <a href="/" className="text-black/45 hover:text-[#0a0a0a] transition-colors">Terms</a>
            <a href="/" className="text-black/45 hover:text-[#0a0a0a] transition-colors">Safety</a>
            <a href="/" className="text-black/45 hover:text-[#0a0a0a] transition-colors">Modify cookies</a>
          </div>
        </div>
      </footer>
    </section>
  )
}

export default Footer