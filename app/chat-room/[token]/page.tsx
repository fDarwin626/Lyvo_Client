'use client';
import { useCreditBalance } from '@/app/contexts/CreditContext';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Loader2, 
  Lock, AlertCircle, LogIn, 
  Users
} from 'lucide-react';
import { 
  validateShareToken, 
  shareChatText, 
  shareChatVoice,
  chatWithAgent,
  chatWithAgentVoice,
  getToken,
  isAuthenticated,
  getUserProfile,
  getAgent,
  getSessionStats,
  getSharedChatHistory,
  getConversationHistory,
  authenticateChatRoom,  
  ChatRoomAuthRequest,   
  ChatRoomAuthResponse,

} from '@/lib/api';
import { Icon } from '@iconify/react';

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
//  USE GLOBAL CONTEXT FOR OWNER, LOCAL STATE FOR SHARED USERS
const { 
  totalCredits,
  percentage: globalPercentage, 
  deductCredits, 
  refreshBalance 
} = useCreditBalance();

// Local state for shared users (to display owner's balance without modifying global context)
const [sharedOwnerBalance, setSharedOwnerBalance] = useState<number>(0);
const [sharedInitialBalance, setSharedInitialBalance] = useState<number>(1000);

// Computed values based on access type
const displayBalance = accessType === 'owner' ? totalCredits : sharedOwnerBalance;
const displayTotal = accessType === 'owner' ? totalCredits : sharedInitialBalance;
const displayPercentage = accessType === 'owner' ? globalPercentage : 
  (sharedInitialBalance > 0 ? (sharedOwnerBalance / sharedInitialBalance) * 100 : 0); 

  // Rate Limiting Display
  const [messagesThisHour, setMessagesThisHour] = useState<number>(0);
  const [maxMessagesPerHour] = useState<number>(20);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ==========  PERSISTENCE HELPERS ==========
  
const saveSessionToLocalStorage = (identifier: string, type: 'owner' | 'guest' | 'account') => {
    if (typeof window !== 'undefined') {
        // ✅ SECURITY: Key by the actual identifier (agent_id for owner, share_token for guests)
        const storageKey = type === 'owner' 
            ? `chatroom_owner_${identifier}`  // For owner: use agent_id
            : `chatroom_session_${params.token}`;  // For guests: use share token
        
        localStorage.setItem(storageKey, JSON.stringify({
            sessionToken: identifier,
            accessType: type,
            timestamp: Date.now()
        }));
        
        console.log(`💾 Saved session: type=${type}, key=${storageKey.substring(0, 30)}...`);
    }
};

const loadSessionFromLocalStorage = (): { sessionToken: string; accessType: 'owner' | 'guest' | 'account' } | null => {
    if (typeof window !== 'undefined') {
        // ✅ Try owner key first (if they own this agent)
        const ownerKey = `chatroom_owner_${params.token}`;
        let saved = localStorage.getItem(ownerKey);
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                console.log(`🔄 Loaded owner session: ${ownerKey.substring(0, 30)}...`);
                return parsed;
            } catch {
                localStorage.removeItem(ownerKey);
            }
        }
        
        // ✅ Try share token key
        const shareKey = `chatroom_session_${params.token}`;
        saved = localStorage.getItem(shareKey);
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                console.log(`🔄 Loaded share session: ${shareKey.substring(0, 30)}...`);
                return parsed;
            } catch {
                localStorage.removeItem(shareKey);
            }
        }
    }
    return null;
};

const clearSessionFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
        // Clear both possible keys
        localStorage.removeItem(`chatroom_owner_${params.token}`);
        localStorage.removeItem(`chatroom_session_${params.token}`);
      //  console.log(`🗑️ Cleared sessions for token ${params.token.substring(0, 20)}...`);
    }
};
  // ========== 🔒 SECURE UNIFIED AUTHENTICATION ==========
  
  useEffect(() => {
    initializeChatRoom();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 🔒 MAIN INITIALIZATION
   * Checks for saved session first, then authenticates fresh
   */
  const initializeChatRoom = async () => {
    setIsValidating(true);
    
    try {
      // Check for saved session in localStorage
      const savedSession = loadSessionFromLocalStorage();
      
      if (savedSession) {
        console.log('🔄 Found saved session, restoring...');
        
        try {
          await authenticateWithSavedSession(savedSession);
          return; // Successfully restored
        } catch (error) {
          console.log('⚠️ Saved session invalid, clearing...');
          clearSessionFromLocalStorage();
          // Continue to fresh authentication
        }
      }

      // No saved session or restoration failed - authenticate fresh
      await performAuthentication();
      
    } catch (error: any) {
      console.error('❌ Initialization error:', error);
      clearSessionFromLocalStorage();
      setValidationError(error.message || 'Access denied');
      setNeedsValidation(true);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * 🔒 PERFORM AUTHENTICATION
   * Calls backend's secure authentication endpoint
   * Backend handles ALL logic - frontend just displays results
   */
  const performAuthentication = async (credentials?: ChatRoomAuthRequest) => {
    try {
      // Call the API function we created in api.ts
      const data = await authenticateChatRoom(token, credentials);
      
      // ========== HANDLE RESPONSE ==========
      
      if (data.status === 'needs_credentials') {
        // Server says: show validation form
        setNeedsValidation(true);
        setAgentName(data.agent_name || '');
        
        // Determine what type of validation is needed
        if (data.credential_type === 'password_and_email') {
          console.log('📋 Password + email required');
        } else if (data.credential_type === 'login_required') {
          console.log('🔑 Login required');
        }
        
        return;
      }
      
     if (data.status === 'authenticated') {
    console.log(`✅ Authenticated as ${data.access_type}`);
    
    // ✅ SECURITY: Always use backend's agent_id, NEVER the URL token
    const verifiedAgentId = data.agent_id!;
    const verifiedAccessType = data.access_type!;
    
    setAccessType(verifiedAccessType);
    setAgentId(verifiedAgentId);  // This is the REAL agent ID from backend
    setAgentName(data.agent_name!);
    setSessionToken(data.session_token || null);
    setNeedsValidation(false);
    
    // ✅ CRITICAL: Log if URL token differs from backend agent_id (for debugging)
    if (verifiedAccessType === 'owner' && token !== verifiedAgentId) {
        console.warn('⚠️  URL token differs from backend agent_id');
       // console.warn(`   URL token: ${token.substring(0, 20)}...`);
       // console.warn(`   Backend agent_id: ${verifiedAgentId.substring(0, 20)}...`);
        //console.warn('   This is OK if owner opened a share link, but using backend agent_id for all operations');
    }
    
    // Save session with the VERIFIED agent_id (not URL token)
    if (verifiedAccessType === 'guest' && data.session_token) {
        saveSessionToLocalStorage(data.session_token, 'guest');
    } else if (verifiedAccessType === 'account' || verifiedAccessType === 'owner') {
        const userToken = getToken();
        if (userToken) {
            // ✅ For owner: Save the REAL agent_id
            saveSessionToLocalStorage(verifiedAgentId, verifiedAccessType);
        }
    }
    
    // Load appropriate data
    if (verifiedAccessType === 'owner') {
        await loadOwnerData(verifiedAgentId);  // Use verified ID
    } else {
        await loadSharedUserData(data.session_token || null);
    }
}
      
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  };

  /**
   * Restore session from saved credentials
   */
  const authenticateWithSavedSession = async (savedSession: {
    sessionToken: string;
    accessType: 'owner' | 'guest' | 'account';
  }) => {
    if (savedSession.accessType === 'guest') {
      // For guests, verify session is still valid by loading stats
      try {
        const stats = await getSessionStats(token, savedSession.sessionToken);
        
        // If we got here, session is valid
        setAccessType('guest');
        setSessionToken(savedSession.sessionToken);
        setNeedsValidation(false);
        
        await loadSharedUserData(savedSession.sessionToken);
        console.log('✅ Guest session restored');
      } catch (error) {
        throw new Error('Guest session expired');
      }
      
    } else {
      // For owner/account, re-authenticate with current JWT
      const userToken = getToken();
      if (!userToken) {
        throw new Error('No JWT token found');
      }
      
      // Call authenticate endpoint with current JWT
      await performAuthentication();
    }
  };

  //  LOAD SHARED USER DATA (history + stats)
  const loadSharedUserData = async (sessionToken: string | null) => {
    try {
      // Load chat history
      const history = await getSharedChatHistory(token, sessionToken || undefined);
      
      const formattedMessages: Message[] = history.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'agent',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(formattedMessages);
      setAgentName(history.agent_name);
      
      // Load stats
      const stats = await getSessionStats(token, sessionToken || undefined);
      setSharedOwnerBalance(stats.owner_balance);
      setMessagesThisHour(stats.messages_sent);
      
      // Calculate real initial balance
       setSharedInitialBalance(stats.owner_balance + stats.credits_used);
      
      console.log('✅ Loaded shared user data:', formattedMessages.length, 'messages');
      console.log('💰 Credits:', stats.owner_balance, '/', stats.owner_balance + stats.credits_used);
    } catch (error) {
      console.error('Failed to load shared user data:', error);
    }
  };

  //  LOAD OWNER DATA (history + balance)
  const loadOwnerData = async (agentId: string) => {
    try {
      // Load conversation history
      const history = await getConversationHistory(agentId);
      
      const formattedMessages: Message[] = history.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'agent',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(formattedMessages);
      
      // Load balance
      const profileData  = await getUserProfile();
      await refreshBalance();
      
      // Calculate real initial balance
      const totalCreditsUsed = history.messages
        .filter(msg => msg.role === 'assistant')
        .reduce((sum, msg) => sum + msg.credits_used, 0);
      
      
      console.log('✅ Loaded owner data:', formattedMessages.length, 'messages');
      console.log('💰 Credits:', profileData.total_credits, '/', profileData.total_credits + totalCreditsUsed);
    } catch (error) {
      console.error('Failed to load owner data:', error);
    }
  };


  const validateAsOwner = async (agentId: string, userToken: string) => {
    try {
      const profileData  = await getUserProfile();
      const agentData = await getAgent(agentId);
      
      setAccessType('owner');
      setAgentId(agentId);
      setAgentName(agentData.agent_name);
      setAgentCharacter(agentData.character_prompt);
      setNeedsValidation(false);
      
      //  SAVE SESSION
      saveSessionToLocalStorage(userToken, 'owner');
      
      //  LOAD OWNER DATA
      await loadOwnerData(agentId);
      
      console.log('✅ Owner access validated');
    } catch (error) {
      throw error;
    }
  };

  const validateAsShareToken = async (shareToken: string) => {
    setNeedsValidation(true);
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
      // Call unified authentication
      await performAuthentication({
        password,
        email,
        name: guestName || undefined
      });
      
      console.log('✅ Guest validation successful');
    } catch (error: any) {
      console.error('❌ Validation failed:', error);
      setValidationError(error.message || 'Invalid password or link expired');
    } finally {
      setIsValidating(false);
    }
  };


  const handleAccountLogin = () => {
    router.push(`/auth/signin?redirect=/chat-room/${token}`);
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
            // ✅ SECURITY: Owner always uses verified agentId (never URL token)
            console.log(`📤 [OWNER] Sending to agent ${agentId.substring(0, 20)}...`);
            
            response = await chatWithAgent(agentId, { 
                message: inputMessage,
                audio_enabled: voiceEnabled
            });
            deductCredits(response.credits_used);
            
        } else {
            // ✅ SECURITY: Shared users use URL token (share token) + session
            console.log(`📤 [SHARED] Sending via share token ${token.substring(0, 20)}...`);
            
            response = await shareChatText(
                token,  // Use URL token for shared access
                {
                    message: inputMessage,
                    audio_enabled: voiceEnabled
                },
                sessionToken || undefined
            );
            setSharedOwnerBalance(response.owner_balance); 
            setMessagesThisHour(prev => prev + 1);
        }

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
      } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      if (error.statusCode === 429) {
        alert('Rate limit exceeded! You can send 20 messages per hour. Please wait.');
      } else if (error.statusCode === 404 || error.statusCode === 403) {
        alert('Access denied. Link may be expired or revoked.');
        clearSessionFromLocalStorage();
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
    // ✅ SECURITY: Owner always uses verified agentId
    console.log(`🎙️ [OWNER] Sending voice to agent ${agentId.substring(0, 20)}...`);
    
    response = await chatWithAgentVoice(agentId, audioFile, voiceEnabled);
    deductCredits(response.credits_used);    
    } else {
        // ✅ SECURITY: Shared users use share token
        console.log(`🎙️ [SHARED] Sending voice via share token ${token.substring(0, 20)}...`);
        
        response = await shareChatVoice(token, audioFile, voiceEnabled, sessionToken || undefined);
        setSharedOwnerBalance(response.owner_balance);
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
      } else if (error.statusCode === 404 || error.statusCode === 403) {
        alert('Access denied. Link may be expired or revoked.');
        clearSessionFromLocalStorage();
        setNeedsValidation(true);
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
  
  
  // Calculate rate limit percentage for shared users (0-20 messages)
  const rateLimitPercentage = maxMessagesPerHour > 0
  ? Math.max(0, Math.min(100, ((maxMessagesPerHour - messagesThisHour) / maxMessagesPerHour) * 100))
  : 0;

  const circumference = 2 * Math.PI * 40;

  // ========== RENDER ==========

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

  return (  
    <div className="min-h-screen bg-[#101114] flex overflow-x-hidden">
      {/* Mobile Overlay - only shows when sidebar open on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen
        ${sidebarOpen ? 'w-64' : 'w-0'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        bg-[#0d0d0f] backdrop-blur-sm border-r border-slate-700
        overflow-hidden z-40
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">{agentName}</h2>
            <p className="text-sm text-slate-400">
              {accessType === 'owner' ? 'Your Agent' : 'Shared Agent'}
            </p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">YOUR CHATS</h3>
            {messages
              .filter(msg => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((msg, idx, arr) => idx === 0 || new Date(msg.timestamp).getTime() - new Date(arr[idx-1].timestamp).getTime() > 30 * 60 * 1000)
              .map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const msgElement = document.getElementById(`msg-${msg.id}`);
                    msgElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800 mb-2"
                >
                  <p className="text-sm text-white truncate">{msg.content.substring(0, 50)}...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {msg.timestamp.toLocaleDateString()} {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))
            }
          </div>

          <div className="mt-auto">
            <div className="border border-slate-700 flex flex-col items-center py-4 px-5 rounded-2xl bg-slate-900/60">
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
                    strokeWidth="3"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="40"
                    stroke="url(#creditGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      accessType === 'owner' 
                        ? circumference - (displayPercentage / 100) * circumference  
                        : circumference - (rateLimitPercentage / 100) * circumference
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-amiamie text-white">{accessType === 'owner' 
                ? `${Math.round(displayPercentage)}%`
                : `${Math.round(rateLimitPercentage)}%`
              }</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-slate-400 mb-1">
                  {accessType === 'owner' ? 'Credits Remaining' : 'Messages Available'}
                </p>
                <p className="text-semibold font-amiamie-round text-white">
                {accessType === 'owner' 
                  ? `${displayBalance.toLocaleString()} / ${displayTotal.toLocaleString()}`
                  : `${maxMessagesPerHour - messagesThisHour} / ${maxMessagesPerHour}`
                }
              </p>
              </div>
            </div>
              {accessType !== 'owner' && (
              <p className="text-xs text-slate-500 mt-1">Resets every hour</p>
            )}
            
          </div>

          {accessType !== 'owner' && (
            <div className="mt-4 bg-slate-800/50 rounded-lg p-4">
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
      </div>

      {/* Collapse Button */}
          <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          fixed top-6 w-8 h-8 
          flex items-center justify-center z-50
          transition-all duration-300
          ${sidebarOpen ? 'left-[210px]' : 'left-4'}
          ${sidebarOpen ? 'lg:left-[210px]' : 'lg:left-4'}
        `}
      >
        {sidebarOpen ? 
          <Icon icon="ic:sharp-menu-open" width="24" height="24" className="text-white hover:text-[#fdc10a] hover:scale-107" /> 
          : <Icon icon="heroicons:bars-3" width="20" height="20" className="text-white hover:text-[#fdc10a] hover:scale-107" />
        }
      </button>
      {/* Main Chat Area */}
      <div className={`
        flex flex-col transition-all duration-300
        w-full lg:w-auto lg:flex-1
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-10'}
      `}>
        {/* Header */}
        <div className="bg-transparent px-4 py-3 lg:p-4 flex items-center justify-between border-b border-slate-800/50 lg:border-0">
          <div className="ml-12 lg:ml-0 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{agentName}</h3>
            <p className="text-xs lg:text-sm text-slate-400 truncate">{agentCharacter || 'AI Assistant'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 lg:p-3 rounded-lg transition-colors ${
                voiceEnabled 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {accessType === 'owner' && (
               <button
                  onClick={() => router.push(`/agent/${agentId}/shared-users`)}
                  className="p-2 lg:p-4"
                  title="Manage shared users"
                >
                  <Icon icon="lets-icons:user-scan-light" width="24" height="24" 
                  className="lg:w-[34px] lg:h-[34px] text-gray-200 hover:text-[#fdc10a] hover:rotate-12 hover:scale-119" />
               </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-3 py-4 lg:p-6 ${sidebarOpen ? 'lg:ml-4' : ''}`}>
          <div className="max-w-9xl mx-auto space-y-3 lg:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                id={`msg-${message.id}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[45%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#232838] text-white'
                      : 'bg-[#1f2024] text-slate-100'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
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
        <div className="bg-[#101114] px-3 py-3 lg:p-4 border-t border-slate-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-3 rounded-full flex-shrink-0 transition-all ${
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
                  className="flex-1 min-w-0 bg-[#1f2024] border border-slate-700 rounded-xl px-4 py-3
                   text-sm text-white placeholder-slate-500 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                />
                <button
                  onClick={sendTextMessage}
                  disabled={!inputMessage.trim() || isProcessing || isRecording}
                  className="px-4 lg:px-6 py-3 bg-zinc-700 hover:bg-zinc-500
                   disabled:bg-[#1f2024] disabled:cursor-not-allowed
                    text-white rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
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