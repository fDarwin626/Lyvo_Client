'use client';

import { useState, useRef } from 'react';
import { adminCloneVoice } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, Upload, StopCircle } from 'lucide-react';

export default function AdminCloneVoice() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    voiceName: '',
    displayName: '',
    description: '',
    gender: '',
    isPremium: false
  });
  
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioMode, setAudioMode] = useState<'upload' | 'record'>('upload');
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MAX_RECORDING_TIME = 30; // seconds

  // Start recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(audioBlob);
        
        // Convert to File
        const file = new File([audioBlob], 'recorded-voice.wav', { type: 'audio/wav' });
        setAudioFile(file);
        
        // Create preview URL
        const url = URL.createObjectURL(audioBlob);
        setAudioPreview(url);
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err: any) {
      setError('Microphone access denied');
    }
  }

  // Stop recording
  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a)$/i)) {
      setError('Invalid file type');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    setAudioFile(file);
    setError('');
    
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!audioFile) {
      setError('Please record or upload audio');
      return;
    }

    if (!formData.voiceName.trim()) {
      setError('Voice name is required');
      return;
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.gender) {
      setError('Please select a gender');
      return;
    }

    setLoading(true);

    try {
      await adminCloneVoice(
        audioFile,
        formData.voiceName,
        formData.displayName,
        formData.description,
        formData.gender,
        formData.isPremium
      );

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/admin/voices');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Voice cloning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] p-8">
      <div className="mb-8">
        <Link href="/admin/voices" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
          ← Back to Voices
        </Link>
        <h1 className="text-3xl font-bold text-white font-amiamie">Clone New Voice</h1>
        <p className="text-gray-400 mt-1">Upload or record audio to create a public voice</p>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Icon icon="mdi:check-circle" width="24" className="text-green-400" />
          <div>
            <p className="text-green-400 font-medium">Voice cloned successfully!</p>
            <p className="text-green-400/80 text-sm">Redirecting...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Icon icon="mdi:alert-circle" width="24" className="text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Form */}
        <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6">
          <h2 className="text-white text-xl font-semibold mb-6">Voice Details</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Voice Name (System ID) *</label>
              <input
                type="text"
                value={formData.voiceName}
                onChange={(e) => setFormData({...formData, voiceName: e.target.value})}
                placeholder="e.g., morgan_freeman"
                className="w-full bg-[#1a1f3a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Display Name *</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="e.g., Morgan"
                className="w-full bg-[#1a1f3a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Deep, authoritative voice..."
                className="w-full bg-[#1a1f3a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-[#1a1f3a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="bg-[#1a1f3a] rounded-lg p-4 border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPremium}
                  onChange={(e) => setFormData({...formData, isPremium: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">Premium Voice</div>
                  <div className="text-gray-400 text-sm">Requires subscription</div>
                </div>
                {formData.isPremium && (
                  <Icon icon="mdi:crown" width="24" className="text-yellow-400" />
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Cloning...
                </>
              ) : success ? (
                <>
                  <Icon icon="mdi:check" width="20" />
                  Cloned!
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-duplicate" width="20" />
                  Clone Voice
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right - Audio Input */}
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-white text-xl font-semibold mb-4">Audio Source</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAudioMode('upload');
                  setRecordedBlob(null);
                  setRecordingTime(0);
                }}
                className={`py-3 rounded-lg font-semibold transition ${
                  audioMode === 'upload'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1f3a] text-gray-400 hover:bg-[#242945]'
                }`}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Upload File
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAudioMode('record');
                  setAudioFile(null);
                  setAudioPreview(null);
                }}
                className={`py-3 rounded-lg font-semibold transition ${
                  audioMode === 'record'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1f3a] text-gray-400 hover:bg-[#242945]'
                }`}
              >
                <Mic className="w-5 h-5 inline mr-2" />
                Record
              </button>
            </div>

            {/* Upload Interface */}
            {audioMode === 'upload' && (
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition cursor-pointer">
                <input
                  type="file"
                  accept="audio/wav,audio/mpeg,audio/mp3,audio/flac,audio/ogg,audio/x-m4a"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                />
                
                <label htmlFor="audio-upload" className="cursor-pointer block">
                  <Icon icon="mdi:cloud-upload" width="64" className="text-gray-600 mx-auto mb-4" />
                  
                  {audioFile ? (
                    <div>
                      <p className="text-white font-medium mb-1">{audioFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium mb-2">Click to upload</p>
                      <p className="text-gray-400 text-sm">WAV, MP3, FLAC, OGG (Max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Recording Interface */}
            {audioMode === 'record' && (
              <div className="border-2 border-purple-500/30 rounded-xl p-8 bg-purple-500/5">
                <div className="text-center">
                  {!isRecording && !recordedBlob && (
                    <>
                      <Mic className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                      <p className="text-white font-semibold mb-2">Ready to Record</p>
                      <p className="text-gray-400 text-sm mb-6">6-30 seconds of clear speech</p>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full transition"
                      >
                        <Mic className="w-5 h-5 inline mr-2" />
                        Start Recording
                      </button>
                    </>
                  )}

                  {isRecording && (
                    <>
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">
                        {recordingTime}s / {MAX_RECORDING_TIME}s
                      </p>
                      <p className="text-gray-400 text-sm mb-6">Recording...</p>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-full transition"
                      >
                        <StopCircle className="w-5 h-5 inline mr-2" />
                        Stop
                      </button>
                    </>
                  )}

                  {recordedBlob && !isRecording && (
                    <>
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="mdi:check" width="32" className="text-white" />
                      </div>
                      <p className="text-white font-semibold mb-2">Recording Complete</p>
                      <p className="text-gray-400 text-sm mb-6">{recordingTime} seconds</p>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordedBlob(null);
                          setAudioFile(null);
                          setAudioPreview(null);
                          setRecordingTime(0);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition"
                      >
                        Re-record
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Audio Preview */}
            {audioPreview && (
              <div className="mt-6">
                <label className="text-gray-400 text-sm block mb-2">Preview</label>
                <audio controls className="w-full">
                  <source src={audioPreview} type={audioFile?.type} />
                </audio>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Icon icon="mdi:information" width="20" className="text-purple-400" />
              Requirements
            </h3>
            
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-gray-400">
                <Icon icon="mdi:check" width="18" className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Duration: 6-30 seconds</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Icon icon="mdi:check" width="18" className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Clear speech, minimal noise</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Icon icon="mdi:check" width="18" className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Max file size: 10MB</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}