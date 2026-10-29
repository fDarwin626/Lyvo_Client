"use client";

import { useEffect, useRef, useState } from "react";

// ========== PEAK EXTRACTION ==========
async function getAudioPeaks(file: File, numPeaks: number): Promise<{ peaks: number[]; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AC();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0);
  const blockSize = Math.max(Math.floor(rawData.length / numPeaks), 1);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j] || 0);
    }
    peaks.push(sum / blockSize);
  }

  const max = Math.max(...peaks, 0.0001);
  const duration = audioBuffer.duration;
  await audioCtx.close();
  return { peaks: peaks.map((p) => p / max), duration };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

// ========== COMPONENT ==========

interface AudioTrimStripProps {
  file: File;
  /** The visible <audio> element this strip should seek/play for preview while dragging. */
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  maxWindowSeconds?: number; // hard cap  window can never exceed this
  minWindowSeconds?: number; // how far the window can shrink
  trimStart: number;
  onTrimStartChange: (start: number) => void;
  windowLength: number;
  onWindowLengthChange: (length: number) => void;
  onDurationKnown?: (duration: number) => void;
}

export default function AudioTrimStrip({
  file,
  audioRef,
  maxWindowSeconds = 10,
  minWindowSeconds = 1,
  trimStart,
  onTrimStartChange,
  windowLength,
  onWindowLengthChange,
  onDurationKnown,
}: AudioTrimStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Drag-session bookkeeping lives in a ref  it changes on every pixel of
  // pointer movement and doesn't need to trigger a React re-render itself;
  // only the trimStart/windowLength values reported up to the parent do.
  const dragRef = useRef<{ mode: DragMode; grabOffset: number; rightAnchor: number; leftAnchor: number }>({
    mode: null,
    grabOffset: 0,
    rightAnchor: 0,
    leftAnchor: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    setDuration(null);

    getAudioPeaks(file, 120)
      .then(({ peaks: p, duration: d }) => {
        if (cancelled) return;
        setPeaks(p);
        setDuration(d);
        onDurationKnown?.(d);
      })
      .catch((err) => {
        console.error("Failed to decode audio for waveform:", err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const previewFrom = (time: number) => {
    const el = audioRef?.current;
    if (!el) return;
    try {
      el.currentTime = time;
      void el.play();
    } catch {
      // autoplay restrictions etc  preview is a nicety, not a requirement
    }
  };

  const secondsAtClientX = (clientX: number): number => {
    if (!containerRef.current || duration === null) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return ratio * duration;
  };

  // Click/drag anywhere in the strip (waveform, dimmed area, or the window
  // itself) relocates + drags the window. Pointer Capture guarantees this
  // element keeps receiving move/up events for the whole gesture, even if
  // the cursor leaves the strip's bounds.
  const beginMove = (e: React.PointerEvent) => {
    if (duration === null) return;
    e.preventDefault();
    containerRef.current?.setPointerCapture(e.pointerId);

    const pointerSeconds = secondsAtClientX(e.clientX);
    const insideWindow = pointerSeconds >= trimStart && pointerSeconds <= trimStart + windowLength;
    dragRef.current.mode = "move";
    dragRef.current.grabOffset = insideWindow ? pointerSeconds - trimStart : windowLength / 2;

    const newStart = clamp(pointerSeconds - dragRef.current.grabOffset, 0, Math.max(duration - windowLength, 0));
    onTrimStartChange(newStart);
    previewFrom(newStart);
  };

  const beginResize = (mode: "resize-left" | "resize-right", e: React.PointerEvent) => {
    if (duration === null) return;
    e.preventDefault();
    e.stopPropagation(); // don't also trigger the container's beginMove
    containerRef.current?.setPointerCapture(e.pointerId);

    dragRef.current.mode = mode;
    dragRef.current.rightAnchor = trimStart + windowLength;
    dragRef.current.leftAnchor = trimStart;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const mode = dragRef.current.mode;
    if (!mode || duration === null) return;
    const pointerSeconds = secondsAtClientX(e.clientX);

    if (mode === "move") {
      const newStart = clamp(pointerSeconds - dragRef.current.grabOffset, 0, Math.max(duration - windowLength, 0));
      onTrimStartChange(newStart);
      previewFrom(newStart);
    } else if (mode === "resize-left") {
      // Right edge is the anchor  stays fixed while the left edge moves.
      const rightEdge = dragRef.current.rightAnchor;
      let newStart = Math.min(pointerSeconds, rightEdge - minWindowSeconds);
      newStart = Math.max(newStart, rightEdge - maxWindowSeconds, 0);
      onTrimStartChange(newStart);
      onWindowLengthChange(rightEdge - newStart);
      previewFrom(newStart);
    } else if (mode === "resize-right") {
      // Left edge is the anchor  stays fixed while the right edge moves.
      const leftEdge = dragRef.current.leftAnchor;
      let newRightEdge = Math.max(pointerSeconds, leftEdge + minWindowSeconds);
      newRightEdge = Math.min(newRightEdge, leftEdge + maxWindowSeconds, duration);
      onWindowLengthChange(newRightEdge - leftEdge);
      previewFrom(leftEdge);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current.mode = null;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // already released  ignore
    }
  };

  if (!peaks || duration === null) {
    return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const windowWidthPct = Math.min((windowLength / duration) * 100, 100);
  const leftPct = (trimStart / duration) * 100;

  return (
    <div>
      <div
        ref={containerRef}
        onPointerDown={beginMove}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-20 bg-gray-100 rounded-xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-[2px] px-2 pointer-events-none">
          {peaks.map((p, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-400 rounded-full"
              style={{ height: `${Math.max(p * 90, 6)}%` }}
            />
          ))}
        </div>

        {/* Dim everything outside the selected window */}
        <div
          className="absolute inset-y-0 left-0 bg-white/75 pointer-events-none"
          style={{ width: `${leftPct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-white/75 pointer-events-none"
          style={{ width: `${Math.max(100 - leftPct - windowWidthPct, 0)}%` }}
        />

        {/* The window itself is pointer-events-none  clicks pass through to
            the container's beginMove. Only the two handles re-enable
            pointer events, so they can be grabbed independently for resize. */}
        <div
          className="absolute inset-y-0 border-2 border-black bg-black/5 rounded-lg pointer-events-none"
          style={{ left: `${leftPct}%`, width: `${windowWidthPct}%` }}
        >
          <div
            onPointerDown={(e) => beginResize("resize-left", e)}
            className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 bg-black rounded-l-md cursor-ew-resize flex items-center justify-center pointer-events-auto"
          >
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>
          <div
            onPointerDown={(e) => beginResize("resize-right", e)}
            className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 bg-black rounded-r-md cursor-ew-resize flex items-center justify-center pointer-events-auto"
          >
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
        <span>{formatTime(0)}</span>
        <span className="font-medium text-black">
          {formatTime(trimStart)}–{formatTime(trimStart + windowLength)} · {windowLength.toFixed(1)}s
        </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}