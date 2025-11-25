"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getVoices, Voices } from '@/lib/api';
import Link from 'next/link';

export default function VoicesPage() {
  const router = useRouter();
  const [voices, setVoices] = useState<Voices[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'male' | 'female'>('all');

  useEffect(() => {
    async function loadVoices() {
      try {
        const data = await getVoices();
        setVoices(data);
        setFilteredVoices(data);
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVoices();
  }, []);

  // Filter voices when filter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredVoices(voices);
    } else {
      setFilteredVoices(voices.filter(v => v.gender?.toLowerCase() === activeFilter));
    }
  }, [activeFilter, voices]);

  const handleUseVoice = (voiceId: string) => {
    router.push(`/generate?voice=${voiceId}`);
  };

  const handlePlaySample = (voice: Voices) => {
    // TODO: Play voice sample (implement next)
    alert(`Playing sample for: ${voice.display_name || voice.name}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">Voice Library</h1>
            <p className="text-gray-600">Browse and preview all available voices</p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Voices ({voices.length})
            </button>
            <button
              onClick={() => setActiveFilter('male')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'male'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Male ({voices.filter(v => v.gender === 'male').length})
            </button>
            <button
              onClick={() => setActiveFilter('female')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'female'
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Female ({voices.filter(v => v.gender === 'female').length})
            </button>
          </div>

          {/* Voice Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  {/* Voice Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {voice.display_name?.charAt(0) || voice.name.charAt(0)}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {voice.display_name || voice.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                          {voice.gender}
                        </span>
                        {voice.is_premium && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {voice.description || `A ${voice.gender} voice perfect for various content types.`}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlaySample(voice)}
                      className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseVoice(voice.id)}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Use Voice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredVoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No voices found</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}