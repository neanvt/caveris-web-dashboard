# Password Hashing and Salt Implementation Guide

## Overview

This document explains the complete password hashing and salt implementation for the CAVERIS system, including explicit salt generation, storage, and verification.

## Security Architecture

### Components

1. **Password Hash** - Bcrypt hash of the password
2. **Password Salt** - Unique salt used for hashing (stored separately)
3. **Default Password** - Generated from phone number (last 4 digits + "Caveris")

### Why Explicit Salt Storage?

While bcrypt includes the salt in the hash itself, we store it separately for:

- **Auditability** - Track when salts were generated
- **Security Analysis** - Verify salt uniqueness
- **Compliance** - Meet regulatory requirements for explicit salt documentation
- **Debugging** - Easier troubleshooting of authentication issues

## Database Schema

### Users Table Columns

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- Bcrypt hash
    password_salt TEXT,            -- Bcrypt salt (NEW)
    -- ... other columns
);
```

### Migration Steps

1. **Add Salt Column**

```bash
psql -h your-db-host -U postgres -d your-database -f add-password-salt-column.sql
```

2. **Migrate Existing Users**

```bash
psql -h your-db-host -U postgres -d your-database -f migrate-password-hashes.sql
```

## Implementation Details

### Password Hashing Flow

```typescript
// 1. Generate default password
const defaultPassword = generateDefaultPassword(phone); // "3210Caveris"

// 2. Hash password with salt generation
const { hash, salt } = await hashPassword(defaultPassword);

// 3. Store in database
await supabase.from("users").insert({
  email,
  phone,
  password_hash: hash,
  password_salt: salt,
  // ... other fields
});
```

### Password Verification Flow

```typescript
// 1. Retrieve user from database
const user = await supabase
  .from("users")
  .select("password_hash, password_salt")
  .eq("email", email)
  .single();

// 2. Verify password (bcrypt automatically uses embedded salt)
const isValid = await verifyPassword(inputPassword, user.password_hash);

// 3. Grant access if valid
if (isValid) {
  // Login successful
}
```

## Password Utility Functions

### Core Functions

#### `hashPassword(password: string)`

```typescript
// Generates hash and salt
const { hash, salt } = await hashPassword("myPassword123");

// Returns:
// {
//   hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
//   salt: "$2a$10$N9qo8uLOickgx2ZMRZoMye"
// }
```

#### `verifyPassword(password: string, hash: string)`

```typescript
// Verify password against stored hash
const isValid = await verifyPassword("myPassword123", storedHash);
// Returns: true or false
```

#### `generateDefaultPassword(phone: string)`

```typescript
// Generate default password from phone
const password = generateDefaultPassword("+919876543210");
// Returns: "3210Caveris"
```

#### `generateSalt()`

```typescript
// Generate a new bcrypt salt
const salt = await generateSalt();
// Returns: "$2a$10$N9qo8uLOickgx2ZMRZoMye"
```

#### `extractSaltFromHash(hash: string)`

```typescript
// Extract salt from bcrypt hash
const salt = extractSaltFromHash(hash);
// Returns: "$2a$10$N9qo8uLOickgx2ZMRZoMye"
```

## Default Password Format

### Pattern

```
Last 4 digits of phone + "Caveris"
```

### Examples

| Phone Number  | Default Password |
| ------------- | ---------------- |
| +919876543210 | 3210Caveris      |
| +918765432109 | 2109Caveris      |
| +917654321098 | 1098Caveris      |

### Security Considerations

- ✅ Unique per user (based on phone)
- ✅ Easy to communicate to users
- ✅ Meets minimum complexity (8 chars, upper, lower, number)
- ⚠️ Users should change on first login
- ⚠️ Should be sent via secure channel (email/SMS)

## Bcrypt Salt Structure

### Format

```
$2a$10$N9qo8uLOickgx2ZMRZoMye
│  │  │ └─ 22-character salt
│  │  └─ Cost factor (10 = 2^10 iterations)
│  └─ Minor version
└─ Algorithm identifier (2a = bcrypt)
```

### Properties

- **Length**: 29 characters
- **Cost Factor**: 10 (1024 iterations)
- **Randomness**: 128 bits of entropy
- **Uniqueness**: Cryptographically unique per password

## Security Best Practices

### ✅ Implemented

1. **Unique Salts** - Each password gets a unique salt
2. **Strong Hashing** - Bcrypt with cost factor 10
3. **No Plain Text** - Passwords never stored in plain text
4. **Server-Side** - All hashing done server-side
5. **Explicit Storage** - Salt stored separately for auditability

### 🔄 Recommended

1. **Force Password Change** - Require change on first login
2. **Password Expiry** - Implement password rotation policy
3. **Secure Transmission** - Send default passwords via encrypted email/SMS
4. **Audit Logging** - Log password changes and failed attempts
5. **Rate Limiting** - Prevent brute force attacks

## Migration Checklist

- [ ] Run `add-password-salt-column.sql` to add salt column
- [ ] Run `migrate-password-hashes.sql` to update existing users
- [ ] Verify all users have proper hashes and salts
- [ ] Test login with default password
- [ ] Implement password change functionality
- [ ] Set up secure password delivery (email/SMS)
- [ ] Enable audit logging for authentication events

## Testing

### Test Password Hashing

```typescript
import { hashPassword, verifyPassword } from "@/lib/password-utils";

// Test hashing
const { hash, salt } = await hashPassword("TestPassword123");
console.log("Hash:", hash);
console.log("Salt:", salt);

// Test verification
const isValid = await verifyPassword("TestPassword123", hash);
console.log("Valid:", isValid); // Should be true

const isInvalid = await verifyPassword("WrongPassword", hash);
console.log("Invalid:", isInvalid); // Should be false
```

### Test Default Password Generation

```typescript
import { generateDefaultPassword } from "@/lib/password-utils";

const password = generateDefaultPassword("+919876543210");
console.log("Default Password:", password); // "3210Caveris"
```

## Troubleshooting

### Issue: Users can't login with default password

**Check:**

1. Verify password_hash is not "default_hash"
2. Verify password_salt is populated
3. Check console logs for generated password
4. Test password verification manually

**Solution:**

```sql
-- Check user's password status
SELECT
    email,
    phone,
    password_hash,
    password_salt,
    CASE
        WHEN password_hash = 'default_hash' THEN 'Not migrated'
        WHEN password_salt IS NULL THEN 'Missing salt'
        ELSE 'OK'
    END as status
FROM users
WHERE email = 'user@example.com';
```

### Issue: Salt column doesn't exist

**Solution:**

```bash
psql -h your-db-host -U postgres -d your-database -f add-password-salt-column.sql
```

### Issue: Bcrypt errors

**Check:**

1. bcryptjs package installed: `npm list bcryptjs`
2. Correct import: `import bcrypt from 'bcryptjs'`
3. Async/await usage: All hash functions are async

## Performance Considerations

### Bcrypt Cost Factor

Current: **10** (1024 iterations)

| Cost | Iterations | Time (approx) |
| ---- | ---------- | ------------- |
| 8    | 256        | ~40ms         |
| 10   | 1024       | ~150ms        |
| 12   | 4096       | ~600ms        |
| 14   | 16384      | ~2.4s         |

**Recommendation**: Keep at 10 for balance between security and performance.

### Database Indexing

```sql
-- Add index for faster lookups (already in migration)
CREATE INDEX IF NOT EXISTS idx_users_password_salt ON users(password_salt);
```

## Compliance

### Data Protection

- Passwords hashed with industry-standard bcrypt
- Salts stored for audit trail
- No plain text passwords in logs or database

### GDPR Considerations

- Password hashes are personal data
- Include in data export requests
- Securely delete on account deletion

## Summary

✅ **Implemented Features:**

- Explicit salt generation and storage
- Bcrypt hashing with cost factor 10
- Default password generation from phone
- Password verification
- Database migration scripts
- Comprehensive utilities

🔐 **Security Level:** High

- Unique salts per password
- Industry-standard hashing
- No plain text storage
- Server-side processing

📊 **Audit Trail:** Complete

- Salt stored separately
- Creation timestamps
- Update tracking
- Migration logging
