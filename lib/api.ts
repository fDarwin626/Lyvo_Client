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

export interface ClonedVoice {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  status: string;
  clones_remaining?: number;
  created_at?: string;
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
