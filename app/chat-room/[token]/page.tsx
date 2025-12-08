'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Loader2, 
  Lock, AlertCircle, LogIn 
} from 'lucide-react';
import { 
  validateShareToken, 
  shareChatText, 
  shareChatVoice,
  chatWithAgent,
  chatWithAgentVoice,
  getToken,
  isAuthenticated,
  getUserBalance,
  getAgent
} from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  // Authentication State
  const [accessType, setAccessType] = useState<'owner' | 'guest' | 'account' | null>(null);
  const [needsValidation, setNeedsValidation] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  
  // Agent Info
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>('');
  const [agentCharacter, setAgentCharacter] = useState<string>('');
  
  // Validation Form (for guests)
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Credits Display
  const [ownerBalance, setOwnerBalance] = useState<number>(0);
  const [initialBalance, setInitialBalance] = useState<number>(10000); // Will be fetched
  const [creditsUsedThisSession, setCreditsUsedThisSession] = useState<number>(0);
  
  // Rate Limiting Display
  const [messagesThisHour, setMessagesThisHour] = useState<number>(0);
  const [maxMessagesPerHour] = useState<number>(20);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ========== INITIALIZATION ==========
  
  useEffect(() => {
    initializeChatRoom();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatRoom = async () => {
    setIsValidating(true);
    
    try {
      // Check if user is already logged in (owner or account-required share)
      const userToken = getToken();
      
      if (userToken) {
        // Try as owner first (token is agent_id for owner)
        await validateAsOwner(token, userToken);
      } else {
        // Try as share token
        await validateAsShareToken(token);
      }
    } catch (error: any) {
      console.error('❌ Initialization error:', error);
      setValidationError(error.message || 'Invalid link');
      setNeedsValidation(true);
    } finally {
      setIsValidating(false);
    }
  };

const validateAsOwner = async (agentId: string, userToken: string) => {
  // Owner access - using their JWT token
  
  try {
    // ✅ Fetch user balance
    const balanceData = await getUserBalance();
    
    // ✅ Fetch agent info
    const agentData = await getAgent(agentId);
    
    setAccessType('owner');
    setAgentId(agentId);
    setAgentName(agentData.agent_name);
    setAgentCharacter(agentData.character_prompt);
    setNeedsValidation(false);
    
    // ✅ Set real balance
    setInitialBalance(balanceData.balance); // Use current as initial
    setOwnerBalance(balanceData.balance);
    
    // Add welcome message
    setMessages([{
      id: '1',
      role: 'agent',
      content: `Hi! I'm ${agentData.agent_name}. How can I assist you today?`,
      timestamp: new Date()
    }]);
    
    console.log('✅ Owner access validated');
    console.log(`💰 Balance: ${balanceData.balance} credits`);
  } catch (error) {
    throw error;
  }
};

  const validateAsShareToken = async (shareToken: string) => {
    // This is a share token - needs validation
    setNeedsValidation(true);
    
    // Store token for later use
    console.log('📋 Share token detected, needs validation');
  };

  // ========== GUEST VALIDATION ==========
  
  const handleGuestValidation = async () => {
    if (!password || !email) {
      setValidationError('Password and email are required');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await validateShareToken(token, {
        password,
        email,
        name: guestName || undefined
      });

      if (response.success) {
        setAccessType('guest');
        setAgentId(response.agent_id);
        setAgentName(response.agent_name);
        setSessionToken(response.session_token || null);
        setNeedsValidation(false);
        
        // Add welcome message
        setMessages([{
          id: '1',
          role: 'agent',
          content: `Hi${guestName ? ' ' + guestName : ''}! I'm ${response.agent_name}. How can I help you today?`,
          timestamp: new Date()
        }]);
        
        console.log('✅ Guest validation successful');
      }
    } catch (error: any) {
      console.error('❌ Validation failed:', error);
      setValidationError(error.message || 'Invalid password or link expired');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAccountLogin = () => {
    // Redirect to login with return URL
    router.push(`/signin?redirect=/chat-room/${token}`);
  };

  // ========== CHAT FUNCTIONS ==========
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendTextMessage = async () => {
    if (!inputMessage.trim() || !agentId) return;

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
      let response;
      
      if (accessType === 'owner') {
        // Owner chat
        response = await chatWithAgent(agentId, {
          message: inputMessage,
          audio_enabled: voiceEnabled
        });
        setOwnerBalance(response.user_balance);
      } else {
        // Shared user chat
        response = await shareChatText(
          token,
          {
            message: inputMessage,
            audio_enabled: voiceEnabled
          },
          sessionToken || undefined
        );
        setOwnerBalance(response.owner_balance);
        setMessagesThisHour(prev => prev + 1);
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
      setCreditsUsedThisSession(prev => prev + response.credits_used);

      if (voiceEnabled && response.audio_url) {
        if (response.audio_url.includes('/audio-status')) {
          await pollForAudio(response.audio_url);
        } else {
          playAudioResponse(response.audio_url);
        }
      }
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      if (error.statusCode === 429) {
        alert('Rate limit exceeded! You can send 20 messages per hour. Please wait.');
      } else if (error.statusCode === 404) {
        alert('This link is no longer valid. The owner may be out of credits or the link expired.');
        setNeedsValidation(true);
      } else {
        alert(error.message || 'Failed to send message');
      }
    } finally {
      setIsProcessing(false);
    }
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
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!agentId) return;

    setIsProcessing(true);

    try {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      let response;

      if (accessType === 'owner') {
        response = await chatWithAgentVoice(agentId, audioFile, voiceEnabled);
        setOwnerBalance(response.user_balance);
      } else {
        response = await shareChatVoice(token, audioFile, voiceEnabled, sessionToken || undefined);
        setOwnerBalance(response.owner_balance);
        setMessagesThisHour(prev => prev + 1);
      }

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
      setCreditsUsedThisSession(prev => prev + response.credits_used);

      if (voiceEnabled && response.audio_url) {
        if (response.audio_url.includes('/audio-status')) {
          await pollForAudio(response.audio_url);
        } else {
          playAudioResponse(response.audio_url);
        }
      }
    } catch (error: any) {
      console.error('❌ Voice message error:', error);
      
      if (error.statusCode === 429) {
        alert('Rate limit exceeded! Please wait.');
      } else if (error.statusCode === 404) {
        alert('Link no longer valid.');
      } else {
        alert(error.message || 'Failed to process voice message');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const pollForAudio = async (statusUrl: string, maxAttempts = 300) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const userToken = getToken();
        const headers: Record<string, string> = {};
        
        if (userToken) {
          headers['Authorization'] = `Bearer ${userToken}`;
        }
        if (sessionToken) {
          headers['X-Session-Token'] = sessionToken;
        }
        
        const response = await fetch(`${API_BASE}${statusUrl}`, { headers });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.status === 'completed' && data.audio_url) {
          playAudioResponse(data.audio_url);
          return;
        } else if (data.status === 'failed') {
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        return;
      }
    }
  };

  const playAudioResponse = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${API_BASE}${audioUrl}`;
    
    const audio = new Audio(fullAudioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    
    audio.play().catch(err => console.error('❌ Audio play failed:', err));
  };

  // ========== CREDIT CIRCLE CALCULATION ==========
  
  const creditPercentage = initialBalance > 0 
    ? Math.max(0, Math.min(100, (ownerBalance / initialBalance) * 100))
    : 0;
  
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (creditPercentage / 100) * circumference;

  // ========== RENDER ==========

  // Loading State
  if (isValidating && needsValidation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  // Guest Validation UI
  if (needsValidation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
            <p className="text-gray-600">Enter credentials to chat with this agent</p>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter share password"
                onKeyPress={(e) => e.key === 'Enter' && handleGuestValidation()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleGuestValidation}
              disabled={isValidating}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Access Chat'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleAccountLogin}
              className="w-full py-3 border-2 border-gray-300 hover:border-blue-500 text-gray-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="min-h-screen bg-[#101114] flex">
      {/* Sidebar - Credit Display */}
      <div className="w-64  bg-[#0d0d0f] backdrop-blur-sm border-r border-slate-700 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">{agentName}</h2>
          <p className="text-sm text-slate-400">
            {accessType === 'owner' ? 'Your Agent' : 'Shared Agent'}
          </p>
        </div>

        {/* Credit Circle */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <defs>
                <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <circle
                cx="64"
                cy="64"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="40"
                stroke="url(#creditGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(creditPercentage)}%</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400 mb-1">Credits Remaining</p>
            <p className="text-xl font-bold text-white">
              {ownerBalance.toLocaleString()} <span className="text-blue-400">/</span> {initialBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rate Limit (for shared users) */}
        {accessType !== 'owner' && (
          <div className="mt-8 bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">Rate Limit</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">
                {messagesThisHour} / {maxMessagesPerHour}
              </span>
              <span className="text-xs text-slate-500">per hour</span>
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${(messagesThisHour / maxMessagesPerHour) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-transparent p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{agentName}</h3>
            <p className="text-sm text-slate-400">{agentCharacter || 'AI Assistant'}</p>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-lg transition-colors ${
              voiceEnabled 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#232838] text-white'
                      : 'bg-[#1f2024] text-slate-100'
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
        <div className=" bg-[#101114] p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-3 rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-[#1f2024] hover:bg-slate-800'
                } disabled:opacity-50`}
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
                  className="flex-1 bg-[#1f2024] border border-slate-700 rounded-xl px-4 py-3
                   text-white placeholder-slate-500 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                />
                <button
                  onClick={sendTextMessage}
                  disabled={!inputMessage.trim() || isProcessing || isRecording}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-500
                   disabled:bg-[#1f2024] disabled:cursor-not-allowed
                    text-white rounded-xl transition-colors flex items-center gap-2"
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
              {isRecording ? ' Recording...' : isSpeaking ? ' Agent speaking...' : ' Ready to chat'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}