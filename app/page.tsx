"use client"

import { useState, useEffect } from "react"
import AboutSummary from "@/app/sections/landing/AboutSummary"
import Hero from "@/app/sections/landing/Hero"
import Navbar from "@/components/Navbar"
import About from "./sections/landing/About"
import Services from "./sections/landing/Services"
import Footer from "./sections/landing/Footer"
import SmoothScrollProvider from "@/components/SmoothScrollProvider"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if document is already loaded
    if (document.readyState === 'complete') {
      setIsLoading(false)
      return
    }

    // Wait for window load event
    const handleLoad = () => {
      setIsLoading(false)
    }

    window.addEventListener('load', handleLoad)

    // Fallback timer in case load event doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      window.removeEventListener('load', handleLoad)
      clearTimeout(fallbackTimer)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Logo/Spinner */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">L</span>
            </div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading Lyvo...</p>
        </div>
      </div>
    )
  }

  return (
    <SmoothScrollProvider>
      <Navbar />
      <Hero />
      <AboutSummary />
      <About />
      <Services />
      <Footer />
    </SmoothScrollProvider>
  )
}