"use client"


import gsap from "gsap";
import { Observer } from "gsap/all";

import { useEffect, useRef } from "react"
import { Icon } from "@iconify/react/dist/iconify.js"

gsap.registerPlugin(Observer);

// Define types
interface MarqueeProps {
  items: string[];
  icon?: string;
  className?: string;
  IconclassName?: string;
  reverse?: boolean;
}

interface LoopConfig {
  repeat?: number;
  paused?: boolean;
  speed?: number;
  snap?: number | false;  // Changed from 'boolean' to 'false'
  paddingRight?: number;
  reversed?: boolean;
}

const Marquee = ({ 
  items, 
  icon = "mdi:star-four-points",
  className = "text-white bg-black",
  IconclassName = "w-10 h-15 text-gold", 
  reverse = false,
}: MarqueeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLSpanElement | null)[]>([]);

  function horizontalLoop(items: Element[], config?: LoopConfig) {
    const itemsArray = gsap.utils.toArray(items) as Element[];
    config = config || {};
    
    let tl = gsap.timeline({
      repeat: config.repeat, 
      paused: config.paused, 
      defaults: { ease: "none" }, 
      onReverseComplete: () => {  // Fixed: wrapped in arrow function
        tl.totalTime(tl.rawTime() + tl.duration() * 100);
      }
    });
    
    const length = itemsArray.length;
    const startX = (itemsArray[0] as HTMLElement).offsetLeft;
    const times: number[] = [];
    const widths: number[] = [];
    const xPercents: number[] = [];
    let curIndex = 0;
    const pixelsPerSecond = (config.speed || 1) * 100;
    
    // Fixed: handle snap type correctly
    const snap = config.snap === false 
      ? (v: number) => v 
      : gsap.utils.snap(config.snap || 1);
    
    let totalWidth: number, curX: number, distanceToStart: number, distanceToLoop: number, item: Element;

    gsap.set(itemsArray, {
      xPercent: (i: number, el: Element) => {
        const w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string);
        xPercents[i] = snap(
          parseFloat(gsap.getProperty(el, "x", "px") as string) / w * 100 + 
          parseFloat(gsap.getProperty(el, "xPercent") as string)
        );
        return xPercents[i];
      }
    });
    
    gsap.set(itemsArray, { x: 0 });
    
    const lastItem = itemsArray[length - 1] as HTMLElement;
    totalWidth = lastItem.offsetLeft + 
      xPercents[length - 1] / 100 * widths[length - 1] - 
      startX + 
      lastItem.offsetWidth * parseFloat(gsap.getProperty(lastItem, "scaleX") as string) + 
      (parseFloat(String(config.paddingRight)) || 0);
    
    for (let i = 0; i < length; i++) {
      item = itemsArray[i];
      curX = xPercents[i] / 100 * widths[i];
      distanceToStart = (item as HTMLElement).offsetLeft + curX - startX;
      distanceToLoop = distanceToStart + widths[i] * parseFloat(gsap.getProperty(item, "scaleX") as string);
      
      tl.to(item, {
        xPercent: snap((curX - distanceToLoop) / widths[i] * 100), 
        duration: distanceToLoop / pixelsPerSecond
      }, 0)
      .fromTo(item, 
        { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, 
        { 
          xPercent: xPercents[i], 
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, 
          immediateRender: false
        }, 
        distanceToLoop / pixelsPerSecond
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);
      
      times[i] = distanceToStart / pixelsPerSecond;
    }
    
    function toIndex(index: number, vars?: gsap.TweenVars) {
      vars = vars || {};
      if (Math.abs(index - curIndex) > length / 2) {
        index += index > curIndex ? -length : length;
      }
      
      let newIndex = gsap.utils.wrap(0, length, index);
      let time = times[newIndex];
      
      if (time > tl.time() !== index > curIndex) {
        vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      
      curIndex = newIndex;
      vars.overwrite = true;
      return tl.tweenTo(time, vars);
    }
    
    tl.next = (vars?: gsap.TweenVars) => toIndex(curIndex + 1, vars);
    tl.previous = (vars?: gsap.TweenVars) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index: number, vars?: gsap.TweenVars) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true);
    
    if (config.reversed) {
      tl.vars.onReverseComplete?.();
      tl.reverse();
    }
    
    return tl;  // Fixed: return timeline directly, not a function
  }

useEffect(() => {
  if (!containerRef.current) return;
  
  const filteredItems = itemsRef.current.filter((el): el is HTMLSpanElement => el !== null);
  if (filteredItems.length === 0) return;
  
  const tl = horizontalLoop(filteredItems, {
    repeat: -1,
    paddingRight: 30,
    reversed: reverse,
  });

  const obs = Observer.create({
    onChangeY(self) {
      let factor = 2.5;
      if ((!reverse && self.deltaY < 0) || (reverse && self.deltaY > 0)) {
        factor *= -1;
      } 
      // Optimized: Direct gsap.to calls instead of timeline
      gsap.to(tl, { timeScale: factor * 2.5, duration: 0.2, overwrite: true });
      gsap.to(tl, { timeScale: factor / 2.5, duration: 1, delay: 0.3, overwrite: true });
    }
  });
  
  return () => {
    tl.kill();
    obs.kill();
  };
}, [reverse]); // Removed 'items' from dependencies

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden w-full h-15 md:h-[60px]
        flex items-center marquee-text-responsive uppercase
        whitespace-nowrap ${className}`}
    >
      <div className="flex">
        {items && [...items, ...items, ...items].map((text, index) => (
          <span
            ref={(el) => { itemsRef.current[index] = el }}
            key={index} 
            className="flex items-center px-16 gap-x-16"
          >
            {text} 
            <Icon icon={icon} className={IconclassName} />
          </span>
        ))} 
      </div>
    </div>
  );
}

export default Marquee;