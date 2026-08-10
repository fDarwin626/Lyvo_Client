"use client";

import { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FluidLoader from "@/components/FluidLoader";
import { useGeneration } from "@/app/contexts/GenerationContext";
import { extractAudioFromVideo } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Decorative only — heights for the static waveform preview next to a staged file.
const WAVE_HEIGHTS = [32, 58, 44, 78, 52, 88, 38, 68, 48, 82, 58, 28, 72, 42, 62, 90, 36, 54];

function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveMediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

/**
 * Grabs a frame ~10% into the clip (avoids black first frames on most
 * encodes) and returns it as a JPEG data URL, along with the real
 * client-probed duration. Never rejects — on any failure it resolves
 * with an empty thumbnail so the UI can fall back to a plain icon.
 * The server remains the source of truth for duration/processing.
 */
function captureVideoPreview(file: File): Promise<{ thumbnail: string; duration: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.src = url;

    let settled = false;
    const finish = (thumbnail: string, duration: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve({ thumbnail, duration });
    };

    const fallbackTimer = setTimeout(() => finish("", 0), 4000);

    videoEl.onloadedmetadata = () => {
      const seekTo = Math.min(1, (videoEl.duration || 1) * 0.1);
      try {
        videoEl.currentTime = seekTo;
      } catch {
        finish("", videoEl.duration || 0);
      }
    };

    videoEl.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 320;
        canvas.height = videoEl.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        clearTimeout(fallbackTimer);
        finish(canvas.toDataURL("image/jpeg", 0.72), videoEl.duration || 0);
      } catch {
        clearTimeout(fallbackTimer);
        finish("", videoEl.duration || 0);
      }
    };

    videoEl.onerror = () => {
      clearTimeout(fallbackTimer);
      finish("", 0);
    };
  });
}

export default function MediaPage() {
  const { activeGeneration, beginTracking, clearGeneration } = useGeneration();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [stagedThumb, setStagedThumb] = useState<string>("");
  const [stagedDuration, setStagedDuration] = useState<number>(0);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const isThisGeneration = activeGeneration?.kind === "media";
  const isProcessing = isThisGeneration && activeGeneration?.state === "processing";
  const isCompleted = isThisGeneration && activeGeneration?.state === "completed";
  const isFailed = isThisGeneration && activeGeneration?.state === "failed";
  const extractionPercent = 12;

  const handleFile = useCallback((file: File) => {
    setGenerationError(null);

    if (!file.type.startsWith("video/")) {
      setGenerationError("Please choose a video file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setGenerationError("Video must be 20MB or under.");
      return;
    }

    setUploadedFile(file);
    setStagedThumb("");
    setStagedDuration(0);
    setThumbLoading(true);

    captureVideoPreview(file).then(({ thumbnail, duration }) => {
      setStagedThumb(thumbnail);
      setStagedDuration(duration);
      setThumbLoading(false);
    });
  }, []);

  const removeStagedFile = () => {
    setUploadedFile(null);
    setStagedThumb("");
    setStagedDuration(0);
    setGenerationError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleExtract = async () => {
    if (!uploadedFile || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await extractAudioFromVideo(uploadedFile);
      if (result.status === "processing") {
        beginTracking(result.id, "media", result.credit_used, uploadedFile.name);
      }
    } catch (error: any) {
      setGenerationError(error?.message || "Extraction failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const dismissResult = () => {
    clearGeneration();
    removeStagedFile();
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto mt-8 lg:mt-14 px-4 lg:px-0 pb-24">

        {/* header */}
        <div className="mb-10 lg:mb-14">
          <p className="vta-reveal vta-reveal-1 text-[11px] font-semibold tracking-[0.22em] uppercase text-secondary mb-3">
            Media · Extract
          </p>
          <h1 className="vta-reveal vta-reveal-2 font-amiamie leading-[0.94] text-4xl sm:text-5xl">
            <span className="block text-secondary/50">Video</span>
            <span className="block font-bold text-primary -mt-1 sm:-mt-2">to Audio</span>
          </h1>
          <p className="vta-reveal vta-reveal-3 text-sm sm:text-[15px] text-secondary mt-4 max-w-md">
            Drop in a video and pull a clean audio track out of it. 20MB max.
          </p>
        </div>

        {/* workspace */}
        <div className="rounded-2xl border border-default bg-surface overflow-hidden shadow-sm">

          {/* IDLE — no file staged, nothing running */}
          {!uploadedFile && !isThisGeneration && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center text-center px-6 py-16 lg:py-24 cursor-pointer
                border-2 border-dashed m-3 rounded-xl transition-colors duration-200
                ${isDragging ? "border-primary bg-primary/5" : "border-default hover:border-primary/40 hover:bg-background/50"}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-transform duration-200
                ${isDragging ? "bg-primary/15 scale-105" : "bg-background border border-default"}`}>
                <Icon icon="mdi:film" width="24" height="24" className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-primary mb-1">Drop a video, or click to browse</p>
              <p className="text-xs text-secondary">MP4, MOV, or WebM up to 20MB</p>
            </div>
          )}

          {/* STAGED — file picked, not yet submitted */}
          {uploadedFile && !isThisGeneration && (
            <div className="stage-in p-5 lg:p-6">
              <div className="flex gap-4">
                {/* film-cell thumbnail — the signature element */}
                <div className="relative w-28 sm:w-32 aspect-[4/3] flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  {thumbLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon icon="mdi:loading" width="18" height="18" className="animate-spin text-white/50" />
                    </div>
                  ) : stagedThumb ? (
                    <img src={stagedThumb} alt="" className="thumb-in w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon icon="mdi:video-outline" width="22" height="22" className="text-white/30" />
                    </div>
                  )}
                  {/* sprocket strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/50 flex flex-col justify-evenly items-center py-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-[3px] h-[3px] rounded-full bg-white/70" />
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-primary truncate">{uploadedFile.name}</p>
                    <button
                      onClick={removeStagedFile}
                      className="text-secondary hover:text-primary transition-colors flex-shrink-0 p-1 -m-1 -mt-1"
                      aria-label="Remove file"
                    >
                      <Icon icon="mdi:close" width="16" height="16" />
                    </button>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    {formatSize(uploadedFile.size)}
                    {stagedDuration > 0 && <> · {formatDuration(stagedDuration)}</>}
                  </p>

                  {/* static waveform preview — what's about to be pulled out */}
                  <div className="flex items-end gap-[3px] mt-auto pt-4 h-8">
                    {WAVE_HEIGHTS.map((h, i) => (
                      <span
                        key={i}
                        className="wave-bar w-[3px] rounded-full bg-primary/45"
                        style={{ height: `${h}%`, animationDelay: `${i * 22}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-default">
                <button
                  onClick={handleExtract}
                  disabled={isGenerating}
                  className="group w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl
                             bg-black text-white text-sm font-bold tracking-wide uppercase
                             shadow-md shadow-black/10
                             hover:bg-gray-800 active:scale-[0.98] transition-all duration-150
                             disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <Icon icon="mdi:loading" width="18" height="18" className="animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:waveform" width="18" height="18" />
                      Extract audio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {isProcessing && (
            <div className="p-5 lg:p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-14 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  {stagedThumb ? (
                    <img src={stagedThumb} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon icon="mdi:video-outline" width="16" height="16" className="text-white/30" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-secondary truncate">{activeGeneration?.title}</p>
              </div>
              <FluidLoader percent={extractionPercent} label="Extracting audio…" />
            </div>
          )}

          {/* FAILED */}
          {isFailed && (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Icon icon="mdi:close" width="20" height="20" className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-primary mb-1">Extraction failed</p>
              <p className="text-xs text-secondary mb-6">
                {activeGeneration?.error || "Your credits were refunded."}
              </p>
              <button
                onClick={dismissResult}
                className="px-5 py-2.5 rounded-full bg-primary text-background text-sm font-semibold
                           hover:opacity-85 active:scale-[0.97] transition-all duration-200"
              >
                Try again
              </button>
            </div>
          )}

          {/* COMPLETED */}
          {isCompleted && activeGeneration?.audioUrl && (
            <div className="sheet-in">
              <div className="p-5 lg:p-6 flex gap-4">
                <div className="relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  {stagedThumb ? (
                    <img src={stagedThumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon icon="mdi:music" width="16" height="16" className="text-white/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-secondary mb-0.5">
                    Done
                  </p>
                  <p className="text-sm font-semibold text-primary truncate mb-3">
                    {activeGeneration.title || "Extracted audio"}
                  </p>
                  <audio controls className="w-full" src={resolveMediaUrl(activeGeneration.audioUrl)} />
                </div>
              </div>
              <div className="flex items-center justify-between px-5 lg:px-6 py-3 bg-background border-t border-default">
                <a
                  href={resolveMediaUrl(activeGeneration.audioUrl)}
                  download={`${activeGeneration.title || "extracted-audio"}.mp3`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
                >
                  <Icon icon="mdi:download-outline" width="15" height="15" />
                  Download MP3
                </a>
                <button
                  onClick={dismissResult}
                  className="text-xs font-medium text-secondary hover:text-primary transition-colors"
                >
                  Extract another
                </button>
              </div>
            </div>
          )}
        </div>

        {generationError && (
          <p className="text-xs text-red-500 mt-3">{generationError}</p>
        )}
      </div>

      <style>{`
        .reveal {
          opacity: 0;
          animation: fadeUp 480ms ease-out forwards;
        }
        .reveal-1 { animation-delay: 0ms; }
        .reveal-2 { animation-delay: 70ms; }
        .reveal-3 { animation-delay: 140ms; }

        .stage-in {
          animation: fadeUp 320ms ease-out forwards;
        }

        .thumb-in {
          animation: wipeIn 420ms ease-out forwards;
        }

        .wave-bar {
          transform: scaleY(0);
          transform-origin: bottom;
          animation: growBar 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .sheet-in {
          animation: sheetUp 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wipeIn {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes growBar {
          to { transform: scaleY(1); }
        }
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .stage-in, .thumb-in, .wave-bar, .sheet-in {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}