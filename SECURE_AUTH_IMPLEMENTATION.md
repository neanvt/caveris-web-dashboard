# Secure Authentication Implementation Guide

## Overview

This guide explains how to implement secure authentication with httpOnly cookies, token rotation, and proper security practices.

## Security Features Implemented

✅ **httpOnly Cookies** - Tokens stored in httpOnly cookies (not accessible via JavaScript)  
✅ **sessionStorage** - Non-sensitive user data only  
✅ **Short-lived Tokens** - Access tokens expire in 15 minutes  
✅ **Refresh Token Rotation** - New refresh token issued on each refresh  
✅ **Token Expiration Validation** - Client and server-side validation  
✅ **Server-side Validation** - Every request validates token  
✅ **No Password Storage** - Passwords never stored in browser storage

---

## Backend Implementation (C# .NET)

### 1. Login Endpoint

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // Validate credentials
    var user = await _userService.ValidateCredentials(request.Email, request.Password);
    if (user == null)
        return Unauthorized(new { message = "Invalid credentials" });

    // Generate tokens
    var accessToken = GenerateAccessToken(user);  // 15 min expiry
    var refreshToken = GenerateRefreshToken(user); // 7 days expiry

    // Store refresh token in database with expiry
    await _tokenService.StoreRefreshToken(user.Id, refreshToken, DateTime.UtcNow.AddDays(7));

    // Set httpOnly cookies
    Response.Cookies.Append("access_token", accessToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true, // HTTPS only in production
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromMinutes(15)
    });

    Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromDays(7)
    });

    // Return user data (NO TOKENS in response body)
    return Ok(new
    {
        userId = user.Id,
        email = user.Email,
        role = user.Role,
        fullName = user.FullName,
        requiresPasswordChange = user.RequiresPasswordChange,
        expiresAt = DateTime.UtcNow.AddMinutes(15).ToString("o") // ISO format
    });
}
```

### 2. Token Refresh Endpoint

```csharp
[HttpPost("refresh")]
public async Task<IActionResult> RefreshToken()
{
    // Get refresh token from httpOnly cookie
    var refreshToken = Request.Cookies["refresh_token"];
    if (string.IsNullOrEmpty(refreshToken))
        return Unauthorized(new { message = "No refresh token" });

    // Validate refresh token
    var storedToken = await _tokenService.GetRefreshToken(refreshToken);
    if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
    {
        // Token invalid or expired - clear cookies
        Response.Cookies.Delete("access_token");
        Response.Cookies.Delete("refresh_token");
        return Unauthorized(new { message = "Invalid or expired refresh token" });
    }

    // Get user
    var user = await _userService.GetById(storedToken.UserId);
    if (user == null)
        return Unauthorized();

    // ROTATE: Generate NEW tokens
    var newAccessToken = GenerateAccessToken(user);
    var newRefreshToken = GenerateRefreshToken(user);

    // Invalidate old refresh token
    await _tokenService.RevokeRefreshToken(refreshToken);

    // Store new refresh token
    await _tokenService.StoreRefreshToken(user.Id, newRefreshToken, DateTime.UtcNow.AddDays(7));

    // Set new httpOnly cookies
    Response.Cookies.Append("access_token", newAccessToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromMinutes(15)
    });

    Response.Cookies.Append("refresh_token", newRefreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromDays(7)
    });

    return Ok(new
    {
        expiresAt = DateTime.UtcNow.AddMinutes(15).ToString("o")
    });
}
```

### 3. Logout Endpoint

```csharp
[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    // Get refresh token from cookie
    var refreshToken = Request.Cookies["refresh_token"];

    // Revoke refresh token in database
    if (!string.IsNullOrEmpty(refreshToken))
    {
        await _tokenService.RevokeRefreshToken(refreshToken);
    }

    // Clear httpOnly cookies
    Response.Cookies.Delete("access_token");
    Response.Cookies.Delete("refresh_token");

    return Ok(new { message = "Logged out successfully" });
}
```

### 4. Authentication Middleware

```csharp
public class JwtCookieMiddleware
{
    private readonly RequestDelegate _next;

    public JwtCookieMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
    {
        // Get access token from httpOnly cookie
        var token = context.Request.Cookies["access_token"];

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                // Validate token
                var principal = ValidateToken(token);

                if (principal != null)
                {
                    context.User = principal;
                }
            }
            catch (SecurityTokenExpiredException)
            {
                // Token expired - client should refresh
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { message = "Token expired" });
                return;
            }
            catch (Exception)
            {
                // Invalid token
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid token" });
                return;
            }
        }

        await _next(context);
    }

    private ClaimsPrincipal ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(Configuration["Jwt:Secret"]);

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero // No tolerance for expiration
        };

        return tokenHandler.ValidateToken(token, validationParameters, out _);
    }
}
```

### 5. Database Schema for Refresh Tokens

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);
```

### 6. Token Service Implementation

```csharp
public class TokenService : ITokenService
{
    private readonly IDbConnection _db;

    public async Task StoreRefreshToken(Guid userId, string token, DateTime expiresAt)
    {
        await _db.ExecuteAsync(
            @"INSERT INTO refresh_tokens (user_id, token, expires_at)
              VALUES (@UserId, @Token, @ExpiresAt)",
            new { UserId = userId, Token = token, ExpiresAt = expiresAt }
        );
    }

    public async Task<RefreshToken> GetRefreshToken(string token)
    {
        return await _db.QueryFirstOrDefaultAsync<RefreshToken>(
            @"SELECT * FROM refresh_tokens
              WHERE token = @Token
              AND revoked_at IS NULL
              AND expires_at > NOW()",
            new { Token = token }
        );
    }

    public async Task RevokeRefreshToken(string token)
    {
        await _db.ExecuteAsync(
            @"UPDATE refresh_tokens
              SET revoked_at = NOW()
              WHERE token = @Token",
            new { Token = token }
        );
    }

    public async Task CleanupExpiredTokens()
    {
        // Run this periodically (e.g., daily cron job)
        await _db.ExecuteAsync(
            @"DELETE FROM refresh_tokens
              WHERE expires_at < NOW() - INTERVAL '30 days'"
        );
    }
}
```

---

## Frontend Implementation (Already Done)

### Files Updated:

1. **`/src/lib/auth.ts`** - Secure auth utilities with sessionStorage
2. **`/src/lib/api-client.ts`** - API client with httpOnly cookie support
3. **`/src/app/login/page.tsx`** - Login with `credentials: 'include'`

### Usage in Components:

```typescript
import { api } from "@/lib/api-client";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";

// Check authentication
if (!isAuthenticated()) {
  router.push("/login");
}

// Get user data
const user = getCurrentUser();

// Make API calls (tokens sent automatically via cookies)
const managers = await api.get("/managers");
const newManager = await api.post("/managers", { name: "John" });
```

---

## CORS Configuration (Backend)

```csharp
// In Startup.cs or Program.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins("http://localhost:3000") // Your Next.js app
            .AllowCredentials() // IMPORTANT: Allow cookies
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

app.UseCors("AllowFrontend");
```

---

## Security Checklist

- ✅ Access tokens expire in 15 minutes
- ✅ Refresh tokens expire in 7 days
- ✅ Refresh tokens are rotated on each refresh
- ✅ Old refresh tokens are revoked
- ✅ Tokens stored in httpOnly cookies
- ✅ Cookies use `Secure` flag (HTTPS only)
- ✅ Cookies use `SameSite=Strict`
- ✅ No tokens in localStorage/sessionStorage
- ✅ No passwords stored in browser
- ✅ Server validates tokens on every request
- ✅ Expired tokens cleaned up periodically

---

## Testing

### 1. Test Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt
```

### 2. Test Authenticated Request

```bash
curl http://localhost:5001/api/managers \
  -b cookies.txt
```

### 3. Test Token Refresh

```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

### 4. Test Logout

```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -b cookies.txt
```

---

## Migration Steps

1. ✅ Update frontend auth utilities (DONE)
2. ✅ Update API client (DONE)
3. ⏳ Implement backend endpoints (login, refresh, logout)
4. ⏳ Add JWT cookie middleware
5. ⏳ Create refresh_tokens table
6. ⏳ Implement token service
7. ⏳ Configure CORS with credentials
8. ⏳ Test end-to-end flow

---

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Backend (appsettings.json)

```json
{
  "Jwt": {
    "Secret": "your-super-secret-key-min-32-chars",
    "Issuer": "caveris-api",
    "Audience": "caveris-web",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  }
}
```

---

## Troubleshooting

### Cookies not being set

- Check CORS configuration allows credentials
- Ensure `credentials: 'include'` in fetch calls
- Verify `Secure` flag matches HTTPS usage

### 401 errors on every request

- Check middleware is reading cookies correctly
- Verify token validation logic
- Check token expiration times

### Refresh not working

- Verify refresh token exists in database
- Check refresh token hasn't expired
- Ensure old tokens are being revoked

---

## Next Steps

Implement the backend endpoints following the code examples above. The frontend is already configured to work with httpOnly cookies!
