import { KrakenClient } from './kraken';
import { prisma } from './prisma';
import { decrypt } from './encryption';

/**
 * Get a KrakenClient instance configured with user-specific credentials
 * @param userId - The user ID to get credentials for
 * @returns KrakenClient instance with user credentials, or throws error
 */
export async function getUserKrakenClient(userId: string): Promise<KrakenClient> {
  // Get user's encrypted credentials from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      krakenApiKey: true,
      krakenApiSecret: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has configured credentials
  if (!user.krakenApiKey || !user.krakenApiSecret) {
    const error = new Error(
      'Kraken API credentials not configured. Please add your API keys in your profile settings.'
    );
    error.name = 'CredentialsNotConfiguredError';
    throw error;
  }

  // Decrypt credentials
  let apiKey: string;
  let apiSecret: string;

  try {
    apiKey = decrypt(user.krakenApiKey);
    apiSecret = decrypt(user.krakenApiSecret);
  } catch (error) {
    console.error('Error decrypting Kraken credentials:', error);
    throw new Error('Failed to decrypt API credentials. Please re-add your credentials.');
  }

  // Create and return KrakenClient with user credentials
  return new KrakenClient({
    apiKey,
    apiSecret,
  });
}

/**
 * Check if a user has Kraken credentials configured
 * @param userId - The user ID to check
 * @returns True if user has credentials configured
 */
export async function hasKrakenCredentials(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      krakenApiKey: true,
      krakenApiSecret: true,
    },
  });

  return !!(user?.krakenApiKey && user?.krakenApiSecret);
}

/**
 * Get a KrakenClient with fallback to environment variables
 * This is for backward compatibility during migration
 * @param userId - Optional user ID
 * @returns KrakenClient instance
 */
export async function getKrakenClientWithFallback(userId?: string): Promise<KrakenClient> {
  // Try to get user-specific credentials if userId provided
  if (userId) {
    try {
      return await getUserKrakenClient(userId);
    } catch (error) {
      console.warn('Failed to get user Kraken client, falling back to env vars:', error);
    }
  }

  // Fallback to environment variables (for backward compatibility)
  return new KrakenClient({
    apiKey: process.env.KRAKEN_API_KEY,
    apiSecret: process.env.KRAKEN_API_SECRET,
  });
}

