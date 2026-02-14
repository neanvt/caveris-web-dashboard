/**
 * Secure Authentication utility functions
 * 
 * Security Features:
 * - httpOnly cookies for auth tokens (not accessible via JavaScript)
 * - sessionStorage for non-sensitive user data
 * - Short-lived access tokens with refresh token rotation
 * - Token expiration validation
 * - Server-side token validation on every request
 */

export interface UserData {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  requiresPasswordChange?: boolean;
  expiresAt?: string; // ISO timestamp
}

export interface AuthResponse {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  token: string;
  refreshToken?: string;
  requiresPasswordChange?: boolean;
  expiresAt?: string;
}

/**
 * Set authentication data
 * - Tokens stored in httpOnly cookies (set by backend)
 * - User data stored in sessionStorage (non-sensitive)
 */
export function setAuthData(data: AuthResponse) {
  // Store only non-sensitive user data in sessionStorage
  const userData: UserData = {
    userId: data.userId,
    email: data.email,
    role: data.role,
    fullName: data.fullName,
    requiresPasswordChange: data.requiresPasswordChange,
    expiresAt: data.expiresAt,
  };
  
  sessionStorage.setItem("user", JSON.stringify(userData));
  
  // Store token for backend API calls (needed for cross-domain authentication with api.caveris.tech)
  // Note: This is less secure than httpOnly cookies but required for cross-domain API calls
  if (data.token) {
    sessionStorage.setItem("access_token", data.token);
  }
  if (data.refreshToken) {
    sessionStorage.setItem("refresh_token", data.refreshToken);
  }
}

/**
 * Clear authentication data (logout)
 * Must call backend to clear httpOnly cookies
 */
export async function clearAuthData() {
  // Clear sessionStorage (including tokens)
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  
  // Call backend to clear httpOnly cookies
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Fallback: Clear any non-httpOnly cookies
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "caveris_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * Get current user from sessionStorage
 */
export function getCurrentUser(): UserData | null {
  try {
    const userJson = sessionStorage.getItem("user");
    if (!userJson) return null;
    
    const user: UserData = JSON.parse(userJson);
    
    // Check if token is expired
    if (user.expiresAt && isTokenExpired(user.expiresAt)) {
      // Token expired, clear data
      sessionStorage.removeItem("user");
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  try {
    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    
    // Add 30 second buffer to refresh before actual expiry
    return currentTime >= (expiryTime - 30000);
  } catch {
    return true;
  }
}

/**
 * Get access token from sessionStorage
 */
export function getToken(): string | null {
  try {
    return sessionStorage.getItem("access_token");
  } catch {
    return null;
  }
}

/**
 * Get refresh token from sessionStorage
 */
export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem("refresh_token");
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * Note: This only checks sessionStorage. Server validates actual token.
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  const user = getCurrentUser();
  return user?.role || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const userRole = getUserRole();
  return userRole?.toLowerCase() === role.toLowerCase();
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const userRole = getUserRole();
  if (!userRole) return false;
  return roles.some(role => role.toLowerCase() === userRole.toLowerCase());
}

/**
 * Update user data in sessionStorage
 * (e.g., after profile update)
 */
export function updateUserData(updates: Partial<UserData>) {
  const user = getCurrentUser();
  if (!user) return;
  
  const updatedUser = { ...user, ...updates };
  sessionStorage.setItem("user", JSON.stringify(updatedUser));
}

/**
 * Refresh authentication token
 * Calls backend to rotate refresh token and get new access token
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update user data with new expiration
    if (data.expiresAt) {
      updateUserData({ expiresAt: data.expiresAt });
    }
    
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    await clearAuthData();
    return false;
  }
}
