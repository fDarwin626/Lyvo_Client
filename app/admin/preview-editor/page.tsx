'use client';

import { useEffect, useState } from 'react';
import { getAdminVoices, updateVoicePreviewText, Voices } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function PreviewEditor() {
  const [voices, setVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVoice, setEditingVoice] = useState<Voices | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const data = await getAdminVoices();
      setVoices(data);
    } catch (err) {
      console.error('Failed to load voices:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (voice: Voices) => {
    setEditingVoice(voice);
    setPreviewText(''); // Start fresh - they need to record new audio
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!editingVoice || !previewText.trim()) return;

    setSaving(true);
    setSuccess(false);

    try {
      await updateVoicePreviewText(editingVoice.id, previewText);
      setSuccess(true);
      
      // Close after 1.5 seconds
      setTimeout(() => {
        setEditingVoice(null);
        loadVoices();
      }, 1500);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredVoices = voices.filter(voice =>
    voice.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-amiamie">Preview Text Editor</h1>
        <p className="text-gray-400 mt-1">Update voice sample texts (requires re-generation)</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Icon icon="mdi:information" width="24" className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium mb-1">How It Works</p>
          <p className="text-blue-300/80 text-sm">
            Changing preview text only updates the database. To generate new audio, you'll need to run the sample generation script:
            <code className="block bg-black/30 px-2 py-1 rounded mt-2 text-xs">python generate_samples.py</code>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6 mb-6">
        <input
          type="text"
          placeholder="Search voices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVoices.map((voice) => (
          <div key={voice.id} className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">{voice.display_name || voice.name}</h3>
                <p className="text-gray-500 text-sm">{voice.name}</p>
              </div>
            </div>

            {/* Current Preview Text */}
            <div className="bg-[#1a1f3a] rounded-lg p-3 mb-4">
              <p className="text-gray-400 text-xs mb-1">Current Preview:</p>
              <p className="text-white text-sm italic">
                {voice.sample_audio_url ? '"Sample text..."' : 'No preview text set'}
              </p>
            </div>

            <button
              onClick={() => openEditor(voice)}
              className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:pencil" width="18" />
              Edit Preview Text
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingVoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1230] rounded-xl border border-gray-800 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">
                  Edit Preview: {editingVoice.display_name || editingVoice.name}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Write the new sample text for this voice</p>
              </div>
              
              {success && (
                <div className="flex items-center gap-2 text-green-400">
                  <Icon icon="mdi:check-circle" width="24" />
                  <span className="font-medium">Saved!</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-gray-400 text-sm block mb-2">Preview Text</label>
              <textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder={`Hello! I'm ${editingVoice.display_name}. This is my voice preview...`}
                className="w-full bg-[#1a1f3a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-500 text-xs">Max 500 characters</p>
                <p className="text-gray-500 text-xs">{previewText.length}/500</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:alert" width="20" className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium mb-1">Important</p>
                  <p className="text-yellow-300/80">
                    This only updates the text in the database. To generate the actual audio preview, run:
                  </p>
                  <code className="block bg-black/30 px-3 py-2 rounded mt-2 text-xs text-yellow-300">
                    python generate_samples.py
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingVoice(null)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !previewText.trim() || success}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <Icon icon="mdi:check" width="18" />
                    Saved
                  </>
                ) : (
                  'Save Text'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="mdi:microphone-off" width="48" className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No voices found</p>
        </div>
      )}
    </div>
  );
}