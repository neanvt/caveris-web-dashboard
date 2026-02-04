# Authentication System Documentation

## Overview

This application uses a custom token-based authentication system with localStorage persistence and automatic token refresh.

## Components

### 1. Auth Utilities (`/src/lib/auth.ts`)

Core authentication functions:

- **`setAuthData(data: UserData)`** - Store user data and token in localStorage
- **`clearAuthData()`** - Clear all auth data (logout)
- **`getCurrentUser()`** - Get current user object
- **`getToken()`** - Get JWT access token
- **`getRefreshToken()`** - Get refresh token
- **`isAuthenticated()`** - Check if user is logged in
- **`updateToken(newToken)`** - Update access token (for refresh flow)

### 2. API Client (`/src/lib/api-client.ts`)

Automatic token injection and refresh:

```typescript
import { api } from "@/lib/api-client";

// GET request
const users = await api.get("/users");

// POST request
const newUser = await api.post("/users", {
  name: "John",
  email: "john@example.com",
});

// PUT request
const updated = await api.put("/users/123", { name: "Jane" });

// DELETE request
await api.delete("/users/123");
```

**Features:**

- Automatically adds `Authorization: Bearer <token>` header
- Auto-refreshes expired tokens on 401 errors
- Redirects to login if refresh fails
- Handles errors gracefully

## Usage Examples

### Login Flow

```typescript
import { setAuthData } from "@/lib/auth";

const response = await fetch("http://localhost:5001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
setAuthData(data); // Stores token in localStorage

// Redirect to dashboard
window.location.href = "/admin/dashboard";
```

### Making Authenticated API Calls

```typescript
import { api } from "@/lib/api-client";

// The token is automatically added to headers
const managers = await api.get("/managers");
const verifiers = await api.get("/verifiers");

// Create new resource
const newManager = await api.post("/managers", {
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+919876543210",
});
```

### Logout

```typescript
import { clearAuthData } from "@/lib/auth";

function handleLogout() {
  clearAuthData(); // Clears localStorage and cookies
  window.location.href = "/login";
}
```

### Protected Routes/Components

```typescript
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

function ProtectedPage() {
  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const user = getCurrentUser();

  return <div>Welcome, {user?.fullName}</div>;
}
```

### Manual Token Access

```typescript
import { getToken } from "@/lib/auth";

// For custom fetch calls
const token = getToken();

fetch("/api/custom-endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Storage Details

### localStorage Keys

- **`token`** - JWT access token
- **`refreshToken`** - Refresh token (if provided by backend)
- **`user`** - Full user object (JSON stringified)

### Cookie

- **`caveris_auth`** - Minimal user data for middleware (userId, email, role, fullName)
- **Max-Age:** 24 hours
- **Path:** /
- **SameSite:** Lax

## Token Refresh Flow

1. API request returns 401 Unauthorized
2. API client automatically attempts to refresh using `refreshToken`
3. If refresh succeeds:
   - New token is stored in localStorage
   - Original request is retried with new token
4. If refresh fails:
   - All auth data is cleared
   - User is redirected to login page

## Security Considerations

1. **localStorage** - Tokens persist across browser sessions
2. **XSS Protection** - Ensure all user input is sanitized
3. **HTTPS** - Always use HTTPS in production
4. **Token Expiration** - Backend should set appropriate expiration times
5. **Refresh Tokens** - Store securely and rotate regularly

## Migration from sessionStorage

All existing code using `sessionStorage` has been migrated to `localStorage`. This means:

- ✅ Tokens persist across browser tabs
- ✅ Users stay logged in after closing browser
- ✅ Tokens available in all components/pages
- ✅ Automatic token refresh on expiration

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Troubleshooting

### "Not authenticated" errors

1. Check if token exists: `console.log(getToken())`
2. Verify token is valid (not expired)
3. Check backend is accepting the token format
4. Ensure API_BASE_URL is correct

### Token not persisting

1. Check browser localStorage in DevTools
2. Verify `setAuthData()` is called after login
3. Check for localStorage quota limits
4. Ensure no code is clearing localStorage

### Auto-logout issues

1. Check token expiration time
2. Verify refresh token endpoint is working
3. Check network tab for 401 responses
4. Ensure refresh token is being stored
