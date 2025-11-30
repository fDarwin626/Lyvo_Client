const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface SignUpData {
    email: string;
    password: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AutoResponse {
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



//signup api call
export async function signUp(data:SignUpData): Promise<AutoResponse> {
   const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
   });

  if (!response.ok) {
    const error = await response.json();
    
    // ✅ Handle Pydantic validation errors (array format)
    if (Array.isArray(error.detail)) {
      const errorMessage = error.detail[0].msg.replace('Value error, ', '');
      throw new Error(errorMessage);
    }
    
    // ✅ Handle regular string errors
    throw new Error(error.detail || 'Sign up failed');
  }
  
   return response.json();
}


// Sign In API Call
export async function signIn(data: SignInData): Promise<AutoResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    
    // ✅ Handle Pydantic validation errors (array format)
    if (Array.isArray(error.detail)) {
      const errorMessage = error.detail[0].msg.replace('Value error, ', '');
      throw new Error(errorMessage);
    }
    
    // ✅ Handle regular string errors
    throw new Error(error.detail || 'Sign in failed');
  }

  return response.json();
}


// Sign in with Google 
export async function googleSignIn(data:GoogleSignInData): Promise<AutoResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google-signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok){
    const error = await response.json();
    throw new Error(error.detail || 'Google sign-in failed');
  }
  return response.json();
}


// Store JWT token in browser localStorage
export function saveToken(token: string) {
    if(typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
    }
}

// Get token from localStorage
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

// Remove token (for logout)
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// ========== TTS API FUNCTIONS ==========
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

// Get all Voices
export async function getVoices(): Promise<Voices[]> {
  const response = await fetch(`${API_BASE_URL}/tts/voices`);

  if(!response.ok) {
    throw new Error('Failed to fetch voices');
  }
  return response.json();
}

// Get random voices (for dashboard)
export async function getRandomVoices(count: number = 7): Promise<Voices[]> {
  const allVoices = await getVoices();
  
  // Shuffle array
  const shuffled = [...allVoices].sort(() => Math.random() - 0.5);
  
  // Return first 'count' items
  return shuffled.slice(0, count);
}


// ========== AUDIOBOOK API FUNCTIONS ==========
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

// Generate audiobook
export async function generateAudiobook(data: AudiobookRequest): Promise<AudiobookJob> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tts/audiobook/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Handle Pydantic validation errors (array format)
    if (Array.isArray(error.detail)) {
      const errorMessage = error.detail[0].msg.replace('Value error, ', '');
      throw new Error(errorMessage);
    }
    
    // Handle regular string errors
    throw new Error(error.detail || 'Audiobook generation failed');
  }

  return response.json();
}

// Get user's audiobooks
export async function getUserAudiobooks(): Promise<AudiobookJob[]> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tts/audiobook/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch audiobooks');
  }

  return response.json();
}



export async function generateAudiobookFromFile(
  file: File,
  title: string,
  author: string | null,
  voiceId: string
): Promise<AudiobookJob> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('document', file);
  formData.append('title', title);
  formData.append('voice_id', voiceId);
  if (author) {
    formData.append('author', author);
  }

  const response = await fetch(`${API_BASE_URL}/tts/audiobook/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // DON'T set Content-Type - browser sets it automatically for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Audiobook generation failed');
  }

  return response.json();
}