'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getAgent, chatWithAgent, chatWithAgentVoice, Agent } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCreditBalance } from '@/app/contexts/CreditContext';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params?.id as string;
  const { deductCredits } = useCreditBalance();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    console.log('Agent ID from params:', agentId);
    if (agentId && agentId !== 'undefined') {
      loadAgent();
    } else {
      setError('Invalid agent ID');
    }
  }, [agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAgent = async () => {
    try {
      setError(null);
      console.log('Loading agent:', agentId);
      const agentData = await getAgent(agentId);
      console.log('Agent loaded:', agentData);
      setAgent(agentData);
      
      setMessages([{
        id: '1',
        role: 'agent',
        content: `Hi! I'm ${agentData.agent_name}. How can I help you today?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error loading agent:', error);
      setError('Failed to load agent. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  //  Polling function for audio status
  const pollForAudio = async (statusUrl: string, maxAttempts = 300) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    console.log(' Starting audio polling for:', statusUrl);
    
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
          alert('Audio generation failed');
          return;
        }
        
        // Wait 2 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('❌ Error polling audio status:', error);
        return;
      }
    }
    
    console.warn('⚠️ Audio polling timeout after', maxAttempts, 'attempts');
    alert('Audio generation is taking longer than expected. Please try again.');
  };

  // ✅ UPDATED: Play audio with proper URL construction
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
      alert('Failed to play audio response');
    };
    
    audio.play().catch(err => {
      console.error('❌ Audio play failed:', err);
      alert('Could not play audio. Please check your browser permissions.');
    });
  };

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
      setMicEnabled(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMicEnabled(false);
    }
  };

  // ✅ UPDATED: Voice message with audio polling
  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!agent) return;

    setIsProcessing(true);

    try {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      const response = await chatWithAgentVoice(agentId, audioFile, voiceEnabled);

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

      // ✅ NEW: Poll for audio if voice is enabled
      if (voiceEnabled && response.audio_url) {
        // Check if it's a status URL or direct audio URL
        if (response.audio_url.includes('/audio-status')) {
          await pollForAudio(response.audio_url);
        } else {
          deductCredits(response.credits_used);

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

  //  Text message with audio polling
  const sendTextMessage = async () => {
    if (!inputMessage.trim() || !agent) return;

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
      const response = await chatWithAgent(agentId, {
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

      //  Poll for audio if voice is enabled
      if (voiceEnabled && response.audio_url) {
        // Check if it's a status URL or direct audio URL
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

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-slate-300">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show loading state
  if (!agent) {
    return (
      <ProtectedRoute>
        <div className="h-[600px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading agent...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flax lg:mb-4 mb-0 font-amiamie font-semibold text-4xl">
        <h1>Agent Chat Room:<span></span></h1>
      </div>
      <div className="lg:h-[670px]  h-fit border p-5 mb-50 bg-gradient-to-br from-gray-900
       via-slate-800 to-cyan-900 border-gray-400 rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-200 font-amiamie">{agent.agent_name}</h1>
              <p className="text-sm text-slate-400">{agent.character_prompt.slice(0, 100)}...</p>
            </div>
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
          </div>
        </div>

        {/* AI Avatar */}
        <div className="flex items-center justify-center py-3">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isSpeaking ? 'animate-pulse scale-110' : 'scale-100'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500
               rounded-full blur-2xl opacity-50"></div>
            </div>
            
            <div className={`relative lg:w-48 lg:h-48 w-30 h-30 rounded-full bg-gradient-to-br 
            from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ${
              isSpeaking 
                ? 'animate-[pulse_0.8s_ease-in-out_infinite] shadow-2xl shadow-blue-500/50' 
                : 'shadow-xl'
            }`}>
              <div className="absolute inset-4 flex items-center justify-center">
                {isSpeaking && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r
                     from-blue-500/20 to-purple-500/20 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-r
                     from-blue-500/30 to-purple-500/30 animate-pulse"></div>
                  </>
                )}
                
                <div className={`text-6xl transition-transform duration-300 ${
                  isSpeaking ? 'scale-110' : 'scale-100'
                }`}>
                  
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-slate-900 border border-slate-800 rounded-full text-sm">
              {isProcessing ? (
                <span className="text-yellow-400 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Standby...
                </span>
              ) : isSpeaking ? (
                <span className="text-blue-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  Speaking
                </span>
              ) : isRecording ? (
                <span className="text-red-400 flex items-center gap-2">
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
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-3 ${
                    message.role === 'user'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="text-sm md:text-base">{message.content}</p>
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
        <div className="backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex lg:items-center  items-center justify-center gap-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-3 rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : micEnabled
                    ? 'bg-blue-600 hover:bg-blue-700'
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

            <p className="text-xs text-slate-500 text-center mt-3">
              {voiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'} • 
              {isRecording ? ' Recording...' : ' Click mic to speak or type your message'}
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}