'use client';

import { useEffect, useState } from 'react';
import { getAdminVoices, deleteVoiceAdmin, updateVoiceDetails, Voices } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function VoicesManagement() {
  const [voices, setVoices] = useState<Voices[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVoice, setEditingVoice] = useState<Voices | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    description: '',
    gender: '',
    is_premium: false,
    is_active: true
  });

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

  const handleDelete = async (voiceId: string, voiceName: string) => {
    if (!confirm(`⚠️ DELETE VOICE\n\nDelete "${voiceName}"?\n\nThis CANNOT be undone!`)) return;
    
    try {
      await deleteVoiceAdmin(voiceId);
      await loadVoices();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const openEditModal = (voice: Voices) => {
    setEditingVoice(voice);
    setEditForm({
      display_name: voice.display_name || '',
      description: voice.description || '',
      gender: voice.gender || '',
      is_premium: voice.is_premium,
      is_active: true // Assuming active since it's in the list
    });
  };

  const handleUpdate = async () => {
    if (!editingVoice) return;
    
    try {
      await updateVoiceDetails(editingVoice.id, editForm);
      setEditingVoice(null);
      await loadVoices();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white font-amiamie">Voice Management</h1>
          <p className="text-gray-400 mt-1">Manage all voices and their settings</p>
        </div>
        
        <Link
          href="/admin/clone-voice"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <Icon icon="mdi:plus" width="20" />
          Clone New Voice
        </Link>
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
          <div key={voice.id} className="bg-[#0d1230] rounded-xl border border-gray-800/50 p-6 hover:border-purple-500/30 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">{voice.display_name || voice.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{voice.name}</p>
              </div>
              
              {voice.is_premium && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                  Premium
                </span>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {voice.description || 'No description'}
            </p>

            <div className="flex items-center gap-3 mb-4 text-sm">
              <span className="text-gray-500">
                {voice.gender ? `${voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}` : 'Unknown'}
              </span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-500">{voice.language}</span>
            </div>

            {/* Audio Preview */}
            {voice.sample_audio_url && (
              <audio controls className="w-full mb-4" style={{ height: '32px' }}>
                <source src={`http://127.0.0.1:8000${voice.sample_audio_url}`} type="audio/wav" />
              </audio>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(voice)}
                className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:pencil" width="18" />
                Edit
              </button>
              
              <button
                onClick={() => handleDelete(voice.id, voice.display_name || voice.name)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
              >
                <Icon icon="mdi:delete" width="18" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="mdi:microphone-off" width="48" className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No voices found</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingVoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1230] rounded-xl border border-gray-800 p-6 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">Edit Voice</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                  className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full bg-[#1a1f3a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="premium"
                  checked={editForm.is_premium}
                  onChange={(e) => setEditForm({...editForm, is_premium: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="premium" className="text-white">Premium Voice</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingVoice(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}