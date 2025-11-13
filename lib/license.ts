import * as crypto from 'crypto';
import { prisma } from './prisma';

// Secret for signing license keys - CHANGE THIS IN PRODUCTION
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'your-license-secret-key-change-in-production';

export interface LicenseData {
  id: string;
  type: 'trial' | 'lifetime' | 'subscription';
  serverId: string; // REQUIRED - binds license to specific installation
  expiresAt?: Date;
  maxUsers?: number;
  features?: Record<string, boolean>;
}

export interface LicenseInfo {
  isValid: boolean;
  isActivated: boolean;
  licenseType?: string;
  expiresAt?: Date;
  daysRemaining?: number;
  serverId?: string;
  features?: Record<string, boolean>;
}

/**
 * Generate a license key with embedded data and signature
 * The license is cryptographically bound to the provided Server ID
 */
export function generateLicenseKey(data: LicenseData): string {
  if (!data.serverId) {
    throw new Error('Server ID is required to generate a license key');
  }

  // Create payload with license data
  const payload = {
    id: data.id,
    type: data.type,
    serverId: data.serverId, // CRITICAL - binds license to this server
    exp: data.expiresAt ? Math.floor(data.expiresAt.getTime() / 1000) : null,
    maxUsers: data.maxUsers || null,
    features: data.features || {},
    iat: Math.floor(Date.now() / 1000), // issued at
  };

  // Convert to base64
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');

  // Create signature
  const signature = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  // Format: CRYPTO-REBALANCER-{PAYLOAD}.{SIGNATURE}
  return `CRYPTO-REBALANCER-${payloadB64}.${signature}`;
}

/**
 * Decode and verify a license key
 */
export function decodeLicenseKey(licenseKey: string): LicenseData | null {
  try {
    // Check format
    if (!licenseKey.startsWith('CRYPTO-REBALANCER-')) {
      return null;
    }

    // Extract payload and signature
    const keyData = licenseKey.replace('CRYPTO-REBALANCER-', '');
    const [payloadB64, signature] = keyData.split('.');

    if (!payloadB64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', LICENSE_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      console.error('Invalid license signature');
      return null;
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('License has expired');
      return null;
    }

    return {
      id: payload.id,
      type: payload.type,
      serverId: payload.serverId,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      maxUsers: payload.maxUsers,
      features: payload.features,
    };
  } catch (error) {
    console.error('Error decoding license key:', error);
    return null;
  }
}

/**
 * Activate a license key for this installation
 */
export async function activateLicense(licenseKey: string, activatedBy?: string): Promise<{ success: boolean; error?: string; license?: LicenseInfo }> {
  try {
    // Decode and verify the license key
    const licenseData = decodeLicenseKey(licenseKey);
    
    if (!licenseData) {
      return { success: false, error: 'Invalid or expired license key' };
    }

    // Get or create system settings
    let settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          serverId: crypto.randomUUID(),
        },
      });
    }

    // CRITICAL: Verify the license was generated for THIS server
    if (licenseData.serverId !== settings.serverId) {
      return { 
        success: false, 
        error: `This license key was generated for a different server. This server ID: ${settings.serverId.substring(0, 12)}... Please obtain a license key for this specific server.` 
      };
    }

    // Check if license is already used by another server (should not happen now, but keep as safety check)
    const existingLicense = await prisma.license.findUnique({
      where: { licenseKey },
    });

    if (existingLicense && existingLicense.serverId && existingLicense.serverId !== settings.serverId) {
      return { success: false, error: 'This license key is already activated on another server' };
    }

    // Create or update license record
    const license = await prisma.license.upsert({
      where: { licenseKey },
      create: {
        licenseKey,
        licenseType: licenseData.type,
        expiresAt: licenseData.expiresAt,
        serverId: settings.serverId,
        activatedBy: activatedBy || 'system',
        maxUsers: licenseData.maxUsers,
        features: licenseData.features || {},
      },
      update: {
        isActive: true,
        activatedAt: new Date(),
        activatedBy: activatedBy || 'system',
        serverId: settings.serverId,
      },
    });

    // Update system settings
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        isActivated: true,
        activatedAt: new Date(),
        licenseId: license.id,
        licenseKey: licenseKey,
        licenseType: licenseData.type,
        licenseExpiresAt: licenseData.expiresAt,
      },
    });

    return {
      success: true,
      license: {
        isValid: true,
        isActivated: true,
        licenseType: licenseData.type,
        expiresAt: licenseData.expiresAt,
        daysRemaining: licenseData.expiresAt ? Math.ceil((licenseData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
        serverId: settings.serverId,
        features: licenseData.features,
      },
    };
  } catch (error) {
    console.error('Error activating license:', error);
    return { success: false, error: 'Failed to activate license' };
  }
}

/**
 * Check if the system has a valid license
 */
export async function checkLicense(): Promise<LicenseInfo> {
  try {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings || !settings.isActivated || !settings.licenseKey) {
      return {
        isValid: false,
        isActivated: false,
      };
    }

    // Decode the license key to check expiration
    const licenseData = decodeLicenseKey(settings.licenseKey);

    if (!licenseData) {
      // License is invalid or expired - deactivate
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          isActivated: false,
        },
      });

      return {
        isValid: false,
        isActivated: false,
      };
    }

    // Calculate days remaining
    const daysRemaining = licenseData.expiresAt 
      ? Math.ceil((licenseData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      isValid: true,
      isActivated: true,
      licenseType: licenseData.type,
      expiresAt: licenseData.expiresAt,
      daysRemaining,
      serverId: settings.serverId,
      features: licenseData.features,
    };
  } catch (error) {
    console.error('Error checking license:', error);
    return {
      isValid: false,
      isActivated: false,
    };
  }
}

/**
 * Deactivate the current license
 */
export async function deactivateLicense(): Promise<void> {
  const settings = await prisma.systemSettings.findFirst();
  
  if (settings) {
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        isActivated: false,
        licenseId: null,
        licenseKey: null,
        licenseType: null,
        licenseExpiresAt: null,
      },
    });
  }
}

/**
 * Get server ID for this installation
 */
export async function getServerId(): Promise<string> {
  let settings = await prisma.systemSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        serverId: crypto.randomUUID(),
      },
    });
  }
  
  return settings.serverId;
}

