import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface VerificationRequest {
  candidateId: string;
  verifierId: string;
  capturedImageBase64?: string;
  fingerprintData?: string;
  fingerPosition?: string;
  aadhaarNumber?: string;
  biometricData?: string;
  authType?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
}

export interface VerificationResponse {
  success: boolean;
  result: string;
  confidenceScore: number;
  message: string;
  verificationId: string;
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

export async function verifyFace(
  request: VerificationRequest,
): Promise<VerificationResponse> {
  return apiRequest<VerificationResponse>("/api/verify/face", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function verifyFingerprint(
  request: VerificationRequest,
): Promise<VerificationResponse> {
  return apiRequest<VerificationResponse>("/api/verify/fingerprint", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function verifyAadhaar(
  request: VerificationRequest,
): Promise<VerificationResponse> {
  return apiRequest<VerificationResponse>("/api/verify/aadhaar", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function healthCheck(): Promise<{
  status: string;
  timestamp: string;
  version: string;
}> {
  return apiRequest<{ status: string; timestamp: string; version: string }>(
    "/health",
  );
}
