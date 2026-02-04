# Frontend-Backend Integration Guide

## Architecture Overview

**All API requests now flow through the .NET backend on port 5000/5001.**

```
Next.js Frontend (port 3000)
    ↓
.NET Web API (port 5000/5001)
    ↓
PostgreSQL Database (Supabase)
```

## Environment Setup

### 1. Configure Environment Variables

Create `.env.local` in the `caveris-web-dashboard` directory:

```bash
# .NET Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_HTTPS_URL=https://localhost:5001

# Supabase (for authentication only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Start Services

```bash
# Terminal 1: Start .NET Backend
cd caveris-api/Caveris.Api
dotnet watch

# Terminal 2: Start Next.js Frontend
cd caveris-web-dashboard
npm run dev
```

## API Client Usage

### Import the API Client

```typescript
import {
  verifyFace,
  verifyFingerprint,
  verifyAadhaar,
  healthCheck,
} from "@/lib/api";
```

### Example: Face Verification

```typescript
'use client';

import { verifyFace } from '@/lib/api';
import { useState } from 'react';

export default function VerificationPage() {
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    try {
      const response = await verifyFace({
        candidateId: 'candidate-uuid',
        verifierId: 'verifier-uuid',
        capturedImageBase64: 'base64-encoded-image',
        latitude: 28.7041,
        longitude: 77.1025,
        deviceId: 'device-123'
      });

      setResult(response);
      console.log('Verification successful:', response);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleVerify}>Verify Face</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## Authentication Flow

### Option 1: Supabase Auth (Recommended)

Continue using Supabase for authentication. The API client automatically includes the Supabase JWT token in all requests to the .NET backend.

```typescript
import { createClient } from '@/lib/supabase/client';

// Login with Supabase
const supabase = createClient();
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// API calls will automatically include the JWT
const result = await verifyFace({ ... });
```

### Option 2: .NET Backend Auth (Alternative)

If you want to use .NET's JWT auth instead:

```typescript
import { loginWithDotNetBackend } from "@/lib/api";

const response = await loginWithDotNetBackend({
  email: "user@example.com",
  password: "password",
});

// Store tokens
localStorage.setItem("access_token", response.accessToken);
localStorage.setItem("refresh_token", response.refreshToken);
```

## Available API Endpoints

### Verification

- `POST /api/verify/face` - Face verification with Python ML service
- `POST /api/verify/fingerprint` - Fingerprint verification (Mantra SDK)
- `POST /api/verify/aadhaar` - Aadhaar verification (UIDAI API)

### Authentication

- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token

### Health

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check with dependencies

## API Documentation

- **Swagger UI**: http://localhost:5000/swagger
- **Scalar UI**: http://localhost:5000/scalar/v1

## Error Handling

The API client automatically handles errors and includes detailed error messages:

```typescript
try {
  await verifyFace(request);
} catch (error) {
  // Error format: "API request failed: 401 Unauthorized - JWT token expired"
  console.error(error.message);
}
```

## CORS Configuration

The .NET backend is configured to allow requests from:

- http://localhost:3000
- https://localhost:3000

For production, update the CORS policy in `caveris-api/Caveris.Api/Program.cs`.

## TypeScript Types

All API types are exported from the main API module:

```typescript
import type {
  VerificationRequest,
  VerificationResponse,
  LoginRequest,
  LoginResponse,
} from "@/lib/api";
```

## Testing the Connection

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T00:00:00Z",
  "version": "1.0.0"
}
```

### From Next.js

Create a test page:

```typescript
// app/test-api/page.tsx
'use client';

import { healthCheck } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function TestAPI() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>API Connection Test</h1>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}
```

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:

1. .NET backend is running on port 5000
2. Next.js is running on port 3000
3. CORS policy in Program.cs includes your frontend URL

### Authentication Errors

If you get 401 Unauthorized:

1. Ensure you're logged in with Supabase
2. Check that the JWT token is being included in requests
3. Verify the token hasn't expired

### Connection Refused

If the frontend can't connect to the backend:

1. Check .NET backend is running: `curl http://localhost:5000/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check firewall settings

## Next Steps

1. ✅ Configure `.env.local` with your Supabase credentials
2. ✅ Start both services (.NET backend and Next.js frontend)
3. ✅ Test the health endpoint
4. ✅ Implement verification UI components
5. ✅ Add webcam/fingerprint capture
6. ✅ Test end-to-end verification flow
