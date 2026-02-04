/**
 * Password hashing utilities using bcryptjs
 * 
 * Security Features:
 * - Explicit salt generation and storage
 * - Bcrypt hashing with configurable salt rounds
 * - Salt is stored separately for additional security and auditability
 * - Server-side execution (use in server actions only)
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Generate a salt for password hashing
 * Returns a bcrypt salt string
 */
export async function generateSalt(): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return salt;
  } catch (error) {
    console.error('Error generating salt:', error);
    throw new Error('Failed to generate salt');
  }
}

/**
 * Hash a password using bcrypt with explicit salt generation
 * Returns both the hash and the salt used
 * 
 * @param password - Plain text password to hash
 * @returns Object containing hash and salt
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  try {
    // Generate a unique salt for this password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    
    // Hash the password with the salt
    const hash = await bcrypt.hash(password, salt);
    
    return { hash, salt };
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Hash a password with a provided salt
 * Useful for password verification or re-hashing
 * 
 * @param password - Plain text password
 * @param salt - Bcrypt salt string
 * @returns Hashed password
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Error hashing password with salt:', error);
    throw new Error('Failed to hash password with salt');
  }
}

/**
 * Verify a password against a hash
 * Bcrypt automatically extracts and uses the salt from the hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored bcrypt hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Extract salt from a bcrypt hash
 * Bcrypt hashes contain the salt in the first 29 characters
 * 
 * @param hash - Bcrypt hash string
 * @returns Extracted salt
 */
export function extractSaltFromHash(hash: string): string {
  // Bcrypt hash format: $2a$10$[22 char salt][31 char hash]
  // Salt is the first 29 characters (including algorithm and cost)
  return hash.substring(0, 29);
}

/**
 * Generate a random password
 * Format: 3 words + 2 numbers (e.g., "Blue-Sky-Tree-42")
 */
export function generateRandomPassword(): string {
  const words = [
    'Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown',
    'Sky', 'Ocean', 'River', 'Mountain', 'Forest', 'Desert', 'Valley', 'Hill',
    'Star', 'Moon', 'Sun', 'Cloud', 'Rain', 'Snow', 'Wind', 'Storm',
    'Tree', 'Flower', 'Rose', 'Lily', 'Daisy', 'Tulip', 'Orchid', 'Lotus',
    'Lion', 'Tiger', 'Bear', 'Wolf', 'Eagle', 'Hawk', 'Falcon', 'Owl'
  ];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const word3 = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 100);

  return `${word1}-${word2}-${word3}-${num}`;
}

/**
 * Generate a default password for a user based on their phone number
 * Format: Last 4 digits of phone + "Caveris"
 * Example: Phone "+919876543210" → Password "3210Caveris"
 * 
 * @param phone - Phone number (any format)
 * @returns Default password string
 */
export function generateDefaultPassword(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Get last 4 digits
  const last4 = digits.slice(-4);
  
  // Return default password
  return `${last4}Caveris`;
}

/**
 * Validate password strength
 * Returns validation result with specific error messages
 * 
 * @param password - Password to validate
 * @returns Object with isValid boolean and array of error messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a secure random salt (alternative implementation)
 * Uses crypto.randomBytes for additional entropy
 * 
 * @param length - Length of salt in bytes (default: 16)
 * @returns Base64 encoded salt string
 */
export function generateRandomSalt(length: number = 16): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('base64');
}
