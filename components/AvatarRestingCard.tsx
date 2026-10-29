"use client";

import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";

const LOTTIE_FILES = [
  "/lottie/worker.json",
  "/lottie/wall_E.json",
  "/lottie/butterfly_robot.json",
];

const CYCLE_INTERVAL_MS = 5500;

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "0:00:00";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface AvatarRestingCardProps {
  firesAt: string | null;
  slotFilled: boolean;
  isOwn: boolean;
  onScheduleClick: () => void;
}

export default function AvatarRestingCard({
  firesAt,
  slotFilled,
  isOwn,
  onScheduleClick,
}: AvatarRestingCardProps) {
  const [animationIndex, setAnimationIndex] = useState(0);
  const [animationData, setAnimationData] = useState<any>(null);
  const [msRemaining, setMsRemaining] = useState<number>(0);
  const cache = useRef<Record<string, any>>({});

  // Cycle the main figure
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationIndex((i) => (i + 1) % LOTTIE_FILES.length);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Load (and cache) the current animation's JSON
  useEffect(() => {
    const path = LOTTIE_FILES[animationIndex];
    if (cache.current[path]) {
      setAnimationData(cache.current[path]);
      return;
    }
    fetch(path)
      .then((r) => r.json())
      .then((data) => {
        cache.current[path] = data;
        setAnimationData(data);
      })
      .catch(() => setAnimationData(null));
  }, [animationIndex]);

  // Live countdown
  useEffect(() => {
    if (!firesAt) return;
    const target = new Date(firesAt).getTime();
    const tick = () => setMsRemaining(target - Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [firesAt]);

  return (
    <div className="w-full rounded-3xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 py-10 lg:py-16 text-center">
      <div className="w-40 h-40 lg:w-52 lg:h-52">
        {animationData && (
          <Lottie animationData={animationData} loop autoplay />
        )}
      </div>

      <p className="text-lg lg:text-2xl font-semibold text-black">
        Oops, our workers are resting
      </p>
      <p className="text-sm lg:text-base text-gray-500 max-w-xs lg:max-w-md">
        Everyone shares the same generation capacity on Lyvo. They'll be back
        to work soon.
      </p>

      {firesAt && (
        <div className="font-mono text-3xl lg:text-4xl font-bold text-black tabular-nums">
          {formatCountdown(msRemaining)}
        </div>
      )}

      {isOwn ? (
        <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-2">
          Your generation is scheduled ✅
        </p>
      ) : slotFilled ? (
        <p className="text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2">
          Schedule slot filled — check back after reset
        </p>
      ) : (
        <button
          onClick={onScheduleClick}
          className="bg-black text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Schedule this generation
        </button>
      )}
    </div>
  );
}