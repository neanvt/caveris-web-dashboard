import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface VerificationRequest {
  candidateId: string;
  verifierId: string;
  capturedImageBase64?: string;
  fingerprintData?: string;
  fingerPosition?: string;
  irisData?: string;
  irisVector?: string;
  eyeName?: string;
  aadhaarNumber?: string;
  biometricData?: string;
  authType?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  persistResult?: boolean;
}

export interface VerificationResponse {
  success: boolean;
  result: string;
  confidenceScore: number;
  message: string;
  verificationId: string;
}

export interface BiometricBackfillResponse {
  success: boolean;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  message: string;
}

async function getAuthToken(): Promise<string | null> {
  // Primary token source for dashboard auth flow.
  if (typeof window !== "undefined") {
    const sessionToken = window.sessionStorage.getItem("access_token");
    if (sessionToken) {
      return sessionToken;
    }
  }

  // Fallback for paths that rely on Supabase session.
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

export async function verifyIris(
  request: VerificationRequest,
): Promise<VerificationResponse> {
  return apiRequest<VerificationResponse>("/api/verify/iris", {
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

export interface ComputeBiometricScoresResponse {
  success: boolean;
  fingerprintMatchScore: number | null;
  irisMatchScore: number | null;
  message: string;
}

export async function computeVerificationBiometricScores(
  verificationId: string,
): Promise<ComputeBiometricScoresResponse> {
  return apiRequest<ComputeBiometricScoresResponse>(
    `/api/verifications/${verificationId}/compute-biometric-scores`,
    { method: "POST" },
  );
}

export async function backfillBiometricScores(
  limit = 200,
): Promise<BiometricBackfillResponse> {
  return apiRequest<BiometricBackfillResponse>(
    "/api/verifications/backfill-biometric-scores",
    {
      method: "POST",
      body: JSON.stringify({ limit }),
    },
  );
}
