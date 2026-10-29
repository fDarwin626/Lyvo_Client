"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useGeneration } from "@/app/contexts/GenerationContext";
import { useCreditBalance } from "@/app/contexts/CreditContext";
import {
  getAvatarHistory,
  AvatarHistoryItem,
  generateAvatar,
  scheduleAvatar,
  unscheduleAvatar,
  getScheduleStatus,
  ScheduleStatus,
  deleteAvatarGeneration,
  APIError,
} from "@/lib/api";
import AvatarRestingCard from "@/components/AvatarRestingCard";

// ========== CONSTANTS ==========

const BASE_COST = 200;
const ENHANCER_EXTRA_COST = 100;

const REFERENCE_VIDEOS = [
  { src: "/videos/cotana.mp4", label: "Cotana" },
  { src: "/videos/jesil.mp4", label: "Jesil" },
  { src: "/videos/soren_clear.mp4", label: "Soren" },
  { src: "/videos/withney.mp4", label: "Whitney" },
];

const THINKING_WORDS = [
  "shifting",
  "knowing",
  "murmuring",
  "thinking",
  "running errands",
  "wandering",
  "gathering",
  "listening",
  "dreaming",
  "composing",
  "pondering",
  "reflecting",
  "muhammading",
  "ruminating",
];

// ========== SMALL HELPERS ==========

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Reads a video File's duration client-side (no upload needed) so we can
// show the user its length before they submit — the actual 10s cap is
// still enforced server-side regardless of what this reports.
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}

// ========== PAGE ==========

function VisageStudio() {
  const router = useRouter();
  const { activeGeneration, beginTracking, clearGeneration } = useGeneration();
  const { premiumUnlocked } = useCreditBalance();

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Driving video
  const [drivingVideoFile, setDrivingVideoFile] = useState<File | null>(null);
  const [drivingVideoPreviewUrl, setDrivingVideoPreviewUrl] = useState<string | null>(null);
  const [drivingVideoDuration, setDrivingVideoDuration] = useState<number | null>(null);
  const drivingVideoInputRef = useRef<HTMLInputElement>(null);

  // Enhancer
  const [enhancer, setEnhancer] = useState(false);

  // Generate flow
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  // Quota-exhausted / scheduling flow
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // Avatar history
  const [avatarHistory, setAvatarHistory] = useState<AvatarHistoryItem[]>([]);
  const [loadingAvatarHistory, setLoadingAvatarHistory] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const refreshedForCompletionRef = useRef<string | null>(null);

  const isThisPageProcessing =
    activeGeneration?.kind === "avatar" && activeGeneration.state === "processing";
  const isThisPageCompleted =
    activeGeneration?.kind === "avatar" && activeGeneration.state === "completed";
  const isThisPageFailed =
    activeGeneration?.kind === "avatar" && activeGeneration.state === "failed";
  const isBlurredState = isSubmitting || isThisPageProcessing;

  // ---------- Fetch avatar history ----------
  const fetchAvatarHistory = useCallback(async () => {
    try {
      setAvatarHistory(await getAvatarHistory());
    } catch (e) {
      console.error("Failed to load avatar history:", e);
    } finally {
      setLoadingAvatarHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchAvatarHistory();
  }, [fetchAvatarHistory]);

  // Refresh avatar history once when this page's job completes
  useEffect(() => {
    if (isThisPageCompleted && activeGeneration?.id && refreshedForCompletionRef.current !== activeGeneration.id) {
      refreshedForCompletionRef.current = activeGeneration.id;
      fetchAvatarHistory();
    }
  }, [isThisPageCompleted, activeGeneration?.id, fetchAvatarHistory]);

  // Cycle thinking words while blurred
  useEffect(() => {
    if (!isBlurredState) return;
    const interval = setInterval(() => {
      setThinkingIndex((i) => (i + 1) % THINKING_WORDS.length);
    }, 1700);
    return () => clearInterval(interval);
  }, [isBlurredState]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      if (drivingVideoPreviewUrl) URL.revokeObjectURL(drivingVideoPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Handlers ----------
  const handlePhotoSelect = (file: File | null) => {
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPreflightError(null);
  };

  const handleDrivingVideoSelect = async (file: File | null) => {
    if (!file) return;
    if (drivingVideoPreviewUrl) URL.revokeObjectURL(drivingVideoPreviewUrl);
    setDrivingVideoFile(file);
    setDrivingVideoPreviewUrl(URL.createObjectURL(file));
    setDrivingVideoDuration(null);
    setPreflightError(null);
    try {
      const duration = await getVideoDuration(file);
      setDrivingVideoDuration(duration);
      if (duration > 10) {
        setPreflightError(`Clip is ${formatDuration(duration)} — only the first 10s will be used.`);
      }
    } catch {
      // duration display is a nicety, not required — ignore failures
    }
  };

  const fetchScheduleStatus = useCallback(async () => {
    try {
      const s = await getScheduleStatus();
      setScheduleStatus(s);
      if (s.quota_remaining_seconds >= 150) {
        setQuotaExhausted(false);
      }
    } catch (e) {
      console.error("Failed to load schedule status:", e);
    }
  }, []);

  useEffect(() => {
    if (!quotaExhausted) return;
    fetchScheduleStatus();
    const interval = setInterval(fetchScheduleStatus, 15000);
    return () => clearInterval(interval);
  }, [quotaExhausted, fetchScheduleStatus]);

  const handleEnhancerToggle = () => {
    if (!premiumUnlocked) {
      router.push("/dashboard/upgrade");
      return;
    }
    setEnhancer((v) => !v);
  };

  const resetForNewCreation = () => {
    clearGeneration();
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    if (drivingVideoPreviewUrl) URL.revokeObjectURL(drivingVideoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setDrivingVideoFile(null);
    setDrivingVideoPreviewUrl(null);
    setDrivingVideoDuration(null);
    setPreflightError(null);
  };

  const handleGenerate = async () => {
    setPreflightError(null);

    if (!photoFile) {
      setPreflightError("Add a photo to bring to life first.");
      return;
    }
    if (!drivingVideoFile) {
      setPreflightError("Add a reference video of someone talking or moving.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await generateAvatar({ photo: photoFile, drivingVideo: drivingVideoFile, enhancer });
      beginTracking(response.id, "avatar", response.credit_used, "Visage Studio video");
    } catch (e: any) {
      if (e instanceof APIError) {
        if (e.statusCode === 402) setPreflightError(`You need more credits for this ${BASE_COST + (enhancer ? ENHANCER_EXTRA_COST : 0)} required. Top up to continue.`);
        else if (e.statusCode === 403) setPreflightError("Enhancer is a premium feature upgrade to unlock it.");
        else if (e.statusCode === 429) {
          setQuotaExhausted(true);
          fetchScheduleStatus();
        } else setPreflightError(e.message || "Couldn't start generation. Try again.");
      } else {
        setPreflightError("Couldn't start generation. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    setPreflightError(null);

    if (!photoFile) {
      setPreflightError("Add a photo to bring to life first.");
      return;
    }
    if (!drivingVideoFile) {
      setPreflightError("Add a reference video of someone talking or moving.");
      return;
    }

    setIsScheduling(true);
    try {
      await scheduleAvatar({ photo: photoFile, drivingVideo: drivingVideoFile, enhancer });
      setShowScheduleForm(false);
      fetchScheduleStatus();
    } catch (e: any) {
      if (e instanceof APIError) {
        if (e.statusCode === 402) setPreflightError(`You need more credits for this ${BASE_COST + (enhancer ? ENHANCER_EXTRA_COST : 0)} required. Top up to continue.`);
        else if (e.statusCode === 403) setPreflightError("Enhancer is a premium feature — upgrade to unlock it.");
        else if (e.statusCode === 409) setPreflightError("Someone just took the schedule slot check back after reset.");
        else setPreflightError(e.message || "Couldn't schedule generation. Try again.");
      } else {
        setPreflightError("Couldn't schedule generation. Try again.");
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      await unscheduleAvatar();
      resetForNewCreation();
      fetchScheduleStatus();
    } catch (e: any) {
      alert(e.message || "Couldn't cancel the schedule. Try again.");
    }
  };

  const handleDeleteAvatar = async (id: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      await deleteAvatarGeneration(id);
      fetchAvatarHistory();
      alert("Video deleted successfully ✅");
    } catch (e: any) {
      if (e.statusCode === 403) alert("❌ You don't have permission to delete this");
      else if (e.statusCode === 404) alert("❌ Video not found");
      else alert(e.message || "❌ Failed to delete video");
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = !!photoFile && !!drivingVideoFile && !isBlurredState;

  const currentCost = BASE_COST + (enhancer ? ENHANCER_EXTRA_COST : 0);
  const isRestingScreen = quotaExhausted && !showScheduleForm && !scheduleStatus?.is_own;
  const isScheduledByMe = quotaExhausted && scheduleStatus?.is_own === true;
  const showNormalForm = !quotaExhausted || showScheduleForm;

  // ---------- Render ----------
  return (
    <div
      className="min-h-screen bg-background pt-20 px-4 sm:px-6 pb-24 scrollbar-hide"
      onClick={() => setOpenDropdown(null)}
    >
      <div className="max-w-6xl mx-auto">
        {/* ===== Studio marquee (header + screening room) ===== */}
        <div className="relative mb-14 rounded-[2rem] px-6 sm:px-10 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black/60" />
              </span>
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-black">
                Now rendering photo to video
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-[ArchivoBlack] text-black/75 leading-[0.95] tracking-tight mb-4 studio-fade-in">
              Visage Studio
            </h1>
            <p
              className="text-black/60 text-sm sm:text-base max-w-md mb-12 studio-fade-in"
              style={{ animationDelay: "80ms" }}
            >
              A photo, a reference video, a few minutes. Watch a still portrait start to move.
            </p>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-black/40">
                Screening room
              </span>
              <span className="h-px flex-1 bg-black/10" />
            </div>
            <div className="relative">
              <div className="sprocket-row mb-2" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                {REFERENCE_VIDEOS.map((ref, i) => (
                  <div key={ref.src} className="group min-w-0">
                    <div
                      className="rounded-xl overflow-hidden relative border border-black/10"
                      style={{ aspectRatio: "10 / 16" }}
                    >
                      <video
                        src={ref.src}
                        controls
                        playsInline
                        muted
                        loop
                        autoPlay
                        className="w-full h-full object-cover grayscale-[15%] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
                      <span className="text-black/60 text-xs font-medium tracking-wide truncate">
                        {ref.label}
                      </span>
                      <span className="text-black/30 text-[10px] font-mono flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sprocket-row mt-2" />
            </div>
          </div>

          <style>{`
            @keyframes studioFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .studio-fade-in { animation: studioFadeIn 0.6s ease-out both; }
            @keyframes sprocketChase {
              from { background-position: 0 0; }
              to { background-position: 200px 0; }
            }
            .sprocket-row {
              height: 6px;
              background-image: repeating-linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.35) 0px,
                rgba(0, 0, 0, 0.35) 4px,
                transparent 41px,
                transparent 16px
              );
              animation: sprocketChase 6s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .studio-fade-in, .sprocket-row { animation: none; }
            }
          `}</style>
        </div>

        {/* ===== Main studio panel ===== */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14 mb-14">
          {/* LEFT — photo + driving video inputs, side by side, then output */}
          <div className="flex flex-col items-center lg:items-start w-full">
            {isRestingScreen && (
              <AvatarRestingCard
                firesAt={scheduleStatus?.fires_at ?? null}
                slotFilled={scheduleStatus?.slot_filled ?? false}
                isOwn={false}
                onScheduleClick={() => setShowScheduleForm(true)}
              />
            )}

            {isScheduledByMe && !showScheduleForm && (
              <>
                <div
                  className="w-full max-w-md lg:w-[420px] rounded-3xl overflow-hidden relative border border-gray-200"
                  style={{ aspectRatio: "9 / 16", background: "#0a0a0a" }}
                >
                  {photoPreviewUrl && (
                    <img src={photoPreviewUrl} alt="Scheduled portrait" className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Scheduled
                  </span>
                </div>
                <button
                  onClick={handleCancelSchedule}
                  className="mt-4 text-sm font-medium border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-100 transition-colors"
                >
                  Cancel schedule
                </button>
              </>
            )}

            {showNormalForm && !isThisPageCompleted && (
              <div className="w-full max-w-2xl lg:w-[560px] grid grid-cols-2 gap-3">
                {/* Photo slot */}
                <div>
                  <p className="text-xs font-medium text-black/50 mb-2">Photo</p>
                  <div
                    className={`rounded-2xl overflow-hidden relative transition-colors ${
                      !photoPreviewUrl ? "border-2 border-dashed border-gray-400" : "border border-gray-200"
                    }`}
                    style={{ aspectRatio: "9 / 16", background: photoPreviewUrl ? "#0a0a0a" : undefined }}
                  >
                    {!photoPreviewUrl ? (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-black/70 hover:text-black/90 transition-colors"
                      >
                        <Icon icon="solar:gallery-add-broken" width="32" height="32" />
                        <span className="text-xs font-medium">Upload a photo</span>
                        <span className="text-[10px] text-black/40 px-2 text-center">JPG or PNG, one clear face</span>
                      </button>
                    ) : (
                      <>
                        <img
                          src={photoPreviewUrl}
                          alt="Uploaded portrait"
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isBlurredState ? "blur-xl brightness-50 scale-105" : ""
                          }`}
                        />
                        {!isBlurredState && (
                          <button
                            onClick={() => photoInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-black text-[10px] font-medium px-2 py-1 rounded-full transition-colors"
                          >
                            Change
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                  />
                </div>

                {/* Driving video slot */}
                <div>
                  <p className="text-xs font-medium text-black/50 mb-2">Reference video</p>
                  <div
                    className={`rounded-2xl overflow-hidden relative transition-colors ${
                      !drivingVideoPreviewUrl ? "border-2 border-dashed border-gray-400" : "border border-gray-200"
                    }`}
                    style={{ aspectRatio: "9 / 16", background: drivingVideoPreviewUrl ? "#0a0a0a" : undefined }}
                  >
                    {!drivingVideoPreviewUrl ? (
                      <button
                        onClick={() => drivingVideoInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-black/70 hover:text-black/90 transition-colors"
                      >
                        <Icon icon="solar:videocamera-record-broken" width="32" height="32" />
                        <span className="text-xs font-medium">Upload a video</span>
                        <span className="text-[10px] text-black/40 px-2 text-center">Someone talking or moving, up to 10s used</span>
                      </button>
                    ) : (
                      <>
                        <video
                          src={drivingVideoPreviewUrl}
                          controls
                          muted
                          playsInline
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isBlurredState ? "blur-xl brightness-50 scale-105" : ""
                          }`}
                        />
                        {!isBlurredState && (
                          <button
                            onClick={() => drivingVideoInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-black text-[10px] font-medium px-2 py-1 rounded-full transition-colors"
                          >
                            Change
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    ref={drivingVideoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleDrivingVideoSelect(e.target.files?.[0] || null)}
                  />
                  {drivingVideoDuration !== null && (
                    <p className="text-[10px] text-black/40 mt-1">
                      {formatDuration(drivingVideoDuration)}
                      {drivingVideoDuration > 10 ? " • first 10s used" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Blurred thinking overlay, shown once both inputs are locked in and submitting */}
            {isBlurredState && (
              <div className="mt-3 flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-black/70 font-amiamie text-sm tracking-wide uppercase">
                  {THINKING_WORDS[thinkingIndex]}…
                </span>
                <span className="text-black/40 text-[11px]">Usually takes a few minutes</span>
              </div>
            )}

            {/* Completed — output video */}
            {isThisPageCompleted && activeGeneration?.videoUrl && (
              <div
                className="w-full max-w-md lg:w-[420px] rounded-3xl overflow-hidden relative border border-gray-200"
                style={{ aspectRatio: "9 / 16", background: "#0a0a0a" }}
              >
                <video src={activeGeneration.videoUrl} controls playsInline className="w-full h-full object-cover" />
              </div>
            )}

            {isThisPageFailed && (
              <div className="mt-4 w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {activeGeneration?.error || "This generation failed."}
              </div>
            )}

            {preflightError && (
              <div className="mt-4 w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {preflightError}
              </div>
            )}

            {isThisPageCompleted && (
              <button
                onClick={resetForNewCreation}
                className="mt-4 text-sm font-medium border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-100 transition-colors"
              >
                Create another
              </button>
            )}
          </div>

          {/* RIGHT — enhancer + generate */}
          {showNormalForm && (
            <div className="flex flex-col gap-5 w-full lg:w-auto lg:max-w-xs">
              <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    Enhancer
                    {!premiumUnlocked && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded-full">
                        <Icon icon="fluent:premium-20-regular" width="11" height="11" />
                        Premium
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Sharper facial detail, costs {ENHANCER_EXTRA_COST} more credits</p>
                </div>
                <button
                  onClick={handleEnhancerToggle}
                  className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                    enhancer ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      enhancer ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                This uses <span className="font-medium text-black">{currentCost} credits</span>. Daily
                generations are shared across everyone on Lyvo and limited — if it doesn't go through,
                it's worth trying again a bit later.
              </p>

              <button
                onClick={showScheduleForm ? handleSchedule : handleGenerate}
                disabled={showScheduleForm ? (!photoFile || !drivingVideoFile || isScheduling) : !canGenerate}
                className="w-full bg-black text-white rounded-xl py-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                {showScheduleForm
                  ? isScheduling ? "Scheduling…" : "Schedule video"
                  : isBlurredState ? "Generating…" : "Generate video"}
              </button>
            </div>
          )}
        </div>

        {/* ===== Your Creations (avatar history) ===== */}
        <div>
          <h2 className="text-2xl font-amiamie font-bold mb-4">Your Creations</h2>
          {loadingAvatarHistory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio: "9/16" }} />
              ))}
            </div>
          ) : avatarHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <Icon icon="solar:clapperboard-play-broken" width="48" height="48" className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Nothing here yet your first video will show up once it's done.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {avatarHistory.map((job) => (
                <div
                  key={job.id}
                  className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black"
                  style={{ aspectRatio: "9/16" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {job.status === "completed" && job.result_video_url ? (
                    <video
                      src={job.result_video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      onClick={() => setPlayingVideoUrl(job.result_video_url)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        icon={job.status === "failed" ? "solar:danger-triangle-broken" : "svg-spinners:ring-resize"}
                        width="28"
                        height="28"
                        className="text-white/60"
                      />
                    </div>
                  )}

                  {job.status === "processing" && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      Processing…
                    </span>
                  )}
                  {job.status === "failed" && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      Failed
                    </span>
                  )}
                  {job.enhancer && job.status === "completed" && (
                    <span className="absolute top-2 right-2 bg-white/90 text-black text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Icon icon="fluent:premium-20-regular" width="10" height="10" />
                      Enhanced
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === job.id ? null : job.id);
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
                  >
                    <Icon icon="mdi:dots-horizontal" width="16" height="16" />
                  </button>

                  <div
                    className={`absolute bottom-11 right-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px] transition-all z-10 ${
                      openDropdown === job.id ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                  >
                    {job.status === "completed" && job.result_video_url && (
                      <>
                        <button
                          onClick={() => {
                            setPlayingVideoUrl(job.result_video_url);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Icon icon="mdi:play-circle" width="16" height="16" />
                          Play
                        </button>
                        <button
                          onClick={() => {
                            handleDownload(job.result_video_url as string, `visage-${job.id}.mp4`);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Icon icon="mdi:download" width="16" height="16" />
                          Download
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleDeleteAvatar(job.id);
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Icon icon="mdi:delete" width="16" height="16" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video playback modal */}
      {playingVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPlayingVideoUrl(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <video src={playingVideoUrl} controls autoPlay className="w-full rounded-2xl" />
            <button onClick={() => setPlayingVideoUrl(null)} className="absolute -top-10 right-0 text-white">
              <Icon icon="mdi:close" width="28" height="28" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisageStudioPage() {
  return (
    <ProtectedRoute>
      <VisageStudio />
    </ProtectedRoute>
  );
}