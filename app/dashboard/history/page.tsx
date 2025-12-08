"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, useEffect, useState } from "react";
import { getUserTTSHistory, getUserAudiobooks, getMyClones, 
    TTSHistory, AudiobookJob, ClonedVoice, deleteClone, 
    deleteAudiobook, deleteGeneration } from "@/lib/api";
import { Icon } from "@iconify/react";
import AudioPlayer from "@/components/AudioPlayer";

function HistoryPage() {
    // ========== STATE MANAGEMENT ==========
    const [ttsHistory, setTtsHistory] = useState<TTSHistory[]>([]);
    const [audiobooks, setAudiobooks] = useState<AudiobookJob[]>([]);
    const [clones, setClones] = useState<ClonedVoice[]>([]);
    
    const [loadingTTS, setLoadingTTS] = useState(true);
    const [loadingAudiobooks, setLoadingAudiobooks] = useState(true);
    const [loadingClones, setLoadingClones] = useState(true);

    // Audio Player State
    const [playingAudio, setPlayingAudio] = useState<{ url: string; name: string } | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);

    // ========== FETCH DATA ON MOUNT ==========
    useEffect(() => {
        fetchTTSHistory();
        fetchAudiobooks();
        fetchClones();
    }, []);

    async function fetchTTSHistory() {
        try {
            const data = await getUserTTSHistory();
            setTtsHistory(data);
        } catch (error) {
            console.error("Failed to load TTS history:", error);
        } finally {
            setLoadingTTS(false);
        }
    }

    async function fetchAudiobooks() {
        try {
            const data = await getUserAudiobooks();
            setAudiobooks(data);
        } catch (error) {
            console.error("Failed to load audiobooks:", error);
        } finally {
            setLoadingAudiobooks(false);
        }
    }

    async function fetchClones() {
        try {
            const data = await getMyClones();
            setClones(data);
        } catch (error) {
            console.error("Failed to load clones:", error);
        } finally {
            setLoadingClones(false);
        }
    }

    // ========== AUDIO PLAYER FUNCTIONS ==========
    const handlePlay = (audioUrl: string, name: string) => {
        setPlayingAudio({ url: audioUrl, name });
        setShowPlayer(true);
    };

    const handleClosePlayer = () => {
        setShowPlayer(false);
        setPlayingAudio(null);
    };

// ========== DELETE FUNCTIONS ==========

const handleDeleteTTS = async (id: string) => {
    if (!confirm("Delete this generation? This cannot be undone.")) {
        return;
    }
    
    try {
        await deleteGeneration(id);
        
        // ✅ Refresh the list to show updated data
        fetchTTSHistory();
        
        alert("Generation deleted successfully ✅");
    } catch (error: any) {
        console.error("Delete failed:", error);
        
        if (error.statusCode === 403) {
            alert("❌ You don't have permission to delete this");
        } else if (error.statusCode === 404) {
            alert("❌ Generation not found");
        } else {
            alert(error.message || "❌ Failed to delete generation");
        }
    }
};

const handleDeleteAudiobook = async (id: string) => {
    if (!confirm("Delete this audiobook? This cannot be undone.")) {
        return;
    }
    
    try {
        await deleteAudiobook(id);
        
        // ✅ Refresh the list to show updated data
        fetchAudiobooks();
        
        alert("Audiobook deleted successfully ✅");
    } catch (error: any) {
        console.error("Delete failed:", error);
        
        if (error.statusCode === 403) {
            alert("❌ You don't have permission to delete this audiobook");
        } else if (error.statusCode === 404) {
            alert("❌ Audiobook not found");
        } else {
            alert(error.message || "❌ Failed to delete audiobook");
        }
    }
};
    const handleDownload = (audioUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `http://127.0.0.1:8000${audioUrl}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

const handleDeleteClone = async (id: string) => {
    try {
        await deleteClone(id);
        // Refresh clones list
        fetchClones();
        alert("Voice clone deleted successfully");
    } catch (error: any) {
        alert(error.message || "Failed to delete clone");
    }
};


    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background pt-20 px-6 pb-24">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-amiamie font-bold mb-2">Your History</h1>
                        <p className="text-gray-600">All your generations in one place</p>
                    </div>

                {/* ========== SECTION 1: TEXT-TO-SPEECH HISTORY ========== */}
                <div className="mb-12">
                    <div className="flex font-amiamie items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Text-to-Speech</h2>
                        
                        {/* Navigation Arrows (only show if more than 6 items) */}
                        {ttsHistory.length > 6 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('tts-scroll-container');
                                        if (container) {
                                            container.scrollBy({ left: -1000, behavior: 'smooth' });
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-gray-300 border-2 border-gray-300 
                                    hover:border-gray-400 flex items-center justify-center transition-all"
                                >
                                    <Icon icon="mdi:chevron-left" width="24" height="24" />
                                </button>
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('tts-scroll-container');
                                        if (container) {
                                            container.scrollBy({ left: 1000, behavior: 'smooth' });
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 
                                    hover:border-gray-400 flex items-center justify-center transition-all"
                                >
                                    <Icon icon="mdi:chevron-right" width="24" height="24" />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {loadingTTS ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : ttsHistory.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                            <Icon icon="mdi:text-to-speech-off" width="64" height="64" className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 text-lg mb-4">No text-to-speech generated yet</p>
                            <a href="/dashboard/generate">
                                <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                                    Generate Your First TTS
                                </button>
                            </a>
                        </div>
                    ) : (
                        <div 
                            id="tts-scroll-container"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4"
                            style={{
                                gridAutoFlow: ttsHistory.length > 6 ? 'column' : 'row',
                                gridTemplateRows: ttsHistory.length > 6 ? 'repeat(2, 1fr)' : 'auto',
                                gridTemplateColumns: ttsHistory.length > 6 ? 'none' : 'repeat(3, 1fr)',
                            }}
                        >
                            {ttsHistory.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-background rounded-xl p-4 border border-gray-200 hover:border-gray-300 
                                    transition-all min-w-[320px]"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        {/* Circle Avatar - Clickable to Play */}
                                        <button
                                            onClick={() => item.audio_url && handlePlay(item.audio_url, item.voice_name)}
                                            disabled={!item.audio_url}
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#43C6AC] to-[#191654] 
                                            flex items-center justify-center text-white font-bold text-lg flex-shrink-0 
                                            uppercase hover:scale-105 font-amiamie transition-transform disabled:opacity-50
                                             disabled:cursor-not-allowed"
                                        >
                                            {item.voice_name.charAt(0)}
                                        </button>
                                        
                                        {/* Voice Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium font-amiamie-round text-gray-900 truncate">
                                                {item.voice_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                {item.text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-500">
                                                    {item.duration ? `${item.duration}s` : 'N/A'}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => item.audio_url && handleDownload(item.audio_url, `tts-${item.id}.wav`)}
                                            disabled={!item.audio_url}
                                            className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm 
                                            font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                                            flex items-center justify-center gap-2"
                                        >
                                            <Icon icon="mdi:download" width="16" height="16" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTTS(item.id)}
                                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg 
                                            text-sm font-medium transition-colors"
                                        >
                                            <Icon icon="mdi:delete" width="16" height="16" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                    {/* ========== SECTION 2: AUDIOBOOKS ========== */}
                    <div className="mb-12">
                        <h2 className="text-2xl  font-amiamie font-bold mb-4">Audiobooks</h2>
                        
                        {loadingAudiobooks ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : audiobooks.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                                <Icon icon="mdi:book-open-page-variant-outline" width="64" height="64" className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 text-lg mb-4">No audiobooks created yet</p>
                                <a href="/dashboard/audiobook">
                                    <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                                        Create Your First Audiobook
                                    </button>
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {audiobooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-300 
                                        transition-all shadow-sm hover:shadow-md group relative"
                                    >
                                        {/* Book Cover/Banner */}
                                        <div className="relative mb-4 h-32 bg-gradient-to-br from-slate-700 to-slate-500 
                                        rounded-lg flex items-center justify-center overflow-hidden">
                                            <Icon icon="simple-icons:audiobookshelf" width="60" height="60"  className="" />                                            
                                            {/* Status Badge */}
                                            {book.status === 'processing' && (
                                                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs 
                                                px-3 py-1 rounded-full font-semibold">
                                                    Processing...
                                                </div>
                                            )}
                                            {book.status === 'failed' && (
                                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs 
                                                px-3 py-1 rounded-full font-semibold">
                                                    Failed
                                                </div>
                                            )}
                                        </div>

                                        {/* Book Info */}
                                        <div className="mb-4">
                                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                                                {book.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Icon icon="arcticons:emoji-alarm-clock" width="18" height="18"/>
                                                <span>{book.duration ? `${Math.floor(book.duration / 60)}m` : 'N/A'}</span>
                                                <span className="text-gray-400">•</span>
                                                <span>{new Date(book.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Three-Dot Menu */}
                                        <div className="relative">
                                            <button className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg 
                                            text-sm font-medium transition-colors flex items-center justify-center gap-2 group/btn">
                                                <Icon icon="mdi:dots-horizontal" width="20" height="20" />
                                                <span>Options</span>
                                            </button>

                                            {/* Dropdown Menu */}
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 
                                            border-gray-200 rounded-lg shadow-lg py-2 opacity-0 invisible 
                                            group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                
                                                {/* Play Audiobook */}
                                                <button
                                                    onClick={() => book.audio_url && handlePlay(book.audio_url, book.title)}
                                                    disabled={book.status !== 'completed' || !book.audio_url}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 
                                                    flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Icon icon="mdi:play-circle" width="20" height="20" />
                                                    Play Audiobook
                                                </button>

                                                {/* Download */}
                                                <button
                                                    onClick={() => book.audio_url && handleDownload(book.audio_url, `${book.title}.wav`)}
                                                    disabled={book.status !== 'completed' || !book.audio_url}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 
                                                    flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Icon icon="mdi:download" width="20" height="20" />
                                                    Download
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteTTS(book.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 
                                                    flex items-center gap-2"
                                                >
                                                    <Icon icon="mdi:delete" width="20" height="20" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                {/* ========== SECTION 3: CLONED VOICES ========== */}
                <div className="mb-12">
                    {/* Banner at Top (like screenshot 3) */}
                    <div className="bg-gradient-to-r from-slate-700 via-blue-600 to-teal-600 rounded-2xl p-8 mb-6 
                    text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl  font-amiamie font-bold mb-2">Your Cloned Voices</h2>
                            <p className="text-white/90">
                                Personal voice clones you've created • {clones.length} / 5 clones used
                            </p>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                    </div>

                    {loadingClones ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 animate-pulse">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : clones.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                            <Icon icon="mdi:account-voice" width="64" height="64" className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 text-lg mb-4">No voices cloned yet</p>
                            <a href="/dashboard/clone">
                                <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                                    Clone Your First Voice
                                </button>
                            </a>
                        </div>
                    ) : (


                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clones.map((clone) => (
                                <div
                                    key={clone.id}
                                    className="bg-background
                                    transition-all  hover:shadow-md group"
                                >
                                    {/* Clone Avatar & Info */}
                                    <div className="flex items-start gap-3 mb-4">
                                        {/* Avatar Circle with First Letter */}
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-slate-800  to-indigo-600
                                        flex items-center font-amiamie justify-center text-white font-bold text-xl flex-shrink-0 uppercase">
                                            {clone.name.charAt(0)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg font-amiamie text-gray-900 truncate">
                                                {clone.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {clone.description || 'Custom cloned voice'}
                                            </p>
                                            {clone.created_at && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Created {new Date(clone.created_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Three-Dot Menu */}
                                    <div className="relative">
                                        <button className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg 
                                        text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                            <Icon icon="mdi:dots-horizontal" width="20" height="20" />
                                            <span>Options</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 
                                        border-gray-200 rounded-lg shadow-lg py-2 opacity-0 invisible 
                                        group-hover:opacity-100 group-hover:visible transition-all z-10">
                                            
                                            {/* Play Preview */}
                                            <button
                                                onClick={() => clone.preview_url && handlePlay(clone.preview_url, clone.name)}
                                                disabled={!clone.preview_url}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 
                                                flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Icon icon="mdi:play-circle" width="20" height="20" />
                                                Play Preview
                                            </button>

                                            {/* Use for TTS */}
                                            <a href={`/dashboard/generate?voice=${clone.id}`}>
                                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 
                                                flex items-center gap-2">
                                                    <Icon icon="mdi:text-to-speech" width="20" height="20" />
                                                    Use for TTS
                                                </button>
                                            </a>

                                            {/* Use for Audiobook */}
                                            <a href={`/dashboard/audiobook?voice=${clone.id}`}>
                                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 
                                                flex items-center gap-2">
                                                    <Icon icon="mdi:book-open-variant" width="20" height="20" />
                                                    Use for Audiobook
                                                </button>
                                            </a>

                                            {/* Delete */}
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete "${clone.name}"? This cannot be undone.`)) {
                                                        handleDeleteClone(clone.id);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 
                                                flex items-center gap-2"
                                            >
                                                <Icon icon="mdi:delete" width="20" height="20" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                </div>
            </div>
            

            {/* Audio Player (Bottom Floating) */}
            {showPlayer && playingAudio && (
                <AudioPlayer
                    audioUrl={playingAudio.url}
                    voiceName={playingAudio.name}
                    onClose={handleClosePlayer}
                />
            )}
        </ProtectedRoute>
    );
}

export default function UserHistoryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HistoryPage />
        </Suspense>
    );
}