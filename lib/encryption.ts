import crypto from 'crypto';

// Encryption key from environment variable
// In production, use a strong 32-byte key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32bytes!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Ensure encryption key is 32 bytes
 */
function getEncryptionKey(): Buffer {
  if (ENCRYPTION_KEY.length >= 32) {
    return Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  }
  // Pad if too short (only for development - use proper key in production)
  return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0'));
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string with IV and auth tag
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV, auth tag, salt, and encrypted data
  const result = Buffer.concat([iv, authTag, salt, Buffer.from(encrypted, 'hex')]);

  return result.toString('base64');
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Base64 encoded encrypted string
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract IV, auth tag, salt, and encrypted data
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const salt = buffer.subarray(IV_LENGTH + TAG_LENGTH, IV_LENGTH + TAG_LENGTH + SALT_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH + SALT_LENGTH);

  // Derive key using same parameters
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Validate if a string is properly encrypted
 * @param encryptedData - Data to validate
 * @returns True if valid encrypted data
 */
export function isValidEncryptedData(encryptedData: string): boolean {
  try {
    if (!encryptedData) return false;
    const buffer = Buffer.from(encryptedData, 'base64');
    // Minimum length: IV + tag + salt + at least 1 byte of data
    return buffer.length > IV_LENGTH + TAG_LENGTH + SALT_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Safely test if encrypted credentials can be decrypted
 * @param encryptedData - Encrypted string to test
 * @returns True if can be successfully decrypted
 */
export function canDecrypt(encryptedData: string): boolean {
  try {
    decrypt(encryptedData);
    return true;
  } catch {
    return false;
  }
}

