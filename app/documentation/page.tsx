'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Book, CreditCard, Menu, X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('tts');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  /* ── video state ── */
  const videoRef      = useRef<HTMLVideoElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const fillRef       = useRef<HTMLDivElement>(null);
  const timeLabelRef  = useRef<HTMLSpanElement>(null);
  const dotRef        = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showPause,  setShowPause]  = useState(false);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v?.duration) return;
    if (fillRef.current)
      fillRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
    if (timeLabelRef.current) {
      const m   = Math.floor(v.currentTime / 60);
      const sec = String(Math.floor(v.currentTime % 60)).padStart(2, '0');
      timeLabelRef.current.textContent = `${m}:${sec}`;
    }
  }, []);

  const handleOverlayClick = useCallback(() => {
    const v = videoRef.current;
    if (!v || hasStarted) return;
    setHasStarted(true);
    setIsLoading(true);
    v.currentTime = 0;
    v.addEventListener('canplay', () => {
      setIsLoading(false);
      setIsPlaying(true);
      v.play().catch(() => {});
      if (overlayRef.current) {
        const el = overlayRef.current;
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity    = '0';
        setTimeout(() => { el.style.display = 'none'; }, 300);
      }
    }, { once: true });
    v.load();
  }, [hasStarted]);

  const handlePauseBtn = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else {
      v.pause();
      setShowPause(true);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => setShowPause(false), 650);
    }
  }, []);

  /* seek to last frame on mount so the end-screen shows as the thumbnail */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const seekToEnd = () => {
      if (v.duration && isFinite(v.duration)) {
        v.currentTime = v.duration - 0.01;
      }
    };
    v.addEventListener('loadedmetadata', seekToEnd, { once: true });
    v.load();
    return () => v.removeEventListener('loadedmetadata', seekToEnd);
  }, []);

  const handleEnded = useCallback(() => setIsPlaying(false), []);
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (dotRef.current) dotRef.current.style.background = 'rgba(0,0,0,0.22)';
  }, []);
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (dotRef.current) dotRef.current.style.background = 'rgba(0,0,0,0.55)';
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['tts', 'stt', 'voice-clone', 'agents', 'audiobook', 'demo', 'credits'];
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const { offsetTop, offsetHeight } = el;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'tts',         label: 'TTS'         },
    { id: 'stt',         label: 'STT'         },
    { id: 'voice-clone', label: 'Voice Clone' },
    { id: 'agents',      label: 'Agents'      },
    { id: 'audiobook',   label: 'Audiobook'   },
    { id: 'credits',     label: 'Credits'     },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* STICKY NAVBAR — UNTOUCHED */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-6xl mx-auto lg:px-6 px-4">
          <div className="flex items-center lg:justify-between justify-between h-14">
            <div className="flex items-center">
              <button className="flex flex-row gap-2 lg:gap-3 items-center" onClick={() => router.push("/")}>
                <Book className="w-4 h-4 lg:w-5 lg:h-5 text-gray-800" />
                <span className="text-sm lg:text-lg font-bold text-gray-900">Documentation</span>
              </button>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors ${activeSection === item.id ? 'text-gray-900 underline' : 'text-gray-600 hover:text-gray-900'}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5 text-gray-800" /> : <Menu className="w-5 h-5 text-gray-800" />}
            </button>
          </div>
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200">
              <div className="py-2">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${activeSection === item.id ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">

        {/* HEADER */}
        <div className="text-center mb-16 pb-8 border-gray-900">
          <h1 className="lg:text-5xl text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            LYVO DOCUMENTATION
          </h1>
          <p className="text-lg text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
            Your Complete Guide to Voice AI Technology
          </p>
        </div>

        {/* TTS + STT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div id="tts" className="scroll-mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>TEXT-TO-SPEECH</h2>
            <div className="mb-4">
              <div className="float-left mr-4 mb-2 w-48 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                <img src="/images/pink-hair2.jpg" className="w-48 h-35 rounded-sm" />
              </div>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Transform written text into natural-sounding speech with our advanced Text-to-Speech engine. Lyvo offers multiple voice options to bring your words to life.</p>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Whether you're creating content, building accessibility features, or just want to hear your text read aloud, our TTS system delivers high-quality, natural-sounding audio every time.</p>
            </div>
            <div className="clear-both"></div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>How to Use TTS</h3>
            <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <p><strong>Step 1:</strong> Navigate to the Text to Speech page from your dashboard.</p>
              <p><strong>Step 2:</strong> Select your preferred voice from the dropdown menu. You can choose from pre-built voices or your own cloned voices.</p>
              <p><strong>Step 3:</strong> Enter the text you want to convert. You can paste up to 5,000 characters at once (no emojies or special characters).</p>
              <p><strong>Step 4:</strong> Click "Generate Speech" and wait for the audio to process (usually 5-15 seconds).</p>
              <p><strong>Step 5:</strong> Download your audio file or play it directly in the browser.</p>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Features</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <li>Multiple voice options including pre-built and custom clones</li>
              <li>High-quality audio output (WAV format)</li>
              <li>Fast processing (5-15 seconds per request)</li>
              <li>Credit-based system (10 credits per generation)</li>
            </ul>
          </div>

          <div id="stt" className="scroll-mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>SPEECH-TO-TEXT</h2>
            <div className="mb-4">
              <div className="float-right ml-4 mb-2 w-48 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                <img src="/images/content.jpg" className="w-48 h-32 rounded-sm" />
              </div>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Convert spoken words into accurate written text with our Speech-to-Text technology. Lyvo delivers reliable transcription for meetings, interviews, lectures, and more.</p>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Our dual-engine approach ensures you always get the best possible transcription, even in challenging audio conditions or with multiple speakers.</p>
            </div>
            <div className="clear-both"></div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>How to Use STT</h3>
            <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <p><strong>Step 1:</strong> Go to the Speech to Text page from your dashboard.</p>
              <p><strong>Step 2:</strong> Upload your audio file (supported formats: MP3, WAV, M4A, FLAC, OGG). Maximum file size is 10MB.</p>
              <p><strong>Step 3:</strong> Click "Transcribe" and wait for processing. This typically takes 10-30 seconds depending on audio length.</p>
              <p><strong>Step 4:</strong> Review your transcription in the text editor. You can copy, or download the text as PDF OR TXT format.</p>
              <p><strong>Step 5:</strong> Save or export your transcription as needed.</p>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Features</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <li>Lyvo STT Ai</li>
              <li>Supports various audio formats (MP3, WAV, M4A, FLAC, OGG)</li>
              <li>Fast processing (10-30 seconds typical)</li>
              <li>Credit-based pricing (8 credits per transcription)</li>
            </ul>
          </div>
        </div>

        {/* VOICE CLONE + AGENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div id="voice-clone" className="scroll-mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>VOICE CLONING</h2>
            <div className="mb-4">
              <div className="float-right ml-4 mb-2 w-48 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center">
                <img src="/images/twins.jpg" className="w-48 h-32 rounded-sm" alt="Twin" />
              </div>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Create a digital replica of any voice with stunning accuracy. Our voice cloning technology captures the unique characteristics, tone, and emotion of a person's voice, allowing you to generate speech that sounds remarkably human.</p>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Perfect for content creators, podcasters, and businesses looking to maintain consistent voice branding across all their audio content.</p>
            </div>
            <div className="clear-both"></div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>How to Clone a Voice</h3>
            <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <p><strong>Step 1:</strong> Navigate to the Voice Clone page from your dashboard.</p>
              <p><strong>Step 2:</strong> Upload a clear audio sample of the voice you want to clone. For best results, use 10-20 seconds of high-quality audio with minimal or no background noise.</p>
              <p><strong>Step 3:</strong> Give your voice clone a memorable name (e.g., "Morgan Freeman Style", "Professional Narrator").</p>
              <p><strong>Step 4  <span className='text-green-600'>(optional):</span></strong> Give clone a Description (e.g. you are a tutor).</p>
              <p><strong>Step 5:</strong> Click "Create Clone" and wait 2-5 minutes for processing. The system analyzes vocal patterns, pitch, and tone.</p>
              <p><strong>Step 6:</strong> Your cloned voice is ready to use in your projects.</p>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Best Practices</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <li>Use high-quality audio (WAV or FLAC preferred, minimum 16kHz sample rate)</li>
              <li>Ensure consistent speaking pace and volume in source audio</li>
              <li>Minimize background noise, music, or echo</li>
              <li>Include varied emotional tones for more versatile clones</li>
              <li>Cost: 100 credits per voice clone creation</li>
              <li>Admin-approved clones available for premium quality</li>
            </ul>
            <div className="mt-6 flex items-center space-x-3 p-4 rounded">
              <div className="w-12 h-12 rounded-full bg-gray-800/30 flex items-center justify-center">
                <Icon icon="fa6-solid:people-line" width="27" height="25" className="color: #fdc10a" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Pro Tip:</p>
                <p className="text-sm text-gray-700 font-serif">Record in a quiet room and speak naturally for the best clone quality.</p>
              </div>
            </div>
          </div>

          <div id="agents" className="scroll-mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>AI AGENTS</h2>
            <div className="mb-4">
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Build intelligent conversational AI agents. Create custom personalities, set specific behaviors, and share your agents with the world through unique shareable links.</p>
              <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>From customer support bots to creative writing assistants, your agents can handle complex conversations while maintaining context and personality throughout interactions.</p>
            </div>
            <div className="clear-both"></div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Creating Your Agent</h3>
            <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <p><strong>Step 1:</strong> Go to the Agents page and click "Create New Agent".</p>
              <p><strong>Step 2:</strong> Define your agent's personality by writing a detailed system prompt or choose from our custom templates. Include tone, expertise, and behavioral guidelines.</p>
              <p><strong>Step 3:</strong> Choose your preferred voice from the dropdown menu (cloned voices allowed) and click create agent.</p>
              <p><strong>Step 4:</strong> Once successful you will be redirected to the agent chat room.</p>
              <p><strong>Step 5:</strong> Test the agent using voice note or text. It's now ready to chat!</p>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Agents Share And Links</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              <li><strong>Agent Link:</strong> go to lyvo agent page to see your agent click on the menu "CREATE SHARE LINK" look for your agent link copy the url use agent anytime without depending on lyvo.</li>
              <li><strong>Password Share:</strong> Create guest links with optional passwords. Perfect for public demos.</li>
              <li><strong>Account Required:</strong> Restrict access to logged-in users only for secure applications.</li>
              <li>Track usage stats (messages sent, unique users, credits consumed)</li>
              <li>Ban abusive users by email or account ID</li>
              <li>Rate limiting: 20 messages/hour for shared users</li>
              <li>Credits deducted from YOUR account (not the shared user)</li>
              <li>Revoke or reactivate share links anytime</li>
            </ul>
            <div className="mt-6 flex items-center space-x-3 p-4 rounded">
              <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center">
                <Icon icon="game-icons:vintage-robot" width="27" height="27" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Pro Tip:</p>
                <p className="text-sm text-gray-700">Start with a detailed personality prompt - the more specific, the better your agent performs!</p>
              </div>
            </div>
          </div>
        </div>

        {/* AUDIOBOOK */}
        <div id="audiobook" className="scroll-mt-20 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>AUDIOBOOK GENERATION</h2>
          <div className="mb-4">
            <div className="float-left mr-6 mb-3 w-64 h-40 bg-gradient-to-br flex-col from-zinc-400 to-gray-400 rounded-lg flex items-center justify-center">
              <Icon icon="simple-icons:audiobookshelf" width="70" height="70" />
              <p className='text-sm font-serif tracking-wide mt-4'>Audiobook</p>
            </div>
            <p className="text-gray-800 leading-relaxed mb-3 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Transform your written content into professional audiobooks with our intelligent chunking system. Whether you're converting novels, blog posts, or educational materials, Lyvo's audiobook generator handles long-form content with ease, automatically breaking down text into manageable segments for optimal audio quality.</p>
            <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Our system intelligently processes large documents, respecting natural paragraph breaks and maintaining narrative flow. Each chunk is processed separately to ensure consistent quality throughout the entire audiobook, then seamlessly merged into a single high-quality audio file.</p>
            <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>Perfect for authors, educators, content creators, and anyone looking to make their written content accessible in audio format. The background processing system means you can continue working while your audiobook is being generated.</p>
          </div>
          <div className="clear-both"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>How to Generate Audiobooks</h3>
              <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                <p><strong>Step 1:</strong> Navigate to the Audiobook page from your dashboard.</p>
                <p><strong>Step 2:</strong> Upload your document (TXT, DOCX, or PDF format supported). Maximum size: 10MB.</p>
                <p><strong>Step 3:</strong> Select the voice you want to narrate your audiobook. Choose from pre-built voices or your custom clones.</p>
                <p><strong>Step 4:</strong> Choose the target language for narration (11 languages available).</p>
                <p><strong>Step 5:</strong> Review the text preview and make any last-minute edits if needed.</p>
                <p><strong>Step 6:</strong> Click "Generate Audiobook" and the system will process your content in the background.</p>
                <p><strong>Step 7:</strong> You'll receive a notification when processing is complete (typically 5-20 minutes depending on length).</p>
                <p><strong>Step 8:</strong> Download your completed audiobook as a single MP3 or WAV file.</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Technical Details</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                <li>Automatic text chunking (respects paragraph boundaries)</li>
                <li>Background processing with progress tracking</li>
                <li>Supports documents up to 100,000 words</li>
                <li>Output formats: MP3 (compressed) or WAV (lossless)</li>
                <li>Maintains consistent voice characteristics throughout</li>
                <li>Chapter markers for easier navigation (coming soon)</li>
                <li>Cost: 30 credits per 1,000 words</li>
                <li>Processing time: ~1 minute per 1,000 words</li>
              </ul>
              <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
                <p className="text-sm font-bold text-gray-900 mb-1">Quality Tip:</p>
                <p className="text-sm text-gray-700">For best results, ensure your document is well-formatted with clear paragraph breaks. Remove any special characters or formatting that might interfere with natural speech flow.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── VIDEO — in doc style, before credits ── */}
        <div id="demo" className="scroll-mt-20 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            SEE IT IN ACTION
          </h2>
          <p className="text-gray-800 leading-relaxed mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Watch a quick walkthrough of the Lyvo dashboard — from text-to-speech generation and voice cloning to AI agents and audiobook creation, all in under a minute.
          </p>

          {/* video card */}
          <div className="relative w-full rounded-lg overflow-hidden border border-gray-300">
            <div className="relative aspect-video bg-[#e8e7e4]">

              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                preload="auto"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPause={handlePause}
                onPlay={handlePlay}
              >
                {/* <source src="/videos/LyvoSFx.webm" type="video/webm" /> */}
                <source src="/videos/LyvoSFx.mp4" type="video/mp4" />
              </video>

              {/* pre-play overlay */}
              {!hasStarted && (
                <div
                  ref={overlayRef}
                  onClick={handleOverlayClick}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                >
                  <div className="w-[clamp(52px,8vw,64px)] h-[clamp(52px,8vw,64px)] rounded-full bg-white/92 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.14)] transition-transform duration-200 group-hover:scale-[1.07]">
                    <svg className="w-5 h-5 ml-0.5 text-[#0a0a0a]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 z-10">
                  <div className="w-[clamp(52px,8vw,64px)] h-[clamp(52px,8vw,64px)] rounded-full bg-white/92 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.14)]">
                    <div className="w-5 h-5 rounded-full border-2 border-black/15 border-t-black/70 animate-spin" />
                  </div>
                </div>
              )}

              {/* pause flash */}
              {showPause && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </div>
              )}

              {/* tap-to-pause */}
              {hasStarted && !isLoading && (
                <button
                  onClick={handlePauseBtn}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer"
                />
              )}
            </div>

            {/* progress bar */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-100 border-t border-gray-300">
              <div
                ref={dotRef}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
                style={{ background: 'rgba(0,0,0,0.18)' }}
              />
              <div className="flex-1 h-0.5 bg-black/[0.10] rounded-full overflow-hidden">
                <div
                  ref={fillRef}
                  className="h-full w-0 bg-gray-700 rounded-full"
                  style={{ transition: 'width 0.25s linear' }}
                />
              </div>
              <span
                ref={timeLabelRef}
                className="text-[11px] font-mono text-black/30 flex-shrink-0 min-w-[28px] text-right tabular-nums"
              >
                –:––
              </span>
            </div>
          </div>
        </div>

        {/* CREDITS & PAYMENT */}
        <div id="credits" className="scroll-mt-20 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            CREDITS & PAYMENT SYSTEM
          </h2>
          <div className="mb-4">
            <div className="float-right ml-6 mb-3 w-40 h-20 lg:w-64 lg:h-40 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
              <CreditCard className="lg:w-20 lg:h-20 w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-gray-800 leading-relaxed mb-3 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Lyvo operates on a transparent credit-based system that gives you complete control over your spending. Every feature has a clear credit cost, and you only pay for what you use. No hidden fees, no surprise charges - just straightforward pricing that scales with your needs.</p>
            <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>New users start with 1,000 free credits to explore all features. When you're ready for more, purchase credits at $1.03 per 1,000 credits through our secure Flutterwave integration. Credits never expire, and your account automatically upgrades to Tier 2 (premium) status with your first purchase. Credits are refiled after 1 month if you have less than 2 credits on free tier.</p>
            <p className="text-gray-800 leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>All transactions are protected with enterprise-grade security including amount validation, idempotent processing to prevent double-charging, and complete audit trails. Your payment information is never stored on our servers.</p>
          </div>
          <div className="clear-both"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Feature Credit Costs</h3>
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-3 font-bold" style={{ fontFamily: 'Georgia, serif' }}>Feature</th>
                      <th className="text-right p-3 font-bold" style={{ fontFamily: 'Georgia, serif' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                    <tr className="border-b border-gray-200"><td className="p-3">Text-to-Speech Generation</td><td className="text-right p-3">5 credits</td></tr>
                    <tr className="border-b border-gray-200 bg-gray-50"><td className="p-3">Speech-to-Text Transcription</td><td className="text-right p-3">8 credits</td></tr>
                    <tr className="border-b border-gray-200"><td className="p-3">Voice Clone Creation</td><td className="text-right p-3">100 credits</td></tr>
                    <tr className="border-b border-gray-200 bg-gray-50"><td className="p-3">AI Agent Message</td><td className="text-right p-3">2 credits (additional 5 credits if voice enabled)</td></tr>
                    <tr className="bg-gray-50"><td className="p-3">Audiobook (per 1,000 words)</td><td className="text-right p-3">15 credits</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Credit Pricing</h3>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-lg p-6">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-emerald-700" style={{ fontFamily: 'Georgia, serif' }}>$1.03</p>
                  <p className="text-gray-700 text-sm mt-1">per 1,000 credits</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                  <li>✓ No minimum purchase</li>
                  <li>✓ Credits never expire</li>
                  <li>✓ Instant delivery</li>
                  <li>✓ Secure payment processing</li>
                  <li>✓ Upgrade to Tier 2 on first purchase</li>
                </ul>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-xs font-bold text-gray-900 mb-1">New Users:</p>
                <p className="text-xs text-gray-700">Start with 100 FREE credits to try all features!</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>How to Purchase Credits</h3>
              <div className="space-y-3 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                <p><strong>Step 1:</strong> Click "Upgrade" from your dashboard/Sidebar.</p>
                <p><strong>Step 2:</strong> Enter the amount in USD. The system automatically calculates credits (must be exact multiples of $1.03).</p>
                <p><strong>Step 3:</strong> Review your purchase: Amount, credits to receive, and payment method.</p>
                <p><strong>Step 4:</strong> Click "Proceed to Payment" - you'll be redirected to Flutterwave's secure checkout.</p>
                <p><strong>Step 5:</strong> Complete payment using your preferred method (card, bank transfer, mobile money).</p>
                <p><strong>Step 6:</strong> Credits are added instantly upon successful payment. Check your dashboard balance.</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Account Tiers</h3>
              <div className="space-y-4">
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Tier 1 (Free)</h4>
                  <ul className="text-sm text-gray-800 space-y-1" style={{ fontFamily: 'Georgia, serif' }}>
                    <li>• 1000 free credits on signup</li>
                    <li>• Access to all features</li>
                    <li>• Standard processing speed</li>
                  </ul>
                </div>
                <div className="border-2 border-emerald-400 rounded-lg p-4 bg-emerald-50">
                  <h4 className="font-bold text-emerald-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Tier 2 (Premium)</h4>
                  <ul className="text-sm text-gray-800 space-y-1" style={{ fontFamily: 'Georgia, serif' }}>
                    <li>• Unlocked with first purchase</li>
                    <li>• Priority processing queue</li>
                    <li>• Advanced/premium voice options</li>
                    <li>• Priority support</li>
                    <li>• Exclusive features access</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex items-start space-x-3 p-4 bg-gray-50 rounded">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Security Guarantee:</p>
                  <p className="text-sm text-gray-700">All payments processed through Flutterwave with bank-level encryption. We never store your payment details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}