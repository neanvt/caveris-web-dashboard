/**
 * Centralized API client for CAVERIS .NET Backend
 * All API calls go through the .NET backend at localhost:5000
 */

export * from "./verification-api";
export * from "./auth-api";

// Re-export commonly used types
export type {
  VerificationRequest,
  VerificationResponse,
} from "./verification-api";

export type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
} from "./auth-api";
