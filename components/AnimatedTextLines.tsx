import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef, useMemo } from "react"
import { ScrollTrigger } from "gsap/all"

gsap.registerPlugin(ScrollTrigger)

interface AnimatedTextLinesProps {
  text: string;
  className?: string;
}

const AnimatedTextLines = ({ text, className }: AnimatedTextLinesProps) => {
    // Memoize lines to prevent recalculation on every render
    const lines = useMemo(() => 
      text.split("\n").filter((line) => line.trim() !== ""),
      [text]
    )
    
    const containerRef = useRef<HTMLDivElement>(null)
    const lineRef = useRef<(HTMLSpanElement | null)[]>([])

  useGSAP(() => {
    if (lineRef.current.length === 0) return;
    
    const ctx = gsap.context(() => {
        gsap.from(lineRef.current, {
            y: 100,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
            force3D: true,
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                fastScrollEnd: true,
                preventOverlaps: true,
                once: true,
            },
        })
    }, containerRef)
    
    return () => ctx.revert()
}, { scope: containerRef, dependencies: [text] })
    
  return (
    <div ref={containerRef} 
    className={className}>
        {lines.map((line, index) => (
    <span 
      key={index} 
      ref={(el) => { lineRef.current[index] = el }}
      className="block leading-relaxed tracking-wide text-pretty">
        {line}
    </span>
))}
    </div>
  )
}

export default AnimatedTextLines