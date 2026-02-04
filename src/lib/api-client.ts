/**
 * Secure API client utility with httpOnly cookie authentication
 * 
 * Security Features:
 * - Uses httpOnly cookies for authentication (set by backend)
 * - Automatic token refresh on 401 errors
 * - Credentials included in all requests
 * - Server-side token validation
 */

import { refreshAuthToken, clearAuthData, isAuthenticated } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

/**
 * Make an authenticated API request
 * Tokens are sent via httpOnly cookies automatically
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, headers = {}, ...restOptions } = options;

  // Check if user is authenticated (client-side check)
  if (!skipAuth && !isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Build URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Make the request with credentials to include httpOnly cookies
  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: 'include', // IMPORTANT: Include httpOnly cookies
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      // Try to refresh the token
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Retry the original request with new token (in cookie)
        response = await fetch(url, {
          ...restOptions,
          headers: requestHeaders,
          credentials: 'include',
        });
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } catch (error) {
      // Refresh failed, clear auth and redirect
      await clearAuthData();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
  }

  // Return JSON response
  return response.json();
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
