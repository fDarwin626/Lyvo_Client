"use client"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import AnimatedTextLines from "./AnimatedTextLines"

gsap.registerPlugin(ScrollTrigger)

interface AnimatedHeaderSectionProps {
  subtitle: string;
  title: string;
  text: string;
  textcolor: string;
  withScrollTrigger?: boolean;
}

const AnimatedHeaderSection = ({
  subtitle, 
  title, 
  text, 
  textcolor, 
  withScrollTrigger = false
}: AnimatedHeaderSectionProps) => {

    const contextRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: withScrollTrigger ? {
        trigger: contextRef.current,
        start: "top 80%",
        once: true,
    }: undefined
  });
  
  tl.from(contextRef.current, {
    y: '50vh',
    duration: 0.9,
    ease: 'power2.out',
    force3D: true,
  })
  
  tl.from(headerRef.current, {
    opacity: 0,
    y: 200,
    duration: 0.9,
    ease: "power2.out",
    force3D: true,
  }, "<+0.2")
  
  return () => {
    if (tl.scrollTrigger) tl.scrollTrigger.kill();
    tl.kill();
  }
}, [withScrollTrigger])

  return (
    <div ref={contextRef} className="">
        <div style={{clipPath: 'polygon(0 0, 100% 0%, 100% 100%, 0% 100%)'}} 
        className="">
            <div ref={headerRef} className="flex flex-col justify-center gap-12 pt-16 
                sm:gap-16 ">
                <p className={`text-sm font-light tracking-[0.5rem]
                uppercase px-10 ${textcolor}`}>
                    {subtitle}
                </p>
                <div className="px-10 py-6 md:py-8">
                    <h1 className={`flex flex-col flex-wrap
                    gap-12 ${textcolor} uppercase banner-text-responsive
                    sm:gap-16 md:block`}>{title}</h1>
                </div>
            </div>
        </div>
        <div className={`relative px-10 mt-8 ${textcolor}`}>
            <div className="absolute inset-x-0 border-t-2"/>
            <div className="py-12 sm:py-16 text-end">
            <AnimatedTextLines 
            text={text}
            className={`font-light uppercase value-text-responsive ${textcolor}`}/>
            </div>
        </div>
    </div>    
  )
}

export default AnimatedHeaderSection