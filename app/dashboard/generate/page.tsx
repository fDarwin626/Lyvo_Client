"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVoices, Voices, getToken, generateSpeech, waitForGeneration } from '@/lib/api';
import Link from 'next/link';

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [voices, setVoices] = useState<Voices[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voices | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVoices() {
      try {
        const data = await getVoices();
        setVoices(data);
        
        // Get voice from URL parameter
        const voiceId = searchParams.get('voice');
        if (voiceId) {
          const voice = data.find(v => v.id === voiceId);
          if (voice) setSelectedVoice(voice);
        } else if (data.length > 0) {
          // Default to first voice
          setSelectedVoice(data[0]);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      }
    }
    
    loadVoices();
  }, [searchParams]);

const handleGenerate = async () => {
  if (!text.trim()) {
    setError('Please enter some text');
    return;
  }

  if (!selectedVoice) {
    setError('Please select a voice');
    return;
  }

  setError('');
  setLoading(true);
  setGeneratedAudio(null); // Clear previous audio

  try {
   
    //  Start generation (returns immediately)
    const result = await generateSpeech(text, selectedVoice.id);
    
    // Wait for completion with status updates
    const finalStatus = await waitForGeneration(
      result.id,
      (status) => {
        // Optional: You can show status to user
        console.log('Generation status:', status);
      }
    );
    
    // Step 3: Set the audio URL
    if (finalStatus.audio_url) {
      setGeneratedAudio(`http://127.0.0.1:8000${finalStatus.audio_url}`);
    } else {
      throw new Error('Audio generation failed');
    }
    
  } catch (err: any) {
    setError(err.message || 'Failed to generate speech');
  } finally {
    setLoading(false);
  }
};
  const characterCount = text.length;
  const maxCharacters = 5000;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-20 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 font-amiamie">Generate Speech</h1>
            <p className="text-gray-600">Convert your text to speech with AI voices</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            
            {/* Voice Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Voice
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#43C6AC] to-[#191654] flex items-center justify-center text-white font-bold">
                    {selectedVoice?.display_name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedVoice?.display_name || selectedVoice?.name || 'Select a voice'}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {selectedVoice?.gender} • {selectedVoice?.language}
                    </p>
                  </div>
                </div>
                <Link href="voices">
                  <button className="px-4 py-2 text-sm bg-white border
                   border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Change Voice
                  </button>
                </Link>
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={maxCharacters}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {characterCount} / {maxCharacters} characters
                </p>
                {characterCount > maxCharacters * 0.9 && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Approaching character limit
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim() || !selectedVoice}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                  Generate Speech
                </>
              )}
            </button>

            {/* Generated Audio */}
            {generatedAudio && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-4">✅ Speech Generated!</h3>
                
                {/* Audio Player */}
                <audio controls className="w-full mb-4">
                  <source src={generatedAudio} type="audio/wav" />
                  Your browser does not support audio playback.
                </audio>

                {/* Download Button */}
                 <a
                   href={generatedAudio}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Audio
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}