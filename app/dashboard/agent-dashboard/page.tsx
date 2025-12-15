'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getMyAgents, 
  getAgent, 
  chatWithAgent, 
  chatWithAgentVoice,
  deleteAgent,
  Agent 
} from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, MoreVertical, MessageSquare, Link2, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import CreateShareModal from '@/components/CreateShareModal';
import { useCreditBalance } from '@/app/contexts/CreditContext';


interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function AgentsPage() {
  // ========== STATE MANAGEMENT ==========
  
  // Agents list
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const { deductCredits } = useCreditBalance();

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedAgentForShare, setSelectedAgentForShare] = useState<Agent | null>(null);
 
  // Selected agent for chat
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Chat state
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // UI state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ========== LOAD AGENTS ON MOUNT ==========
  useEffect(() => {
    loadAgents();
  }, []);

  // ========== AUTO-SCROLL MESSAGES ==========
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAgents = async () => {
    try {
      setLoadingAgents(true);
      const agentsData = await getMyAgents();
      setAgents(agentsData);
      console.log('✅ Loaded agents:', agentsData.length);
    } catch (error) {
      console.error('❌ Error loading agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  
// ========== SECTION 2: CHAT HELPER FUNCTIONS ==========

  // Audio polling for background generation
  const pollForAudio = async (statusUrl: string, maxAttempts = 300) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    console.log('🔄 Starting audio polling for:', statusUrl);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}${statusUrl}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error('❌ Status check failed:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log(`📊 Audio status (attempt ${i + 1}):`, data.status);
        
        if (data.status === 'completed' && data.audio_url) {
          console.log('✅ Audio ready, playing:', data.audio_url);
          playAudioResponse(data.audio_url);
          return;
        } else if (data.status === 'failed') {
          console.error('❌ Audio generation failed');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('❌ Error polling audio status:', error);
        return;
      }
    }
    
    console.warn('⚠️ Audio polling timeout');
  };

  // Play audio response
  const playAudioResponse = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const fullAudioUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${API_BASE}${audioUrl}`;
    
    console.log('🔊 Playing audio from:', fullAudioUrl);
    
    const audio = new Audio(fullAudioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => {
      console.log('▶️ Audio playing');
      setIsSpeaking(true);
    };
    
    audio.onended = () => {
      console.log('⏹️ Audio ended');
      setIsSpeaking(false);
    };
    
    audio.onerror = (e) => {
      console.error('❌ Audio playback error:', e);
      setIsSpeaking(false);
    };
    
    audio.play().catch(err => {
      console.error('❌ Audio play failed:', err);
    });
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedAgent) return;

    setIsProcessing(true);

    try {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      const response = await chatWithAgentVoice(selectedAgent.id, audioFile, voiceEnabled);
      deductCredits(response.credits_used);
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: response.transcribed_text || 'Voice message',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);

      if (voiceEnabled && response.audio_url) {
        if (response.audio_url.includes('/audio-status')) {
          await pollForAudio(response.audio_url);
        } else {
          playAudioResponse(response.audio_url);
        }
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to process voice message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Send text message
  const sendTextMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const response = await chatWithAgent(selectedAgent.id, {
        message: inputMessage,
        audio_enabled: voiceEnabled
      });
      deductCredits(response.credits_used);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);

      if (voiceEnabled && response.audio_url) {
        if (response.audio_url.includes('/audio-status')) {
          await pollForAudio(response.audio_url);
        } else {
          playAudioResponse(response.audio_url);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle agent selection (load chat)
  const handleSelectAgent = async (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([{
      id: '1',
      role: 'agent',
      content: `Hi! I'm ${agent.agent_name}. How can I help you today?`,
      timestamp: new Date()
    }]);
    
    // TODO: Load actual conversation history from backend
    console.log('✅ Selected agent:', agent.agent_name);
  };

  // Handle delete agent
  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteAgent(agentId);
      
      // If deleted agent was selected, clear selection
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
        setMessages([]);
      }
      
      // Reload agents list
      await loadAgents();
      
      setShowDeleteConfirm(null);
      console.log('✅ Agent deleted');
    } catch (error) {
      console.error('❌ Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    }
  };

// Handle create shareable link
const handleCreateShareLink = (agent: Agent) => {
  setSelectedAgentForShare(agent);
  setShareModalOpen(true);
  setOpenDropdown(null);
};

return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-6">
        <h1 className="text-4xl font-amiamie font-semibold mb-3 text-primary">
          My AI Agents:
        </h1>

        {/* ========== SECTION 3A: CHAT DIV (Conditional) ========== */}
        {selectedAgent ? (
          <div className="mb-8 border border-gray-400 bg-gradient-to-br from-gray-900 via-slate-800 to-cyan-900 rounded-3xl p-5 h-[670px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="backdrop-blur-sm mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-200 font-amiamie">
                    {selectedAgent.agent_name}
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-1">
                    {selectedAgent.character_prompt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      voiceEnabled 
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Close Chat
                  </button>
                </div>
              </div>
            </div>

            {/* AI Avatar */}
            <div className="flex items-center justify-center py-3">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isSpeaking ? 'animate-pulse scale-110' : 'scale-100'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-50"></div>
                </div>
                
                <div className={`relative w-35 h-35 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ${
                  isSpeaking 
                    ? 'animate-[pulse_0.8s_ease-in-out_infinite] shadow-2xl shadow-blue-500/50' 
                    : 'shadow-xl'
                }`}>
                  <div className="absolute inset-4 flex items-center justify-center">
                    {isSpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping"></div>
                        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse"></div>
                      </>
                    )}
                    <div className={`text-4xl transition-transform duration-300 ${
                      isSpeaking ? 'scale-110' : 'scale-100'
                    }`}>
                      {/*......*/}
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs">
                  {isProcessing ? (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Thinking...
                    </span>
                  ) : isSpeaking ? (
                    <span className="text-blue-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Speaking
                    </span>
                  ) : isRecording ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      Listening
                    </span>
                  ) : (
                    <span className="text-slate-400">Ready</span>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="backdrop-blur-sm pt-4 border-t border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`p-3 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
                </button>

                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                    placeholder="Type your message..."
                    disabled={isProcessing || isRecording}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendTextMessage}
                    disabled={!inputMessage.trim() || isProcessing || isRecording}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center mt-2">
                {voiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'} • 
                {isRecording ? ' Recording...' : ' Click mic to speak or type your message'}
              </p>
            </div>
          </div>
        ) : (
          /* Inactive State */
          <div className="mb-8 border border-gray-300 bg-gray-100 rounded-3xl p-8 h-[400px] flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className=" flex items-center justify-center">
                <div className="text-5xl"><Icon icon="material-icon-theme:android" width="62" height="62" /></div>
              </div>
            </div>
            <h3 className="text-xl font-amiamie text-slate-600 mb-2">
              Select an agent below to start chatting
            </h3>
            <p className="text-sm text-slate-500">
              Choose from your created agents or create a new one
            </p>
          </div>
        )}

        {/* ========== SECTION 3B: AGENTS DASHBOARD ========== */}
        <div className="bg-white rounded-2xl border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-amiamie text-primary">Your Agents</h2>
            <button
              onClick={() => window.location.href = 'create_agent'}
              className="px-4 py-2 bg-gradient-to-r from-[#43C6AC] to-[#191654] hover:from-[#191654] hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              + Create New Agent
            </button>
          </div>

          {loadingAgents ? (
            /* Loading State */
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-slate-600">Loading your agents...</span>
            </div>
          ) : agents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <div className="text-5xl opacity-50"><Icon icon="duo-icons:android" width="54" height="54" /></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No agents created yet
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first AI agent to get started
              </p>
            </div>
          ) : (
            /* Agents Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-gray-50  rounded-xl p-4 hover:shadow-lg transition-all relative group"
                >
                  {/* Agent Avatar */}
                  <div className="flex justify-center mb-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900
                     flex items-center justify-center shadow-lg">
                      <div className="text-3xl"><Icon icon="logos:cardano-icon" width="56" height="56" /></div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="text-center mb-3">
                    <h3 className="font-amiamie text-lg text-primary font-semibold mb-1">
                      {agent.agent_name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      Voice: {agent.voice_name}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {agent.character_prompt}
                    </p>
                  </div>

                  {/* 3-Dot Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === agent.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                        <button
                          onClick={() => {
                            handleSelectAgent(agent);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-slate-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          Chat with Agent
                        </button>
                        <button
                        onClick={() => handleCreateShareLink(agent)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-slate-700 transition-colors border-t border-gray-100"
                      >
                        <Link2 className="w-4 h-4 text-green-500" />
                        Create Share Link
                      </button>
                        <button
                          onClick={() => setShowDeleteConfirm(agent.id)}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 transition-colors border-t border-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Agent
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200 text-xs text-slate-500">
                    <span>{agent.total_messages} messages</span>
                    <span>•</span>
                    <span>{agent.language.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Delete Agent?
              </h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this agent? All conversation history will be lost. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAgent(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    {/* Create Share Link Modal */}
    {shareModalOpen && selectedAgentForShare && (
      <CreateShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedAgentForShare(null);
        }}
        agentId={selectedAgentForShare.id}
        agentName={selectedAgentForShare.agent_name}
      />
    )}      
    </ProtectedRoute>
  );
}