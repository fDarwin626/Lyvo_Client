"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { cloneVoice, getMyClones, deleteClone, type ClonedVoice, getAudioUrl } from "@/lib/api"
import { Mic, Upload, Trash2, Play, Pause, Square, StopCircle } from "lucide-react"
import { Icon } from "@iconify/react";
import { useCreditBalance } from '@/app/contexts/CreditContext';

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

function VoiceCloningPage () {
    // ========== EXISTING ANIMATION STATE ==========
    const headingRef = useRef<HTMLHeadingElement>(null);
    const bannerRef = useRef<HTMLDivElement>(null);
    const [animationsReady, setAnimationsReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const textRef = useRef<HTMLDivElement>(null);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const velocityRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | null>(null);
    const [isTextOutside, setIsTextOutside] = useState(false);
    const {deductCredits} = useCreditBalance();

    // ========== NEW VOICE CLONING STATE ==========
    const [clones, setClones] = useState<ClonedVoice[]>([])
    const [loading, setLoading] = useState(true)
    const [cloning, setCloning] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    
    // Clone form state
    const [voiceName, setVoiceName] = useState("")
    const [description, setDescription] = useState("")
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [audioMode, setAudioMode] = useState<"upload" | "record">("record")
    
    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    
    // Audio playback
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

    const MAX_RECORDING_TIME = 20 // seconds
    
    // ========== EXISTING ANIMATIONS (UNCHANGED) ==========
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!animationsReady) return;
        
        if (headingRef.current) {
            const words = headingRef.current.querySelectorAll('.word');
            
            gsap.fromTo(words, 
                {
                    y: -100,
                    opacity: 0,
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "back.out(1.7)",
                    delay: 0.3,
                }
            );
        }
    }, [animationsReady]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            startX: position.x,
            startY: position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        setPosition({
            x: dragStart.current.startX + deltaX,
            y: dragStart.current.startY + deltaY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setRotation(prev => prev + (e.deltaY > 0 ? 5 : -5));
    };

    // Physics simulation for text gravity
    useEffect(() => {
        const gravity = 0.5;
        const friction = 0.98;
        const bounce = 0.6;

        const animate = () => {
            if (!bannerRef.current || !textRef.current) return;

            const bannerRect = bannerRef.current.getBoundingClientRect();
            const textRect = textRef.current.getBoundingClientRect();
            
            const rad = (rotation * Math.PI) / 180;
            
            const gravityX = Math.sin(rad) * gravity;
            const gravityY = Math.cos(rad) * gravity;
            
            velocityRef.current.x += gravityX;
            velocityRef.current.y += gravityY;
            
            velocityRef.current.x *= friction;
            velocityRef.current.y *= friction;
            
            let newX = textPosition.x + velocityRef.current.x;
            let newY = textPosition.y + velocityRef.current.y;
            
            const padding = 48;
            const maxX = bannerRect.width - textRect.width - padding;
            const maxY = (bannerRect.height * 0.70) - textRect.height;
            const minX = padding / 2;
            const minY = padding / 2;
            
            if (newX <= minX) {
                newX = minX;
                velocityRef.current.x *= -bounce;
            } else if (newX >= maxX) {
                newX = maxX;
                velocityRef.current.x *= -bounce;
            }
            
            if (newY <= minY) {
                newY = minY;
                velocityRef.current.y *= -bounce;
            } else if (newY >= maxY) {
                newY = maxY;
                velocityRef.current.y *= -bounce;
            }
            
            setTextPosition({ x: newX, y: newY });
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [rotation, textPosition]);

    useEffect(() => {
        setTextPosition({ x: 0, y: 0 });
        velocityRef.current = { x: 0, y: 0 };
    }, []);

    // ========== NEW VOICE CLONING LOGIC ==========
    
    // Load user's clones
    useEffect(() => {
        fetchClones()
    }, [])

    async function fetchClones() {
        try {
            setLoading(true)
            const data = await getMyClones()
            setClones(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Start recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }
            
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
                setRecordedBlob(audioBlob)
                
                // Convert to File object
                const audioFile = new File([audioBlob], "recorded-voice.wav", { type: 'audio/wav' })
                setAudioFile(audioFile)
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }
            
            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingTime(0)
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= MAX_RECORDING_TIME - 1) {
                        stopRecording()
                        return MAX_RECORDING_TIME
                    }
                    return prev + 1
                })
            }, 1000)
            
        } catch (err: any) {
            setError("Microphone access denied. Please allow microphone access.")
        }
    }

    // Stop recording
    function stopRecording() {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }

    // Handle file upload
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg']
            if (!validTypes.includes(file.type)) {
                setError("Invalid file type. Use WAV, MP3, FLAC, or OGG")
                return
            }
            
            if (file.size > 10 * 1024 * 1024) {
                setError("File too large. Max 10MB")
                return
            }
            
            setAudioFile(file)
            setError("")
        }
    }

            
     // Handle clone submission
    async function handleClone() {
    if (!voiceName.trim()) {
        setError("Voice name is required")
        return
    }
    
    if (!audioFile) {
        setError("Please record or upload audio")
        return
    }

    
    if (!audioFile) {
        console.error("❌ audioFile is null!");
        setError("Audio file missing - please try recording again");
        return;
    }


    try {
        setCloning(true)
        setError("")
        setSuccess("")
        
        console.log("🎙️ Starting clone request...");
        console.log("  - Voice name:", voiceName);
        console.log("  - Description:", description);
        console.log("  - Audio file:", audioFile.name, audioFile.type, audioFile.size);
        
        const result = await cloneVoice(audioFile, voiceName, description)
        
        console.log("✅ Clone SUCCESS! Full result:", result);
        console.log("  - ID:", result.id);
        console.log("  - Name:", result.name);
        console.log("  - Preview URL:", result.preview_url);
        console.log("  - Credit used:", result.credit_used);
        console.log("  - Clones remaining:", result.clones_remaining);
        
        if (result.credit_used) {
            deductCredits(result.credit_used);
            console.log(`🎙️ Voice cloned. Credits used: ${result.credit_used}`);
        }
        
        setSuccess(`Voice "${voiceName}" cloned successfully! ${result.clones_remaining || 0} clones remaining.`)
        
        // Reset form
        setVoiceName("")
        setDescription("")
        setAudioFile(null)
        setRecordedBlob(null)
        setRecordingTime(0)
        
        // Refresh clones list
        fetchClones()
        
    } catch (err: any) {
        // ✅ DETAILED ERROR LOGGING
        console.error("❌ Clone error - FULL ERROR OBJECT:", err);
        console.error("  - Error type:", typeof err);
        console.error("  - Error name:", err.name);
        console.error("  - Error message:", err.message);
        console.error("  - Error statusCode:", err.statusCode);
        console.error("  - Error details:", err.details);
        console.error("  - Error stack:", err.stack);
        
        // ✅ Better error display
        let errorMessage = "Failed to clone voice";
        
        if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
        } else if (err.detail && typeof err.detail === 'string') {
            errorMessage = err.detail;
        } else if (err.details) {
            errorMessage = JSON.stringify(err.details, null, 2);
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        
        setError(errorMessage);
    } finally {
        setCloning(false)
    }
}
    // Handle delete clone
    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
        
        try {
            await deleteClone(id)
            setSuccess(`"${name}" deleted successfully`)
            fetchClones()
        } catch (err: any) {
            setError(err.message)
        }
    }

    // Play/pause preview
    function togglePlay(previewUrl: string, id: string) {
        if (playingId === id) {
            audioElement?.pause()
            setPlayingId(null)
            setAudioElement(null)
        } else {
            if (audioElement) {
                audioElement.pause()
            }
            const audio = new Audio(getAudioUrl(previewUrl))
            audio.play()
            audio.onended = () => {
                setPlayingId(null)
                setAudioElement(null)
            }
            
            setPlayingId(id)
            setAudioElement(audio)
        }
    }

    const clonesUsed = clones.length
    const clonesLimit = 3
    const clonesRemaining = clonesLimit - clonesUsed

    return(
        <ProtectedRoute>
            <div className="min-h-screen overflow-hidden">
                {/* ========== EXISTING HERO SECTION (UNCHANGED) ========== */}
                <div className="max-w-7xl mx-auto px-6 py-20">

                    {/* Heading Section */}
                    <div className="text-center mb-12 md:mb-20">
                        <h1 ref={headingRef} className="text-2xl sm:text-4xl md:text-3xl lg:text-5xl font-bold font-amiamie
                         text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                            <span className="word inline-block">The</span>{' '}
                            <span className="word inline-block">Art</span>{' '}
                            <span className="word inline-block">of</span>{' '}
                            <span className="word inline-block">Voice</span>{' '}
                            <span className="word inline-block">Cloning,</span>{' '}
                            <span className="word inline-block">Uncover</span>
                            <br />
                            <span className="word inline-block">The</span>{' '}
                            <span className="word inline-block italic font-serif bg-gradient-to-b from-[#43C6AC]
                             to-[#191654] bg-clip-text text-transparent">Magic</span>{' '}
                            <span className="word inline-block">Behind</span>{' '}
                            <span className="word inline-block">the</span>{' '}
                            <span className="word inline-block">AI</span>
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
                            Discover new possibilities with AI voice cloning. Upload your voice sample 
                            and create realistic custom voices for any project
                        </p>
                        
                    </div>

                     {/* TORN PAPER BANNER SECTION */}
                     <div className="relative lg:mt-32 mt-5">
                        
                        <div 
                            ref={bannerRef} 
                            className="relative w-full h-[100px] md:h-[500px] h-[300px] cursor-move select-none"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                            onMouseDown={handleMouseDown}
                            onWheel={handleWheel}
                        >                            
                            {/* TOP TORN EDGE */}
                            <svg 
                                className="absolute top-0 left-0 w-full h-16 z-20" 
                                viewBox="0 0 1200 60" 
                                preserveAspectRatio="none"
                                style={{ transform: 'translateY(-1px)' }}
                            >
                                <path 
                                    d="M0,30 L20,25 L35,35 L50,20 L70,28 L85,15 L105,32 L125,18 L145,30 L165,22 L185,35 L205,25 L225,30 L245,20 L265,33 L285,25 L305,30 L325,18 L345,28 L365,35 L385,22 L405,30 L425,25 L445,33 L465,20 L485,30 L505,25 L525,35 L545,18 L565,28 L585,30 L605,22 L625,35 L645,25 L665,30 L685,20 L705,33 L725,25 L745,30 L765,18 L785,28 L805,35 L825,22 L845,30 L865,25 L885,33 L905,20 L925,30 L945,25 L965,35 L985,18 L1005,28 L1025,30 L1045,22 L1065,35 L1085,25 L1105,30 L1125,20 L1145,33 L1165,25 L1185,30 L1200,25 L1200,0 L0,0 Z" 
                                    fill="rgb(250, 250, 250)"
                                />
                            </svg>

                            {/* LEFT TORN EDGE */}
                            <svg 
                                className="absolute left-0 top-0 w-16 h-full z-20" 
                                viewBox="0 0 60 500" 
                                preserveAspectRatio="none"
                                style={{ transform: 'translateX(-1px)' }}
                            >
                                <path 
                                    d="M30,0 L25,20 L35,35 L20,50 L28,70 L15,85 L32,105 L18,125 L30,145 L22,165 L35,185 L25,205 L30,225 L20,245 L33,265 L25,285 L30,305 L18,325 L28,345 L35,365 L22,385 L30,405 L25,425 L33,445 L20,465 L30,485 L25,500 L0,500 L0,0 Z" 
                                    fill="rgb(250, 250, 250)"
                                />
                            </svg>

                            {/* RIGHT TORN EDGE */}
                            <svg 
                                className="absolute right-0 top-0 w-16 h-full z-20" 
                                viewBox="0 0 60 500" 
                                preserveAspectRatio="none"
                                style={{ transform: 'translateX(1px)' }}
                            >
                                <path 
                                    d="M30,0 L35,20 L25,35 L40,50 L32,70 L45,85 L28,105 L42,125 L30,145 L38,165 L25,185 L35,205 L30,225 L40,245 L27,265 L35,285 L30,305 L42,325 L32,345 L25,365 L38,385 L30,405 L35,425 L27,445 L40,465 L30,485 L35,500 L60,500 L60,0 Z" 
                                    fill="rgb(250, 250, 250)"
                                />
                            </svg>

                            {/* MAIN BANNER IMAGE */}
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <img 
                                    src="/images/twins.jpg" 
                                    alt="Voice Cloning Banner"
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Overlay Text */}
                                <div 
                                    ref={textRef}
                                    className="absolute p-12"
                                    style={{
                                        left: `${textPosition.x}px`,
                                        top: `${textPosition.y}px`,
                                        transition: 'none'
                                    }}
                                >
                                    <div className="opacity-0 lg:opacity-100">
                                        <h2 className="text-xl font-bold font-amiamie-round text-white tracking-wider 
                                        uppercase drop-shadow-2xl">
                                            Voice
                                        </h2>
                                        <h2 className="lg:text-7xl text-2xl font-bold font-amiamie-round text-white tracking-wider 
                                        uppercase drop-shadow-2xl mix-blend-difference">
                                            Cloning
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM TORN EDGE */}
                            <svg 
                                className="absolute bottom-0 left-0 w-full h-16 z-20" 
                                viewBox="0 0 1200 60" 
                                preserveAspectRatio="none"
                                style={{ transform: 'translateY(1px)' }}
                            >
                                <path 
                                    d="M0,30 L20,35 L35,25 L50,40 L70,32 L85,45 L105,28 L125,42 L145,30 L165,38 L185,25 L205,35 L225,30 L245,40 L265,27 L285,35 L305,30 L325,42 L345,32 L365,25 L385,38 L405,30 L425,35 L445,27 L465,40 L485,30 L505,35 L525,25 L545,42 L565,32 L585,30 L605,38 L625,25 L645,35 L665,30 L685,40 L705,27 L725,35 L745,30 L765,42 L785,32 L805,25 L825,38 L845,30 L865,35 L885,27 L905,40 L925,30 L945,35 L965,25 L985,42 L1005,32 L1025,30 L1045,38 L1065,25 L1085,35 L1105,30 L1125,40 L1145,27 L1165,35 L1185,30 L1200,35 L1200,60 L0,60 Z" 
                                    fill="rgb(250, 250, 250)"
                                />
                            </svg>

                        </div>

                    </div>

                </div>

                {/* ========== EXISTING FEATURES SECTION ========== */}
                <div className="max-w-7xl mx-auto px-6 py-3 mt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon icon="el:mic" width="25" height="25"  className="text-pink-600"/>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Upload Your Voice</h3>
                            <p className="text-gray-600">Simply upload a 10-20 seconds max voice sample to get started</p>
                        </div>

                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon icon="mage:light-bulb" width="28" height="28"  className="text-blue-600"/>
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Processing</h3>
                            <p className="text-gray-600">Our AI analyzes and learns your unique voice patterns</p>
                        </div>

                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon icon="carbon:checkmark-outline" width="32" height="32"  className="text-green-600"/>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Generate Speech</h3>
                            <p className="text-gray-600">Create unlimited speech with your cloned voice</p>
                        </div>

                    </div>
                </div>

                {/* ========== NEW VOICE CLONING SECTION ========== */}
                <div id="cloning-section" className="bg-background">
                    <div className="max-w-6xl mx-auto px-6">
                        
                        {/* Clone Counter */}
                        <div className="text-center mb-12">
                            <div className="inline-block bg-white border border-gray-200 rounded-2xl px-8 py-4">
                                <span className="text-2xl font-medium font-amiamie text-black">
                                    {clonesUsed}/{clonesLimit} Clones Used
                                </span>
                                {clonesRemaining === 0 && (
                                    <span className="ml-3 text-yellow-600 font-semibold">⚠️ Limit Reached</span>
                                )}
                            </div>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                        
                        {success && (
                            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6">
                                <p className="text-green-700 font-medium">{success}</p>
                            </div>
                        )}
                                                    {/* Clone Form */}
                        {clonesRemaining > 0 && (
                            <div className="bg-white rounded-3xl p-4 sm:p-8 mb-12 border border-gray-200">
                                <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">Create Your Voice Clone</h2>
                                
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Voice Name */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Voice Name *</label>
                                        <input
                                            type="text"
                                            value={voiceName}
                                            onChange={(e) => setVoiceName(e.target.value)}
                                            placeholder="e.g., My Voice"
                                            className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl 
                                            px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-black text-gray-900 text-sm sm:text-base"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Description (Optional)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe your voice..."
                                            rows={3}
                                            className="w-full bg-gray-50 border-2 border-gray-300 
                                            rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-black 
                                            resize-none text-gray-900 text-sm sm:text-base"
                                        />
                                    </div>


                                    {/* Audio Mode Toggle */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-3 text-gray-700">Choose Input Method *</label>
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <button
                                                onClick={() => {
                                                    setAudioMode("record")
                                                    setAudioFile(null)
                                                    setRecordedBlob(null)
                                                }}
                                                className={`flex-1 py-3 sm:py-4 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                                                    audioMode === "record"
                                                        ? "bg-black text-white shadow-lg"
                                                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <Mic className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                            Record Audio
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAudioMode("upload")
                                                setRecordedBlob(null)
                                                setRecordingTime(0)
                                            }}
                                            className={`flex-1 py-3 sm:py-4 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                                                audioMode === "upload"
                                                    ? "bg-black text-white shadow-lg"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                            Upload File
                                        </button>
                                    </div>
                                </div>

                                {/* Recording Interface */}
                                {audioMode === "record" && (
                                    <div className="border-2 border-purple-200 rounded-xl p-4 sm:p-8 bg-purple-50 mt-4 sm:mt-0">
                                        <div className="text-center">
                                            {!isRecording && !recordedBlob && (
                                                <>
                                                    <Mic className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-purple-600" />
                                                    <p className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Ready to Record</p>
                                                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-4">
                                                        Record 10-20 seconds of clear speech
                                                    </p>
                                                    <button
                                                        onClick={startRecording}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all text-sm sm:text-base"
                                                    >
                                                        <Mic className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                                        Start Recording
                                                    </button>
                                                </>
                                            )}

                                            {isRecording && (
                                                <>
                                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4">
                                                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-red-500 rounded-full flex items-center justify-center">
                                                            <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                                                        {recordingTime}s / {MAX_RECORDING_TIME}s
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Recording in progress...</p>
                                                    <button
                                                        onClick={stopRecording}
                                                        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all text-sm sm:text-base"
                                                    >
                                                        <StopCircle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                                        Stop Recording
                                                    </button>
                                                </>
                                            )}

                                            {recordedBlob && !isRecording && (
                                                <>
                                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Recording Complete!</p>
                                                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                                                        {recordingTime} seconds recorded
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setRecordedBlob(null)
                                                            setAudioFile(null)
                                                            setRecordingTime(0)
                                                        }}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base"
                                                    >
                                                        Re-record
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                                                    {/* Upload Interface */}
                                {audioMode === "upload" && (
                                    <div className="mt-4 sm:mt-0">
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Upload Audio (WAV, MP3, FLAC, OGG) *
                                        </label>
                                        <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 sm:p-12 text-center hover:border-purple-500 transition-colors cursor-pointer bg-purple-50">
                                            <input
                                                type="file"
                                                accept="audio/wav,audio/mpeg,audio/mp3,audio/flac,audio/ogg"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="audio-upload"
                                            />
                                            <label htmlFor="audio-upload" className="cursor-pointer">
                                                <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-purple-600" />
                                                <p className="text-base sm:text-lg font-semibold mb-2 text-gray-900 px-2">
                                                    {audioFile ? audioFile.name : "Click to upload audio"}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600 px-2">
                                                    10-20 seconds • Max 10MB • Clear speech recommended
                                                </p>
                                            </label>
                                        </div>
                                    </div>
                                )}


                                {/* Submit Button */}
                                <button
                                    onClick={handleClone}
                                    disabled={cloning || !voiceName.trim() || !audioFile}
                                    className="w-full bg-gradient-to-r from-[#43C6AC] to-[#191654]
                                     hover: from-[#43C6AC] to-[#191654] disabled:from-gray-400
                                      disabled:to-gray-500 disabled:cursor-not-allowed text-white 
                                      font-semibold lg:py-5  py-2 rounded-xl transition-all shadow-lg text-lg"
                                >
                                    {cloning ? "Cloning Your Voice..." : " Clone My Voice" } 
                                </button>
                            </div>
                        </div>
                    )}

                    {/* User's Clones */}
                    <div>
                        <h2 className="lg:text-3xl text-2xl font-bold mb-8 text-gray-900">Your Cloned Voices</h2>
                        
                        {loading ? (
                            <p className="text-gray-600">Loading your clones...</p>
                        ) : clones.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                <p className="text-gray-600 text-lg">No clones yet. Create your first one above!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clones.map((clone) => (
                                    <div
                                        key={clone.id}
                                        className="bg-white rounded-2xl p-6 border-2 border-gray-200
                                         hover:border-purple-500 transition-all shadow-md hover:shadow-xl"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{clone.name}</h3>
                                                {clone.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{clone.description}</p>
                                                )}
                                            </div>
                                            
                                            <button
                                                onClick={() => handleDelete(clone.id, clone.name)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                title="Delete clone"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Preview Button */}
                                        {clone.preview_url && (
                                            <button
                                                onClick={() => togglePlay(clone.preview_url, clone.id)}
                                                className="w-full bg-black
                                                        hover:from-purple-700
                                                  hover:to-blue-700 text-white font-semibold py-3 
                                                  rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                {playingId === clone.id ? (
                                                    <>
                                                        <Pause className="w-5 h-5" />
                                                        Pause Preview
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-5 h-5" />
                                                        Play Preview
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    </ProtectedRoute>
)   }



export default function VoiceClonning() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VoiceCloningPage />
    </Suspense>
  );
}