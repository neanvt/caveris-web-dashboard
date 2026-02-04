import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
}

/**
 * Login via .NET backend
 * Note: This is for .NET JWT auth. For Supabase auth, continue using Supabase client.
 */
export async function loginWithDotNetBackend(
  request: LoginRequest,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Refresh token via .NET backend
 */
export async function refreshDotNetToken(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  return apiRequest<RefreshTokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
