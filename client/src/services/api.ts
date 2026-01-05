const API_BASE_URL = 'http://localhost:3000';

export interface ApiError {
  message: string;
  status?: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Try to get token from localStorage first, then check current session
  let token = localStorage.getItem('authToken');
  
  // If no token in localStorage, try to get from current Cognito session
  if (!token) {
    try {
      const { getCurrentSession } = await import('./cognitoAuth');
      const session = await getCurrentSession();
      if (session) {
        token = session.idToken;
        localStorage.setItem('authToken', token);
      }
    } catch {
      // No valid session
    }
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };
    
    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
    } catch {
      // If response is not JSON, use default error message
    }
    
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export default apiRequest;

