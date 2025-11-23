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

