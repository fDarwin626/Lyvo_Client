"use client"
import Marquee from "@/components/Marquee"
import RippleGrid from "@/components/RippleGrid"
import { useRouter } from "next/navigation"

const AboutSummary = () => {
  const router = useRouter();
  const item =[
    `Innovation`,
    `Automation`,
    `Voice Cloning`,
    `Story Telling`,
    `Audio Book`,
  ]
  return (
    <section className="min-h-screen mt-20 flex-col items-center text-center justify-between">
       <Marquee
        items={item}
        className="text-black bg-transparent !text-xl  font-amiamie-round"
        icon="simple-icons:creativetechnology"
        IconclassName="w-24 h-23 text-gold"
       />

      <div className="flex flex-col items-center justify-center mt-20">
          <h1 className="lg:text-5xl text-3xl font-amiamie font-medium"
          >The World Most Innovative Mordern Ai Voice Platform</h1>
           <p className=" flex text-center justify-center lg:text-2xl mt-5 text-sm font-normal"
           >AI voice models and products powering  creators, 
           and enterprises. <br></br>From  conversational agents to the leading AI
             voice generator for voiceovers and audiobooks.</p>
          
      </div>

<div className="relative w-full h-[500px] mt-10">
  {/* RippleGrid Background */}
  <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
    <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
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
    </div>
  </div>

  {/* Content Overlay */}
  <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
    <h1 className="text-2xl md:text-6xl lg:font-light font-semibold text-gray-950 text-center mb-8 font-amiamie">
      Experience our full audio platform,<br />
      Get Started today
    </h1>
    
    <div className="flex gap-4">
      <button 
      onClick={() => router.push('/auth/signup')}
      className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-100 transition 
      hover:text-black">
        Get Started
      </button>
      
      <button
       onClick={() => router.push("/documentation")}
       className="px-8 py-3 bg-transparent border-2 border-black
        text-black rounded-full font-semibold hover:bg-black hover:text-white transition">
        Learn More
      </button>
    </div>
  </div>
</div>

    </section>
  )
}

export default AboutSummary