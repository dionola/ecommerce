import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  status?: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get fresh token from auth service (Amplify handles refresh automatically)
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    // Try once more with a fresh token (Amplify may have refreshed it)
    try {
      const freshToken = await getAuthToken();
      if (freshToken && freshToken !== token) {
        // Token was refreshed, retry the request
        headers['Authorization'] = `Bearer ${freshToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          if (retryResponse.status === 204) {
            return {} as T;
          }
          return retryResponse.json();
        }
      }
    } catch {
      // Refresh failed, user needs to re-login
    }

    // If retry failed, throw authentication error
    const error: ApiError = {
      message: 'Authentication failed. Please sign in again.',
      status: 401,
    };
    throw error;
  }

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

// Axios-like API wrapper for services that expect .get(), .post(), etc.
export const api = {
  get: <T>(endpoint: string): Promise<{ data: T }> => {
    return apiRequest<T>(endpoint, { method: 'GET' }).then(data => ({ data }));
  },
  post: <T>(endpoint: string, body?: any): Promise<{ data: T }> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }).then(data => ({ data }));
  },
  patch: <T>(endpoint: string, body?: any): Promise<{ data: T }> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }).then(data => ({ data }));
  },
  delete: <T>(endpoint: string): Promise<{ data: T }> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' }).then(data => ({ data }));
  },
  put: <T>(endpoint: string, body?: any): Promise<{ data: T }> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }).then(data => ({ data }));
  },
};

export default apiRequest;

