"use client";

interface FluidLoaderProps {
  percent: number; // 0-100, computed by the caller from chunk progress
  label?: string;
}

export default function FluidLoader({ percent, label = "Generating..." }: FluidLoaderProps) {
  const clamped = Math.max(4, Math.min(97, percent));

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-[2rem] border-2 border-gray-200 overflow-hidden bg-gray-50">
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out"
          style={{ height: `${clamped}%` }}
        >
          <svg
            className="absolute -top-3 left-0 w-[200%] h-4 fluid-wave-back opacity-70"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,10 C 50,0 100,20 150,10 C 200,0 250,20 300,10 C 350,0 400,20 400,10 L400,20 L0,20 Z"
              fill="#191654"
            />
          </svg>
          <svg
            className="absolute -top-2 left-0 w-[200%] h-4 fluid-wave-front"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,10 C 50,20 100,0 150,10 C 200,20 250,0 300,10 C 350,20 400,0 400,10 L400,20 L0,20 Z"
              fill="#43C6AC"
            />
          </svg>
          <div className="absolute inset-x-0 top-2 bottom-0 bg-gradient-to-b from-[#43C6AC] to-[#191654]" />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 animate-pulse">{label}</p>

      <style jsx>{`
        .fluid-wave-front { animation: wave-drift 3.2s linear infinite; }
        .fluid-wave-back { animation: wave-drift 4.6s linear infinite reverse; }
        @keyframes wave-drift {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}