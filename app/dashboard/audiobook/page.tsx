"use client"
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import AudioPlayer from '@/components/AudioPlayer';
import { getVoices, Voices, getToken, getRandomVoices, generateAudiobookFromFile } from '@/lib/api';



function GenarateAudiobook () {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [voices, setVoices] = useState<Voices[]>([]);
  const [recentVoices, setRecentVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredVoices, setFilteredVoices] = useState<Voices[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voices | null>(null);
    const searchParams = useSearchParams();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedAudiobookVoice, setSelectedAudiobookVoice] = useState<Voices | null>(null);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [completedAudiobook, setCompletedAudiobook] = useState<any>(null); 


// Add polling function
useEffect(() => {
  if (!pollingJobId) return;

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tts/audiobook/status/${pollingJobId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to check status');
      
          const status = await response.json();
          if (status.status === 'completed') {
      setPollingJobId(null);
      setIsGenerating(false);
      setCompletedAudiobook(status);

      } else if (status.status === 'failed') {
        setPollingJobId(null);
        setIsGenerating(false);
        setGenerationError('Audiobook generation failed');
      }
      // If still processing, keep polling
      
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  // Poll every 5 seconds
  const interval = setInterval(checkStatus, 5000);
  
  return () => clearInterval(interval);
}, [pollingJobId]);



useEffect(() => {
  async function loadVoices() {
    try {
      const data = await getVoices();
      setVoices(data);
      setFilteredVoices(data);

         // Check for voice parameter in URL
        const voiceId = searchParams.get('voice');
        if (voiceId) {
          const voice = data.find(v => v.id === voiceId);
          if (voice) {
            setSelectedAudiobookVoice(voice);  // Set the voice from URL
            return;  // Skip setting default
          }
        }
      // Set default audiobook voice to first voice (index 0)
      if (data.length > 0) {
        setSelectedAudiobookVoice(data[0]);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setLoading(false);
    }
  }
  
  loadVoices();
}, [searchParams]);

        useEffect(() => {
        // Fetch random voices for "Recent Voices" section
        async function loadVoices() {
          try {
            const voices = await getRandomVoices(6);
            setRecentVoices(voices);
          } catch (error) {
            console.error('Failed to load voices:', error);
          } finally {
            setLoading(false);
          }
        }
        
        loadVoices();
      }, []);

    const handlePlayVoice = (voice: Voices) => {
      setSelectedVoice(voice);
    };
 

const handleGenerateAudiobook = async () => {
  // Validation
  if (!uploadedFile) {
    setGenerationError('Please upload a document');
    return;
  }
  if (!title.trim()) {
    setGenerationError('Please enter a title');
    return;
  }
  if (!selectedAudiobookVoice) {
    setGenerationError('Please select a voice');
    return;
  }

  setIsGenerating(true);
  setGenerationError(null);

  try {
    const result = await generateAudiobookFromFile(
      uploadedFile,
      title,
      author || null,
      selectedAudiobookVoice.id
    );
    
    if (result.status === 'processing') {
      // Start polling for status
      setPollingJobId(result.id);
      // Keep isGenerating = true, it will be set to false when complete
    } else {
      setIsGenerating(false);
      alert(`Audiobook ready! Duration: ${result.duration}s`);
    }
    
  } catch (error: any) {
    setGenerationError(error.message);
    setIsGenerating(false);
  }
};    

    return(
        <ProtectedRoute>
            <div className="border rounded-2xl border-white bg-black/35 flex flex-row overflow-hidden">
                <div className="text-2xl font-semibold flex flex-col px-10 py-6 flex-shrink-0">
                    <h1 className="font-amiamie text-black">Cutting edge voices</h1>
                    <p className='text-sm text-white whitespace-nowrap'>world most innovative voice platform</p>
                </div>
                <div className="flex flex-row items-center justify-end gap-0.3 ml-auto flex-shrink-0">
                    <img src='\images\pink-hair.jpg' width='100' className='rounded-l-xl object-cover' alt="Voice 1"/>
                    <img src='\images\lady-face.jpg' width='100' className='object-cover' alt="Voice 2"/>
                    <img src='\images\lady.jpg' width='100' className='object-cover' alt="Voice 3"/>
                    <img src='\images\pixel.jpg' width='100' className='object-cover' alt="Voice 4"/>
                    <img src='\images\photo3.jpg' width='100' className='object-cover' alt="Voice 5"/>
                    <img src='\images\blonde.jpg' width='100' className='rounded-r-xl object-cover' alt="Voice 6"/>
                </div>
            </div>
            <div className="min-h-screen bg-background flex flex-col pt-20 px-4 pb-12">
                <div className="mb-8">
                    <h2 className='text-xl font-medium mb-2 font-amiamie flex flex-row gap-2'>
                        Trending Voices
                        <Link href='/dashboard/voices'><Icon icon="hugeicons:greater-than" 
                        width="15" height="24"  className="text-gray-500" /></Link>
                    </h2>
                    {loading ? (
                    <div className="grid grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i)=> (
                                   <div key={i} className="animate-pulse flex items-start gap-3 p-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>                    
                        ))}
                    </div>
                    ):(
                    <div className="grid grid-cols-3 gap-6">
                        {recentVoices.map((voice) => (
                         <div key={voice.id} className="flex items-start gap-3 p-4
                          rounded-4xl hover:bg-gray-100 cursor-pointer group">

                            <div 
                              onClick={() => handlePlayVoice(voice)}
                              className="border p-4 rounded-xl border-gray-200 bg-gray-200 flex-shrink-0 cursor-pointer
                               hover:bg-gray-100 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br
                              from-[#43C6AC] to-[#191654]
                                  flex items-center justify-center text-white font-amiamie uppercase">
                                  {voice.display_name?.charAt(0) || voice.name.charAt(0)}
                              </div>
                             </div>  
                             <div className="flex flex-col min-w-0 flex-1">
                                    <h3 className='font-amiamie font-normal text-sm truncate'>
                                        {voice.display_name}
                                    </h3>
                                    <p className='text-sm text-secondary line-clamp-2'>{voice.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs">🇺🇸🇯🇵</span>
                                        <span className="text-xs text-gray-600">English +10</span>
                                    </div>
                             </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div> 

                    {/* File Upload Section */}
                    <div className="mb-8">
                    <h2 className='text-xl font-medium mb-4 font-amiamie'>
                        Upload Document
                    </h2>
                    
                    {/* File Upload Box */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-gray-400 transition-colors cursor-pointer bg-white">
                        <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".epub,.pdf,.txt,.html,.docx"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                            setUploadedFile(file);
                            }
                        }}
                        />
                        <label htmlFor="document-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                            <Icon icon="material-symbols:upload" width="48" height="48" className="text-gray-400" />
                            <div>
                            <p className="text-lg font-medium text-gray-700">
                                {uploadedFile ? uploadedFile.name : 'Click to upload, or drag and drop'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">.epub, .pdf, .txt, .html, .docx</p>
                            </div>
                        </div>
                        </label>
                    </div>
                    </div>

                {/* Voice Selection for Audiobook */}
                <div className="mb-8">
                <h2 className='text-xl font-medium mb-4 font-amiamie'>
                    Default voice
                </h2>
                
                {/* Voice Dropdown */}
                <div className="relative">
                    <button 
                    onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 flex items-center justify-between hover:border-gray-400 transition-colors"
                    >
                    {selectedAudiobookVoice ? (
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#43C6AC] to-[#191654] flex items-center justify-center text-white font-amiamie uppercase">
                            {selectedAudiobookVoice.display_name?.charAt(0) || selectedAudiobookVoice.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">
                            {selectedAudiobookVoice.display_name || selectedAudiobookVoice.name}
                        </span>
                        </div>
                    ) : (
                        <span className="text-gray-500">Select a voice</span>
                    )}
                    <Icon icon="mdi:chevron-down" width="24" height="24" className="text-gray-600" />
                    </button>

                    {/* Dropdown List */}
                    {showVoiceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 
                    rounded-xl shadow-lg max-h-64 overflow-y-auto z-10">
                        {voices.map((voice) => (
                        <div
                            key={voice.id}
                            onClick={() => {
                            setSelectedAudiobookVoice(voice);
                            setShowVoiceDropdown(false);
                            }}
                            className="p-4 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b
                             border-gray-100 last:border-b-0"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#43C6AC] to-[#191654] 
                            flex items-center justify-center text-white font-amiamie uppercase">
                            {voice.display_name?.charAt(0) || voice.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                            <p className="font-medium text-gray-900">
                                {voice.display_name || voice.name}
                            </p>
                            <p className="text-xs text-gray-600">{voice.description}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>
          {/* Title & Author Input */}
          <div className="mb-8">
            <h2 className='text-xl font-medium mb-4 font-amiamie'>Book Details</h2>
            
            <input
              type="text"
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 mb-4"
            />
            
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-white border-2 border-gray-300 rounded-xl p-4"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateAudiobook}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-[#43C6AC] to-[#191654] text-white
             font-medium py-4 px-6 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Audiobook'}
          </button>

          {/* Error Message */}
          {generationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {generationError}
            </div>
          )}                
            </div>

            {selectedVoice && selectedVoice.sample_audio_url && (
              <AudioPlayer
                audioUrl={selectedVoice.sample_audio_url}
                voiceName={selectedVoice.display_name || selectedVoice.name}
                onClose={() => setSelectedVoice(null)}
              />
            )}

      {/* Bottom Audiobook Player */}
      {completedAudiobook && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Close Button */}
            <button
              onClick={() => setCompletedAudiobook(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <Icon icon="mdi:close" width="24" height="24" />
            </button>

            {/* Title */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{completedAudiobook.title}</h3>
              <p className="text-sm text-gray-600">Duration: {Math.floor(completedAudiobook.duration / 60)}min {completedAudiobook.duration % 60}s</p>
            </div>

            {/* Audio Player */}
            <audio 
              controls 
              className="w-full mb-4"
              style={{
                height: '40px',
                borderRadius: '8px'
              }}
             src={`${API_BASE_URL}${completedAudiobook.audio_url}`}
            >
              Your browser does not support audio playback.
            </audio>

            {/* Download Button */}
            <a
            href={`${API_BASE_URL}${completedAudiobook.audio_url}`}
              download={`${completedAudiobook.title}.wav`}
              className="w-full bg-gradient-to-r from-[#43C6AC] to-[#191654] text-white font-medium py-3 px-6 rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:download" width="20" height="20" />
              Download Audiobook
            </a>
          </div>
        </div>
      )}
        

        </ProtectedRoute>
    )
}
export default function GenerateAudioPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenarateAudiobook />
    </Suspense>
  );
}
