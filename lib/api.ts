import { promises } from "dns";


// ========== INPUT SANITIZATION ==========

/**
 * 🔒 SECURITY: Sanitize user input before sending to API
 * Prevents XSS and injection attacks on the frontend
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove any script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove any event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '');
}

/**
 * 🔒 SECURITY: Validate email format (more strict than backend)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 🔒 SECURITY: Validate password strength on frontend
 */
function validatePassword(password: string): { valid: boolean; error: string | null } {
  if (password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain number' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, error: 'Password must contain special character' };
  }
  
  return { valid: true, error: null };
};




// ========== CONFIG & TYPES ==========
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT = 500000; 

export function getAudioUrl(path: string): string {
  // ✅ Voice sample / generated-audio URLs now come back from the backend
  // as full Supabase Storage URLs (same migration as bug screenshots) —
  // only prepend API_BASE_URL for legacy relative paths, otherwise this
  // double-concatenates two full URLs into one broken string.
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

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
  credit_used: number;
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
  credit_used?: number;
}


// ========== USER BALANCE ==========
export interface UserProfile {
  id: string;
  email: string;
  user_name: string | null;
  auth_provider: string;
  is_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  
  // Tier info
  plan_tier: number;
  tier_name: string;
  free_credits: number;
  paid_credits: number;
  total_credits: number;
  
  // Limits
  max_agents: number;
  agents_used: number;
  max_clones: number;
  clones_used: number;
  
  // Premium access
  premium_unlocked: boolean;
  
  created_at: string;
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

// ========== SPEECH-TO-TEXT INTERFACES ==========
export interface TranscribeRequest {
  audio_file: File;
  language?: string;
}

export interface TranscribeResponse {
  id: string;
  text: string;
  method: "whisper" | "google";
  language: string;
  duration: number;
  original_filename: string;
  credits_used: number;
  user_balance: number;
  download_urls: {
    txt: string;
    pdf: string;
  };
  created_at: string;
}

export interface TranscriptionHistory {
  id: string;
  original_filename: string;
  text_preview: string;
  duration: number;
  language: string;
  method: string;
  credits_used: number;
  created_at: string;
  download_urls: {
    txt: string;
    pdf: string;
  };
}


//============ PAYMENT INSTERFACE ============
export interface InitializePaymentRequest{
  amount: number;
  currency: 'NGN' | 'USD'
}


export interface InitializePaymentResponse {
  success: boolean;
  payment_link: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  credits: number;
  message: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified: boolean;
  credits_added: number;
  new_balance: number;
  transaction_ref: string;
  amount: number;
  currency: string;
  payment_type: string | null;
  message: string;
}

export interface PaymentHistoryItem {
  id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  credits_purchased: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentHistoryResponse {
  total_payments: number;
  total_spent: number;
  total_credits_purchased: number;
  payments: PaymentHistoryItem[];
}


// ========== BUG REPORT INTERFACES ==========

/**
 * Single bug report data
 */
export interface BugReport {
  id: string;
  user_id: string;
  user_email: string;
  title: string;
  description: string;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  page_url: string | null;
  screenshot_url: string | null;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  hearts_count: number;
  user_has_hearted: boolean;
  comments_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

/**
 * Admin comment on bug
 */
export interface BugComment {
  id: string;
  admin_email: string;
  comment: string;
  created_at: string;
}

/**
 * Bug list with pagination
 */
export interface BugListResponse {
  bugs: BugReport[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Bug details with comments
 */
export interface BugDetailsResponse {
  bug: BugReport;
  comments: BugComment[];
}

/**
 * Submit bug request
 */
export interface SubmitBugRequest {
  title: string;
  description: string;
  browser?: string;
  os?: string;
  device_type?: string;
  page_url?: string;
  screenshot?: File;
}


// ========== NOTIFICATION INTERFACES ==========

/**
 * Single notification data
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  related_item_id: string | null;
  created_at: string;
  time_ago: string; // "2 hours ago", "3 days ago"
}

/**
 * List of notifications with pagination
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
}

/**
 * Unread count for sidebar badge
 */
export interface UnreadCountResponse {
  unread_count: number;
}


// ========== CHATBOT SUPPORT INTERFACES ==========

/**
 * Send message to support bot
 */
export interface ChatRequest {
  message: string;
  conversation_id?: string;  // Undefined = new conversation
}

/**
 * Bot's response
 */
export interface ChatResponse {
  type: 'answer' | 'escalate';
  message: string;
  conversation_id: string;
  message_id: string;
  ticket_id?: string;  // If escalated to human
  sentiment: {
    sentiment: string;
    urgency: string;
    should_escalate: boolean;
  };
  tools_used: string[];
  confidence: number;
}

/**
 * Single message in conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  message: string;
  bot_confidence?: number;
  source?: string;
  was_helpful?: boolean;
  created_at: string;
}

/**
 * Full conversation with messages
 */
export interface Conversation {
  id: string;
  status: string;
  user_sentiment: string;
  urgency: string;
  created_at: string;
  messages: ChatMessage[];
}

/**
 * Conversation list item (summary)
 */
export interface ConversationListItem {
  id: string;
  status: string;
  message_count: number;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
}

/**
 * Feedback on bot response
 */
export interface FeedbackRequest {
  message_id: string;
  was_helpful: boolean;
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
    window.location.href = '/auth/signin?expired=true';
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

    // ✅ SECURITY: Validate email
  if (!isValidEmail(data.email)) {
    throw new APIError('Invalid email', 400);
  }
  
  // ✅ SECURITY: Validate password strength
  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    throw new APIError(passwordCheck.error || 'Invalid password', 400);
  }
  
  // ✅ SECURITY: Sanitize email (remove any script tags)
  const sanitizedEmail = sanitizeInput(data.email).toLowerCase();

  const response = await apiCall<AuthResponse>('/auth/signup', {
    method: 'POST',
        body: JSON.stringify({
      email: sanitizedEmail, 
      password: data.password 
    }),

  });
  
  // ✅ Auto-save token
  saveToken(response.access_token);
  return response;
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
    // ✅ SECURITY: Validate email
  if (!isValidEmail(data.email)) {
    throw new APIError('Invalid email format', 400);
  }
  
  // ✅ SECURITY: Sanitize email
  const sanitizedEmail = sanitizeInput(data.email).toLowerCase();

  const response = await apiCall<AuthResponse>('/auth/signin', {
    method: 'POST',
        body: JSON.stringify({
      email: sanitizedEmail,  
      password: data.password
    }),

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
  credit_used: number;
}

export async function generateSpeech(
  text: string,
  voiceId: string
): Promise<GenerateResponse> {
    // ✅ SECURITY: Sanitize text input
  const sanitizedText = sanitizeInput(text);
  
  if (!sanitizedText.trim()) {
    throw new APIError('Text cannot be empty', 400);
  }

  return apiCall<GenerateResponse>('/tts/generate', {
    method: 'POST',
    body: JSON.stringify({
      text: sanitizedText,
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
  credit_used: number;
}

// ========== ADMIN INTERFACE ========
export interface AdminStats {
  total_users: number;
  active_users: number;
  total_voices: number;
  cloned_voices: number;
  total_generations: number;
  admin_actions_today: number;

  // Bugs stats
  total_bugs: number;
  new_bugs: number;
  in_progress_bugs: number;
  resolved_bugs: number;

  // Ticket stats
  total_tickets: number;
  open_tickets: number;
  high_priority_tickets: number;

  // Chatbot stats
  total_conversations: number;
  active_conversations: number;
  esclated_conversations: number;
  unknown_questions: number;
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


// ========== SUPPORT TICKET INTERFACES ==========

/**
 * Support ticket (private)
 */
export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;  // We'll add this to response
  subject: string;
  description: string;
  category: string;
  screenshot_url?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

/**
 * Ticket message (conversation)
 */
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_email: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

/**
 * Ticket with messages (full conversation)
 */
export interface TicketWithMessages {
  ticket: SupportTicket;
  messages: TicketMessage[];
}

/**
 * Ticket list response
 */
export interface TicketListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
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

    const sanitizedMessage = sanitizeInput(data.message);
  
  if (!sanitizedMessage.trim()) {
    throw new APIError('Message cannot be empty', 400);
  }

  return apiCall<ChatResponse>(`/agent/${agentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message: sanitizedMessage,
      audio_enabled: data.audio_enabled,
    }),
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
export async function getUserProfile(): Promise<UserProfile> {
  return apiCall<UserProfile>('/auth/me', {}, true);
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


// ========== SPEECH-TO-TEXT API FUNCTIONS ==========

/**
 * 🎙️ Transcribe audio file to text
 */
export async function transcribeAudio(
  audioFile: File,
  language: string = "en"
): Promise<TranscribeResponse> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('language', language);
  
  // ✅ Use direct fetch for FormData (Content-Type must be auto-set)
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/tts/transcribe`,
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
  
  if (response.status === 402) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.detail || 'Insufficient credits', 402);
  }
  
  if (response.status === 429) {
    throw new APIError('Rate limit exceeded - please wait before trying again', 429);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail || 'Transcription failed',
      response.status
    );
  }
  
  return response.json();
}

/**
 * 📥 Download transcription file
 */
export async function downloadTranscription(
  transcriptionId: string,
  format: 'txt' | 'pdf'
): Promise<Blob> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/tts/transcription/${transcriptionId}/download/${format}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new APIError('Session expired', 401);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail || 'Download failed',
      response.status
    );
  }
  
  return response.blob();
}

/**
 * 📜 Get transcription history
 */
export async function getTranscriptionHistory(
  limit: number = 50
): Promise<TranscriptionHistory[]> {
  return apiCall<TranscriptionHistory[]>(
    `/tts/transcriptions/history?limit=${limit}`,
    {},
    true
  );
}

/**
 * 🗑️ Delete a transcription
 */
export async function deleteTranscription(transcriptionId: string): Promise<void> {
  await apiCall<void>(`/tts/transcription/${transcriptionId}`, {
    method: 'DELETE',
  }, true);
}


// ========== PAYMENT API FUNCTIONS ==========

/**
 * 💳 Initialize payment (get Flutterwave payment link)
 */
export async function initializePayment(
  amount: number,
  currency: 'NGN' | 'USD'
): Promise<InitializePaymentResponse> {
  return apiCall<InitializePaymentResponse>('/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({ amount, currency }),
  }, true);
}

/**
 * ✅ Verify payment after user completes payment
 */
export async function verifyPayment(
  transactionId: number
): Promise<VerifyPaymentResponse> {
  return apiCall<VerifyPaymentResponse>(
    `/payments/verify/${transactionId}`,
    {},
    true
  );
}

/**
 * 📜 Get payment history
 */
export async function getPaymentHistory(): Promise<PaymentHistoryResponse> {
  return apiCall<PaymentHistoryResponse>('/payments/history', {}, true);
}

/**
 * 📜 Get ALL payments (admin only)
 */
export async function getAllPaymentsAdmin(): Promise<PaymentHistoryResponse> {
  return apiCall<PaymentHistoryResponse>('/payments/admin/all_payments', {}, true);
}

/**
 * 🧮 Calculate credits from amount
 * Client-side validation before sending to backend
 */
export function calculateCreditsFromAmount(
  amount: number,
  currency: 'NGN' | 'USD'
): {
  valid: boolean;
  credits: number;
  error: string | null;
} {
  const PRICE_PER_1000 = {
    USD: 103,      // $1.03 in cents
    NGN: 153730    // ₦1,537.30 in kobo
  };
  
  const priceUnit = PRICE_PER_1000[currency];
  
  // Check if exact multiple
  if (amount % priceUnit !== 0) {
    const symbol = currency === 'USD' ? '$' : '₦';
    const priceDisplay = (priceUnit / 100).toFixed(2);
    return {
      valid: false,
      credits: 0,
      error: `Amount must be exact multiple of ${symbol}${priceDisplay} (1000 credits)`
    };
  }
  
  // Calculate credits
  const multiplier = Math.floor(amount / priceUnit);
  const credits = multiplier * 1000;
  
  // Minimum check
  if (credits < 1000) {
    const symbol = currency === 'USD' ? '$' : '₦';
    const priceDisplay = (priceUnit / 100).toFixed(2);
    return {
      valid: false,
      credits: 0,
      error: `Minimum purchase: 1000 credits (${symbol}${priceDisplay})`
    };
  }
  
  return {
    valid: true,
    credits,
    error: null
  };
}

/**
 * 💰 Format amount for display
 */
export function formatAmount(amount: number, currency: 'NGN' | 'USD'): string {
  const value = amount / 100;
  
  if (currency === 'USD') {
    return `$${value.toFixed(2)}`;
  } else if (currency === 'NGN') {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `${currency} ${value.toFixed(2)}`;
}


// ========== BUG REPORT API FUNCTIONS ==========

/**
 * 🐛 Submit a new bug report
 * Can include optional screenshot
 */
export async function submitBugReport(
  data: SubmitBugRequest
): Promise<{ status: string; message: string; bug_id: string }> {
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
    // ✅ SECURITY: Sanitize all text inputs
  const sanitizedTitle = sanitizeInput(data.title);
  const sanitizedDescription = sanitizeInput(data.description);
  const sanitizedPageUrl = data.page_url ? sanitizeInput(data.page_url) : undefined;
  
  if (!sanitizedTitle.trim() || !sanitizedDescription.trim()) {
    throw new APIError('Title and description cannot be empty', 400);
  }

  
  // Build FormData (for screenshot upload)
  const formData = new FormData();
  formData.append('title', sanitizedTitle);
  formData.append('description', sanitizedDescription);
  
  // Add optional fields
  if (data.browser) formData.append('browser', data.browser);
  if (data.os) formData.append('os', data.os);
  if (data.device_type) formData.append('device_type', data.device_type);
  if (data.page_url) formData.append('page_url', sanitizedPageUrl!);
  if (data.screenshot) formData.append('screenshot', data.screenshot);
  
  // ✅ Use fetch directly, bypass fetchWithTimeout to avoid header pollution
  const response = await fetch(`${API_BASE_URL}/bugs/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // ❌ NO Content-Type header - let browser set it with boundary
    },
    body: formData,
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new APIError('Session expired', 401);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail || 'Failed to submit bug report',
      response.status
    );
  }
  
  return response.json();
}
/**
 * 📋 Get list of bug reports with filters
 */
export async function getBugReports(params?: {
  status_filter?: 'new' | 'in_progress' | 'resolved';
  priority_filter?: 'low' | 'medium' | 'high' | 'critical';
  sort_by?: 'created_at' | 'hearts_count' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}): Promise<BugListResponse> {
  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
  if (params?.priority_filter) queryParams.append('priority_filter', params.priority_filter);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
  
  const queryString = queryParams.toString();
  const url = queryString ? `/bugs/list?${queryString}` : '/bugs/list';
  
  return apiCall<BugListResponse>(url, {}, true);
}

/**
 * 🔍 Get single bug report with all admin comments
 */
export async function getBugDetails(bugId: string): Promise<BugDetailsResponse> {
  return apiCall<BugDetailsResponse>(`/bugs/${bugId}`, {}, true);
}

/**
 * ❤️ Toggle heart on a bug (heart if not hearted, unheart if already hearted)
 */
export async function toggleBugHeart(
  bugId: string
): Promise<{ status: string; action: string; hearts_count: number }> {
  return apiCall(`/bugs/${bugId}/heart`, {
    method: 'POST',
  }, true);
}

/**
 * 💬 Admin adds comment to bug (admin only)
 */
export async function addBugComment(
  bugId: string,
  comment: string
): Promise<{ status: string; message: string; comment_id: string }> {
  const formData = new FormData();
  formData.append('comment', comment);
  
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/bugs/${bugId}/comment`,
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
    throw new APIError(error.detail || 'Failed to add comment', response.status);
  }
  
  return response.json();
}

/**
 * 🔄 Admin updates bug status/priority (admin only)
 */
export async function updateBugStatus(
  bugId: string,
  newStatus: 'new' | 'in_progress' | 'resolved',
  newPriority?: 'low' | 'medium' | 'high' | 'critical'
): Promise<{ status: string; message: string; bug_id: string }> {
  const formData = new FormData();
  formData.append('new_status', newStatus);
  if (newPriority) formData.append('new_priority', newPriority);
  
  const token = getToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/bugs/${bugId}/status`,
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
    throw new APIError(error.detail || 'Failed to update bug', response.status);
  }
  
  return response.json();
}

/**
 * 🗑️ Admin archives (soft deletes) bug (admin only)
 */
export async function archiveBug(
  bugId: string
): Promise<{ status: string; message: string }> {
  return apiCall(`/bugs/${bugId}`, {
    method: 'DELETE',
  }, true);
}

/**
 * 🖼️ Get bug screenshot URL
 */
export function getBugScreenshotUrl(screenshotPath: string): string {
  // Backend now returns a complete Supabase Storage URL directly
  // (screenshots moved off local disk since HF Spaces wipes it on every
  // restart) — pass it straight through instead of prepending our API URL.
  return screenshotPath;
}
// ========== CHATBOT SUPPORT API FUNCTIONS ==========

/**
 * 💬 Send message to AI support bot
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
    const sanitizedMessage = sanitizeInput(message);
  
  if (!sanitizedMessage.trim()) {
    throw new APIError('Message cannot be empty', 400);
  }

  return apiCall<ChatResponse>('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      message: sanitizedMessage,
      conversation_id: conversationId
    })
  }, true);
}

/**
 * 📜 Get full conversation history
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation> {
  return apiCall<Conversation>(`/chat/conversation/${conversationId}`, {}, true);
}

/**
 * 📋 Get user's recent conversations
 */
export async function getMyConversations(
  limit: number = 20
): Promise<ConversationListItem[]> {
  return apiCall<ConversationListItem[]>(
    `/chat/my-conversations?limit=${limit}`,
    {},
    true
  );
}

/**
 * 👍👎 Submit feedback on bot response
 */
export async function submitChatFeedback(
  messageId: string,
  wasHelpful: boolean
): Promise<{ status: string; message: string }> {
  return apiCall('/chat/feedback', {
    method: 'POST',
    body: JSON.stringify({
      message_id: messageId,
      was_helpful: wasHelpful
    })
  }, true);
}


// ========== PASSWORD RESET API FUNCTIONS ==========

/**
 * 🔐 Request password reset OTP
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  return apiCall<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }, false); // ✅ No auth required
}

/**
 * ✅ Verify OTP and get reset token
 */
export async function verifyResetOTP(
  email: string,
  otp: string
): Promise<{ reset_token: string; message: string }> {
  return apiCall<{ reset_token: string; message: string }>(
    '/auth/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    },
    false // ✅ No auth required
  );
}

/**
 * 🔑 Reset password with token
 */
export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiCall<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: newPassword
    })
  }, false); // ✅ No auth required
}

// ========== ADMIN SUPPORT TICKET API FUNCTIONS ==========

/**
 * 🔒 Admin: Get all support tickets
 */
export async function adminGetTickets(params?: {
  status_filter?: string;
  category_filter?: string;
  priority_filter?: string;
  page?: number;
  page_size?: number;
}): Promise<TicketListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
  if (params?.category_filter) queryParams.append('category_filter', params.category_filter);
  if (params?.priority_filter) queryParams.append('priority_filter', params.priority_filter);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
  
  const queryString = queryParams.toString();
  const url = queryString ? `/support/admin/tickets?${queryString}` : '/support/admin/tickets';
  
  return apiCall<TicketListResponse>(url, {}, true);
}

/**
 * 🔒 Admin: Get single ticket with messages
 */
export async function adminGetTicketDetails(ticketId: string): Promise<TicketWithMessages> {
  return apiCall<TicketWithMessages>(`/support/admin/tickets/${ticketId}`, {}, true);
}

/**
 * 🔒 Admin: Reply to ticket
 */
export async function adminReplyToTicket(
  ticketId: string,
  message: string
): Promise<{ status: string; message: string; message_id: string }> {
  return apiCall(`/support/admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message })
  }, true);
}

/**
 * 🔒 Admin: Update ticket status
 */
export async function adminUpdateTicketStatus(
  ticketId: string,
  newStatus: string,
  newPriority?: string,
  adminNotes?: string
): Promise<{ status: string; message: string; ticket_id: string }> {
  return apiCall(`/support/admin/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      new_status: newStatus,
      new_priority: newPriority,
      admin_notes: adminNotes
    })
  }, true);
}

// ========== NOTIFICATION API FUNCTIONS ==========

/**
 * 🔔 Get user's notifications
 */
export async function getNotifications(
  page: number = 1,
  pageSize: number = 50
): Promise<NotificationListResponse> {
  return apiCall<NotificationListResponse>(
    `/notifications/?page=${page}&page_size=${pageSize}`,
    {},
    true
  );
}

/**
 * 🔔 Get unread notification count (for sidebar badge)
 */
export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  return apiCall<UnreadCountResponse>('/notifications/unread-count', {}, true);
}

/**
 * ✅ Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ message: string }> {
  return apiCall<{ message: string }>(
    `/notifications/${notificationId}/mark-read`,
    { method: 'PATCH' },
    true
  );
}

/**
 * 🗑️ Delete notification (must be read first)
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ message: string }> {
  return apiCall<{ message: string }>(
    `/notifications/${notificationId}`,
    { method: 'DELETE' },
    true
  );
}

/**
 * ✅ Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiCall<{ message: string }>(
    '/notifications/mark-all-read',
    { method: 'POST' },
    true
  );
}