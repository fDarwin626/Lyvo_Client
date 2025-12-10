import { promises } from "dns";

// ========== CONFIG & TYPES ==========
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT = 500000; 

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    auth_provider: string;
    is_verified: boolean;
  };
}

export interface GoogleSignInData {
  token: string;
}

export interface Voices {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  gender: string | null;
  language: string;
  is_premium: boolean;
  sample_audio_url: string | null;
}

export interface AudiobookRequest {
  title: string;
  author?: string;
  voice_id: string;
}

export interface AudiobookJob {
  id: string;
  title: string;
  status: string;
  audio_url?: string;
  duration?: number;
  created_at: string;
}

export interface TTSHistory {
  id: string;
  text: string;
  voice_name: string;
  audio_url: string | null;
  duration: number | null;
  created_at: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface ClonedVoice {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  status: string;
  clones_remaining?: number;
  created_at?: string;
}


// ========== USER BALANCE ==========

export interface UserBalance {
  balance: number;
  email: string;
  is_admin: boolean;
}
// ========== SHARE SYSTEM INTERFACES ==========
export interface CreateShareLinkRequest {
  share_type: 'password' | 'account_required';
  password?: string; // required if shared_type is 'password'
  max_users?: number;
  expires_in_days?: number;
}


export interface ShareLinkResponse {
  id: string;
  share_token: string;
  shared_type: string;
  max_users: number 
  expires_at: string;
  created_at: string;
}

export interface ValidateShareRequest {
  password?: string;
  email?: string;
  name?: string;
}

export interface ShareAccessResponse {
  success: boolean;
  agent_id: string;
  agent_name: string;
  session_token?: string;
  message: string;
}

export interface ShareChatRequest {
  message: string;
  audio_enabled?: boolean;
}

export interface ShareChatResponse {
  message_id: string;
  agent_response: string;
  audio_url: string | null;
  credits_used: number;
  owner_balance: number; // ✅ Owner's remaining credits
  transcribed_text?: string; 

}

export interface ShareUsageStats {
  share_id: string;
  share_token: string;
  share_url: string;
  share_type: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  total_messages: number;
  total_credits_used: number;
  unique_users_count: number;
  last_used_at: string | null;
  recent_users: Array<{
    identifier: string;
    user_type: string;
    messages_sent: number;
    credits_used: number;
    last_active: string;
  }>;
}

export interface ShareListResponse {
  agent_id: string;
  agent_name: string;
  total_shares: number;
  active_shares: number;
  shares: ShareUsageStats[];
}


// ========== LYVO AGENT INTERFACES ==========
export interface CreateAgentRequest {
  agent_name: string;
  character_prompt: string;
  voice_id: string;
  language?: string; // default: "en"
  llm_choice?: string; 
}

export interface UpdateAgentRequest {
  agent_name?: string;
  character_prompt?: string;
  voice_id?: string;
  language?: string;
  llm_choice?: string;
}

export interface Agent {
  id: string;
  agent_name: string;
  character_prompt: string;
  voice_id: string;
  voice_name: string;
  language: string;
  llm_choice: string;
  total_messages: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
    message: string;
    audio_enabled?: boolean; // default: false
}

export interface ChatResponse {
  message_id: string;
  agent_response: string;
  audio_url: string | null;
  credits_used: number;
  user_balance: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audio_url: string | null;
  audio_enabled: boolean;
  credits_used: number;
  created_at: string;
}

export interface ConversationHistory {
  agent_id: string;
  agent_name: string;
  total_messages: number;
  messages: AgentMessage[];
}

export interface ConversationStats {
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  total_credits_used: number;
  audio_messages: number;
}

export interface ConversationExport {
  agent_name: string;
  character_prompt: string;
  total_messages: number;
  exported_at: string;
  conversation: Array<{
    role: string;
    content: string;
    audio_enabled: boolean;
    credits_used: number;
    timestamp: string;
  }>;
}


// ========== UNIFIED CHAT ROOM AUTHENTICATION INTERFACES ==========

export interface ChatRoomAuthRequest {
  password?: string;
  email?: string;
  name?: string;
}

export interface ChatRoomAuthResponse {
  status: 'authenticated' | 'needs_credentials';
  credential_type?: 'password_and_email' | 'login_required';
  access_type?: 'owner' | 'guest' | 'account';
  agent_id?: string;
  agent_name?: string;
  session_token?: string;
}

// ========== AGENT LIMITS INTERFACE ==========
export interface AgentLimits {
  agents_created: number;
  max_agents_allowed: number;
  can_create_more: boolean;
  is_admin: boolean;
}

// ========== VOICE CHAT (STT) INTERFACES ==========
export interface VoiceChatRequest {
   audio_file: File;
   audio_enabled: boolean;
}

export interface VoiceChatResponse {
  message_id: string;
  agent_response: string;
  audio_url: string | null;
  credits_used: number;
  user_balance: number;
  transcribed_text?: string; // The text that was recognized from voice
}


// ========== TOKEN MANAGEMENT (IMPROVED) ==========
const TOKEN_KEY = 'access_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export function saveToken(token: string, expiresInMinutes: number = 10080) { // 7 days default
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    
    // ✅ Store expiration time
    const expiryTime = Date.now() + (expiresInMinutes * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // ✅ Check if token is expired
    if (token && expiry) {
      if (Date.now() > parseInt(expiry)) {
        // Token expired - auto logout
        removeToken();
        return null;
      }
      return token;
    }
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null; // ✅ Now checks expiration
}

// ========== API ERROR HANDLING ==========
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ✅ Global 401 handler
function handleUnauthorized() {
  removeToken();
  
  // Redirect to login if not already there
  if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
    window.location.href = '/signin?expired=true';
  }
}

// ========== FETCH WITH TIMEOUT ==========
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout - please try again', 408);
    }
    throw error;
  }
}

// ========== ENHANCED API CALL WRAPPER ==========
async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Merge existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  // ✅ Add auth token if required
  if (requireAuth) {
    const token = getToken();
    if (!token) {
      throw new APIError('Authentication required - please sign in', 401);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
    
    // ✅ Handle different status codes
    if (response.status === 401) {
      handleUnauthorized();
      throw new APIError('Session expired - please sign in again', 401);
    }
    
    if (response.status === 403) {
      throw new APIError('Access denied - insufficient permissions', 403);
    }
    
    if (response.status === 429) {
      throw new APIError('Too many requests - please wait a moment', 429);
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // ✅ Handle Pydantic validation errors
      if (Array.isArray(error.detail)) {
        const errorMessage = error.detail[0].msg.replace('Value error, ', '');
        throw new APIError(errorMessage, response.status, error.detail);
      }
      
      throw new APIError(
        error.detail || 'Request failed',
        response.status,
        error
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network errors
    throw new APIError('Network error - please check your connection', 0);
  }
}

// ========== AUTH API FUNCTIONS ==========
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // ✅ Auto-save token
  saveToken(response.access_token);
  return response;
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  saveToken(response.access_token);
  return response;
}

export async function googleSignIn(data: GoogleSignInData): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>('/auth/google-signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  saveToken(response.access_token);
  return response;
}

// ========== TTS API FUNCTIONS ==========
export async function getVoices(): Promise<Voices[]> {
  return apiCall<Voices[]>('/tts/voices', {}, true);
}

export async function getRandomVoices(count: number = 7): Promise<Voices[]> {
  const allVoices = await getVoices();
  const shuffled = [...allVoices].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}



// ========== TTS GENERATION FUNCTIONS ==========
export interface GenerateRequest {
  text: string;
  voice_id: string;
}

export interface GenerateResponse {
  id: string;
  audio_url: string;
  duration: number;
  voice_name: string;
}

export async function generateSpeech(
  text: string,
  voiceId: string
): Promise<GenerateResponse> {
  return apiCall<GenerateResponse>('/tts/generate', {
    method: 'POST',
    body: JSON.stringify({
      text: text,
      voice_id: voiceId
    }),
  }, true);
}

export async function checkGenerationStatus(
  generationId: string
): Promise<GenerationStatus> {
  return apiCall<GenerationStatus>(`/tts/generation/${generationId}/status`, {}, true);
}

// Helper function to poll until generation is complete
export async function waitForGeneration(
  generationId: string,
  onProgress?: (status: string) => void,
  pollInterval: number = 3000,
  maxAttempts: number = 200 
): Promise<GenerationStatus> {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await checkGenerationStatus(generationId);
        
        if (onProgress) {
          onProgress(status.status);
        }
        
        if (status.status === 'completed') {
          clearInterval(interval);
          resolve(status);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          reject(new APIError('Generation failed', 500));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new APIError('Generation timeout - please try again', 408));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, pollInterval);
  });
}


// ========== AUDIOBOOK API FUNCTIONS ==========
export async function generateAudiobookFromFile(
  file: File,
  title: string,
  author: string | null,
  voiceId: string
): Promise<AudiobookJob> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const formData = new FormData();
  formData.append('document', file);
  formData.append('title', title);
  formData.append('voice_id', voiceId);
  if (author) {
    formData.append('author', author);
  }
  
  // ✅ Use direct fetch for FormData (Content-Type must be auto-set)
  const response = await fetchWithTimeout(`${API_BASE_URL}/tts/audiobook/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new APIError('Session expired', 401);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Audiobook generation failed', response.status);
  }
  
  return response.json();
}

export async function getUserAudiobooks(): Promise<AudiobookJob[]> {
  return apiCall<AudiobookJob[]>('/tts/audiobook/history', {}, true);
}

// ========== GET USER TTS HISTORY ==========
export async function getUserTTSHistory(): Promise<TTSHistory[]> {
  return apiCall<TTSHistory[]>('/tts/history', {}, true);
}

// ========== VOICE CLONING API FUNCTIONS ==========
export async function cloneVoice(
  audioFile: File,
  voiceName: string,
  description: string
): Promise<ClonedVoice> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('voice_name', voiceName);
  formData.append('description', description);
  
  const response = await fetchWithTimeout(`${API_BASE_URL}/tts/clone/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new APIError('Session expired', 401);
  }
  
  if (response.status === 429) {
    throw new APIError('Rate limit exceeded - please wait before trying again', 429);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Voice cloning failed', response.status);
  }
  
  return response.json();
}

export async function getMyClones(): Promise<ClonedVoice[]> {
  return apiCall<ClonedVoice[]>('/tts/clone/my-voices', {}, true);
}

export async function deleteClone(voiceId: string): Promise<void> {
  await apiCall<void>(`/tts/clone/${voiceId}`, {
    method: 'DELETE',
  }, true);
}


export interface GenerationStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  audio_url: string | null;
  duration: number | null;
  voice_name: string;
}

// ========== ADMIN INTERFACE ========
export interface AdminStats {
  total_users: number;
  active_users: number;
  total_voices: number;
  cloned_voices: number;
  total_generations: number;
  admin_actions_today: number;
}

export interface AdminUser {
  id: string;
  email: string;
  user_name: string | null;
  auth_provider: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  clones_created: number;
  created_at: string;
}

// ========== ADMIN API FUNCTIONS ==========
export async function getAdminStats(): Promise<AdminStats> {
  return apiCall<AdminStats>('/admin/stats', {}, true);
}

export async function getAllUsers(): Promise<AdminUser[]> {
  return apiCall<AdminUser[]>('/admin/users', {}, true);
}

export async function toggleUserStatus(userId: string): Promise<void> {
  await apiCall<void>(`/admin/users/${userId}/toggle-active`, {
    method: 'PATCH',
  }, true);
}

export async function deleteUser(userId: string): Promise<void> {
  await apiCall<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
  }, true);
}

export async function updateVoicePreviewText(
  voiceId: string,
  previewText: string
): Promise<void> {
  const formData = new FormData();
  formData.append('preview_text', previewText);
  
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/voices/${voiceId}/preview-text`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Update failed', response.status);
  }
}

export async function adminCloneVoice(
  audioFile: File,
  voiceName: string,
  displayName: string,
  description: string,
  gender: string | null,
  isPremium: boolean
): Promise<ClonedVoice> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('voice_name', voiceName);
  formData.append('display_name', displayName);
  formData.append('description', description);
  if (gender) formData.append('gender', gender);
  formData.append('is_premium', isPremium.toString());
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/tts/admin/clone/create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Voice cloning failed', response.status);
  }
  
  return response.json();
}

export async function getAdminVoices(): Promise<Voices[]> {
  return apiCall<Voices[]>('/tts/admin/voices', {}, true);
}

export async function deleteVoiceAdmin(voiceId: string): Promise<void> {
  await apiCall<void>(`/tts/admin/voice/${voiceId}`, {
    method: 'DELETE',
  }, true);
}

export async function updateVoiceDetails(
  voiceId: string,
  data: {
    display_name?: string;
    description?: string;
    gender?: string;
    is_premium?: boolean;
    is_active?: boolean;
  }
): Promise<void> {
  const formData = new FormData();
  
  if (data.display_name) formData.append('display_name', data.display_name);
  if (data.description) formData.append('description', data.description);
  if (data.gender) formData.append('gender', data.gender);
  if (data.is_premium !== undefined) formData.append('is_premium', data.is_premium.toString());
  if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString());
  
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/tts/admin/voice/${voiceId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Update failed', response.status);
  }
}




// ========== LYVO AGENT API FUNCTIONS ==========

/**
 * 🤖 Create a new Lyvo Agent
 */
export async function createAgent(data: CreateAgentRequest): Promise<Agent> {
  return apiCall<Agent>('/agent/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

/**
 * 🤖 Get all agents for current user
 */
export async function getMyAgents(): Promise<Agent[]> {
  return apiCall<Agent[]>('/agent/my-agents', {}, true);
}


/**
 * 📊 Get user's agent creation limits
 */
export async function getAgentLimits(): Promise<AgentLimits> {
  return apiCall<AgentLimits>('/agent/limits', {}, true);
}

/**
 * 🤖 Get single agent details
 */
export async function getAgent(agentId: string): Promise<Agent> {
  return apiCall<Agent>(`/agent/${agentId}`, {}, true);
}

/**
 * 🤖 Update agent details
 */
export async function updateAgent(
  agentId: string,
  data: UpdateAgentRequest
): Promise<Agent> {
  return apiCall<Agent>(`/agent/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, true);
}

/**
 * 🤖 Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await apiCall<void>(`/agent/${agentId}`, {
    method: 'DELETE',
  }, true);
}

/**
 * 💬 Send a message to an agent (chat)
 */
export async function chatWithAgent(
  agentId: string,
  data: ChatRequest
): Promise<ChatResponse> {
  return apiCall<ChatResponse>(`/agent/${agentId}/chat`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}


/**
 * 🎙️ Send VOICE message to agent (Speech-to-Text + Chat + Text-to-Speech)
 */
export async function chatWithAgentVoice(
  agentId: string,
  audioFile: File,
  audioEnabled: boolean = true
): Promise<VoiceChatResponse> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('audio_enabled', audioEnabled.toString());
  
  // ✅ Use direct fetch for FormData (Content-Type must be auto-set)
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/${agentId}/chat-audio`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new APIError('Session expired', 401);
  }
  
  if (response.status === 429) {
    throw new APIError('Rate limit exceeded - please slow down', 429);
  }
  
  if (response.status === 400) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail || 'Invalid audio file or speech recognition failed',
      400
    );
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail || 'Voice chat failed',
      response.status
    );
  }
  
  return response.json();
}


/**
 * 📜 Get conversation history for an agent
 */
export async function getConversationHistory(
  agentId: string,
  limit?: number
): Promise<ConversationHistory> {
  const query = limit ? `?limit=${limit}` : '';
  return apiCall<ConversationHistory>(`/agent/${agentId}/history${query}`, {}, true);
}

/**
 * 🗑️ Clear conversation history for an agent
 */
export async function clearConversationHistory(agentId: string): Promise<{
  success: boolean;
  message: string;
  agent_id: string;
  deleted_messages: number;
}> {
  return apiCall(`/agent/${agentId}/history`, {
    method: 'DELETE',
  }, true);
}

/**
 * 📊 Get conversation statistics
 */
export async function getConversationStats(
  agentId: string
): Promise<ConversationStats> {
  return apiCall<ConversationStats>(`/agent/${agentId}/stats`, {}, true);
}

/**
 * 📥 Export conversation (JSON or TXT)
 */
export async function exportConversation(
  agentId: string,
  format: 'json' | 'txt' = 'json'
): Promise<ConversationExport | { text: string }> {
  return apiCall(`/agent/${agentId}/export?format=${format}`, {}, true);
}

/**
 * 🎵 Get agent audio file URL (for playback)
 */
export function getAgentAudioUrl(filename: string): string {
  return `${API_BASE_URL}/agent/audio/${filename}`;
}


// ========== DELETE GENERATION FUNCTIONS ==========

/**
 * 🔒 Delete a TTS generation (user must own it)
 */
export  async function deleteGeneration(generationId:string): Promise<void> {
  await apiCall<void>(`/tts/generation/${generationId}`, {
    method: 'DELETE'
  }, true) // requires authentication
  
}

/**
 * 🔒 Delete an audiobook (user must own it)
 */
export async function deleteAudiobook(generationId: string): Promise<void> {
  await apiCall<void>(`/tts/audiobook/${generationId}`, {
    method: 'DELETE',
  }, true); // ✅ requireAuth = true
}


// ========== SHARE API FUNCTIONS ==========

/**
 * 🔗 Create shareable link for agent
 */
export async function createShareLink(
  agentId: string,
  data: CreateShareLinkRequest
): Promise<ShareLinkResponse> {
  return apiCall<ShareLinkResponse>(`/agent/${agentId}/share/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

/**
 * ✅ Validate share token and get access
 */
export async function validateShareToken(
  shareToken: string,
  data: ValidateShareRequest
): Promise<ShareAccessResponse> {
  return apiCall<ShareAccessResponse>(`/agent/share/${shareToken}/validate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, false); // ✅ No auth required (guest can validate)
}

/**
 * 💬 Send text message via share link
 */
export async function shareChatText(
  shareToken: string,
  data: ShareChatRequest,
  sessionToken?: string
): Promise<ShareChatResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // ✅ Add session token for guest users
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  const token = getToken(); // Logged-in user token (if any)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/share/${shareToken}/chat`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Chat failed', response.status);
  }
  
  return response.json();
}

/**
 * 🎙️ Send voice message via share link
 */
export async function shareChatVoice(
  shareToken: string,
  audioFile: File,
  audioEnabled: boolean = true,
  sessionToken?: string
): Promise<ShareChatResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('audio_enabled', audioEnabled.toString());
  
  const headers: Record<string, string> = {};
  
  // ✅ Add session token for guests
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/share/${shareToken}/chat-voice`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Voice chat failed', response.status);
  }
  
  return response.json();
}

/**
 * 📊 Get share usage stats (owner only)
 */
export async function getAgentShares(agentId: string): Promise<ShareListResponse> {
  return apiCall<ShareListResponse>(`/agent/${agentId}/shares`, {}, true);
}

/**
 * 🚫 Ban user from share (owner only)
 */
export async function banUserFromShare(
  shareId: string,
  identifier: string,
  reason?: string
): Promise<{ success: boolean; message: string; banned_identifier: string }> {
  return apiCall(`/agent/share/${shareId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ identifier, reason }),
  }, true);
}

/**
 * ❌ Revoke share link (owner only)
 */
export async function revokeShareLink(
  shareId: string
): Promise<{ success: boolean; message: string; affected_users: number }> {
  return apiCall(`/agent/share/${shareId}/revoke`, {
    method: 'DELETE',
  }, true);
}

/**
 * ♻️ Reactivate share link (owner only)
 */
export async function reactivateShareLink(
  shareId: string,
  extendDays: number = 3
): Promise<{ success: boolean; message: string; new_expiry: string }> {
  return apiCall(`/agent/share/${shareId}/reactivate`, {
    method: 'POST',
    body: JSON.stringify({ extend_days: extendDays }),
  }, true);
}


/**
 * 💰 Get user's current credit balance
 */
export async function getUserBalance(): Promise<UserBalance> {
  return apiCall<UserBalance>('/agent/user/balance', {}, true);
}


/**
 * Get shared chat history
 */
export async function getSharedChatHistory(
  shareToken: string,
  sessionToken?: string,
  limit: number = 50
): Promise<{
  agent_name: string;
  total_messages: number;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    audio_url: string | null;
    credits_used: number;
    created_at: string;
  }>;
}> {
  const headers: Record<string, string> = {};
  
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/share/${shareToken}/history?limit=${limit}`,
    { headers }
  );
  
  if (!response.ok) throw new APIError('Failed to load chat history', response.status);
  
  return response.json();
}

/**
 * Get session stats
 */
export async function getSessionStats(
  shareToken: string,
  sessionToken?: string
): Promise<{
  messages_sent: number;
  credits_used: number;
  owner_balance: number;
  max_messages_per_hour: number;
}> {
  const headers: Record<string, string> = {};
  
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/share/${shareToken}/session-stats`,
    { headers }
  );
  
  if (!response.ok) throw new APIError('Failed to load stats', response.status);
  
  return response.json();
}


/**
 * 🔒 UNIFIED CHAT ROOM AUTHENTICATION
 * Authenticates any chat room access (owner, guest, or account-required)
 * Server handles all logic - returns what client needs
 */
export async function authenticateChatRoom(
  token: string,
  credentials?: ChatRoomAuthRequest
): Promise<ChatRoomAuthResponse> {
  const userToken = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add JWT token if user is logged in
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/agent/chat-room/${token}/authenticate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials || {})
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Authentication failed', response.status);
  }
  
  return response.json();
}