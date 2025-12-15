"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { transcribeAudio, downloadTranscription, getUserBalance, APIError } from '@/lib/api';
import { Icon } from '@iconify/react';
import { useCreditBalance } from '@/app/contexts/CreditContext';

export default function SpeechToTextPage() {
  const router = useRouter();
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const {deductCredits} =  useCreditBalance();
  // Processing State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  
  // Results State
  const [transcription, setTranscription] = useState<{
    id: string;
    text: string;
    method: string;
    duration: number;
    filename: string;
  } | null>(null);
  
  // UI State
  const [error, setError] = useState('');


  // ========== FILE UPLOAD HANDLERS ==========
  
  const handleFileSelect = (file: File) => {
    setError('');
    
    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an audio file (MP3, WAV, FLAC, OGG, M4A)');
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    
    setSelectedFile(file);
    setTranscription(null); // Clear previous results
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // ========== TRANSCRIPTION HANDLER ==========
  
  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError('Please select an audio file');
      return;
    }
    
    setError('');
    setLoading(true);
    setProgress('Uploading audio...');
    
    try {
      // Step 1: Upload and transcribe
      setProgress('Processing audio with AI...');
      const result = await transcribeAudio(selectedFile);

      // Step 3: Show results
      setTranscription({
        id: result.id,
        text: result.text,
        method: result.method,
        duration: result.duration,
        filename: result.original_filename
      });
      deductCredits(result.credits_used);
      setProgress('✅ Transcription complete!');
      
    } catch (err: any) {
      console.error('Transcription error:', err);
      
      if (err instanceof APIError) {
        if (err.statusCode === 402) {
          setError('Insufficient credits. You need 8 credits for transcription.');
        } else if (err.statusCode === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Transcription failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ========== DOWNLOAD HANDLERS ==========
  
  const handleDownload = async (format: 'txt' | 'pdf') => {
    if (!transcription) return;
    
    try {
      setProgress(`Downloading ${format.toUpperCase()}...`);
      
      const blob = await downloadTranscription(transcription.id, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${transcription.filename.replace(/\.[^/.]+$/, '')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setProgress('');
      
    } catch (err: any) {
      setError('Download failed. Please try again.');
    }
  };

  const handleCopyText = () => {
    if (!transcription) return;
    
    navigator.clipboard.writeText(transcription.text);
    setProgress('✅ Text copied to clipboard!');
    setTimeout(() => setProgress(''), 2000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-20 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 font-amiamie">Speech to Text</h1>
              <p className="text-gray-600">Convert audio files to text using AI</p>
            </div>
            
            </div>
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            
            {/* File Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${selectedFile ? 'bg-green-50 border-green-300' : ''}
              `}
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              {!selectedFile ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Icon icon="mdi:folder-open" className="text-white" width="40" height="40" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Drag and drop audio file or click to browse
                    </p>
                    <p className="text-sm text-gray-600">
                      Maximum file size: <span className="font-medium">10MB</span> • 
                      Maximum duration: <span className="font-medium">5 minutes</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: MP3, WAV, FLAC, OGG, M4A
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                      <Icon icon="mdi:check" className="text-white" width="40" height="40" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>

            {/* Cost Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Icon icon="mdi:information" className="text-blue-600 flex-shrink-0 mt-0.5" width="20" height="20" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Transcription Cost</p>
                <p className="text-blue-700">
                  This transcription will cost <span className="font-bold">8 credits</span> regardless of audio length (up to 5 minutes)
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Progress Message */}
            {progress && !error && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">{progress}</p>
              </div>
            )}

            {/* Transcribe Button */}
            <button
              onClick={handleTranscribe}
              disabled={loading || !selectedFile}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Icon icon="mdi:microphone" width="24" height="24" />
                  Transcribe Audio (8 Credits)
                </>
              )}
            </button>

            {/* Transcription Results */}
            {transcription && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Transcription Result</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                     Lyvo AI Speech to Text
                  </span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold">
                      {Math.floor(transcription.duration / 60)}m {Math.floor(transcription.duration % 60)}s
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">File</p>
                    <p className="font-semibold text-sm truncate">{transcription.filename}</p>
                  </div>
                </div>

                {/* Transcribed Text */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Transcribed Text</p>
                    <button
                      onClick={handleCopyText}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Icon icon="mdi:content-copy" width="16" height="16" />
                      Copy
                    </button>
                  </div>
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {transcription.text}
                  </p>
                </div>

                {/* Download Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDownload('txt')}
                    className="py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:file-document" width="20" height="20" />
                    Download TXT
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:file-pdf-box" width="20" height="20" />
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View History Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard/speech-to-text/history')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
            >
              <Icon icon="mdi:history" width="20" height="20" />
              View Transcription History
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}