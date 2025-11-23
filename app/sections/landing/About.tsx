"use client"
import AnimatedHeaderSection from "@/components/AnimatedHeader"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import MagicBento from "@/components/BentoCards"

gsap.registerPlugin(ScrollTrigger)

const About = () => {
    const text = `Deliver new experiences and save costs for your enterprise
    Build the most advanced audio models into your product with our APIs`



  return (
  <section className="min-h-screen bg-black mt-30 rounded-t-4xl sticky rounded-b-4xl">
    <AnimatedHeaderSection
      subtitle= "Next Gen,Low Letency"
    title='Lyvo'
    text ={text}
    textcolor='text-white'
    withScrollTrigger={true}
    />

    <div className="flex items-center justify-center mb-20">
        <MagicBento 
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
        />        
   </div> 
  </section>

)
}

export default About