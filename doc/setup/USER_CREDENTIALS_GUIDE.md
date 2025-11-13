# User-Specific Kraken API Credentials - Complete Guide

## 🎉 What's New

Your Kraken Rebalancer app has been transformed to support **user-specific Kraken API credentials**! Each user can now:

- Add their own Kraken API keys directly in the web app
- Have their own separate portfolio and asset holdings
- Securely store encrypted credentials in the database
- Test their credentials before saving
- Manage multiple users with complete data isolation

## 📋 Table of Contents

- [Overview](#overview)
- [Security Features](#security-features)
- [Setup Instructions](#setup-instructions)
- [User Guide](#user-guide)
- [Migration from Environment Variables](#migration-from-environment-variables)
- [API Changes](#api-changes)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Before (Environment Variables)
```bash
# Single set of credentials in .env
KRAKEN_API_KEY=shared_key
KRAKEN_API_SECRET=shared_secret
```
- ❌ All users shared the same Kraken account
- ❌ Credentials exposed in environment files
- ❌ No multi-user support

### After (Database-Stored Credentials)
- ✅ Each user has their own encrypted Kraken API credentials
- ✅ Credentials stored securely in PostgreSQL database
- ✅ AES-256-GCM encryption with PBKDF2 key derivation
- ✅ Managed through user-friendly web interface
- ✅ True multi-user support with data isolation

---

## Security Features

### 🔐 Encryption Implementation

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Industry-standard encryption
- Authenticated encryption (prevents tampering)
- 256-bit encryption keys

**Key Derivation**: PBKDF2 with SHA-512
- 100,000 iterations
- Random salt per encryption
- Prevents rainbow table attacks

**Storage Security**:
- Encrypted credentials stored in database
- Master encryption key in environment variable
- Random initialization vectors (IV) per encryption
- Authentication tags for integrity verification

**Best Practices**:
- Never log decrypted credentials
- Credentials only decrypted in memory when needed
- Secure key generation recommended (see setup)

---

## Setup Instructions

### Step 1: Generate Encryption Key

Generate a secure 32-byte encryption key:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 2: Update Environment Variables

Add to your `.env.local` or `.env` file:

```bash
# REQUIRED: Encryption key for storing API credentials
ENCRYPTION_KEY="your-generated-32-byte-key-here"

# OPTIONAL: Legacy fallback (can be removed after migration)
# KRAKEN_API_KEY=your_api_key_here
# KRAKEN_API_SECRET=your_api_secret_here
```

### Step 3: Run Database Migration

Update your database schema to include credential fields:

```bash
# Generate Prisma client
npx prisma generate

# Run migration (creates new fields)
npx prisma migrate dev --name add_user_kraken_credentials

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Step 4: Restart Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## User Guide

### Adding Kraken API Credentials

1. **Navigate to Profile**
   - Click your name/email in the top-right corner
   - Select "Profile Settings"
   - Or go directly to `/profile`

2. **Find Kraken API Credentials Section**
   - Scroll down to "Kraken API Credentials" card
   - If credentials are already added, you'll see a green "Credentials Configured" message

3. **Get Your Kraken API Credentials**
   - Log in to [Kraken.com](https://www.kraken.com)
   - Go to **Settings → API**
   - Click **"Generate New Key"**
   - **Required Permissions**:
     - ✅ Query Funds
     - ✅ Query Open Orders & Trades
     - ✅ Create & Modify Orders
   - Copy your **API Key** and **Private Key**

4. **Add Credentials to App**
   - Paste **API Key** in the first field
   - Paste **API Secret** in the second field
   - Click "Save & Test Credentials" (recommended)
     - This tests the connection before saving
   - Or click "Save Without Testing"

5. **Success!**
   - You'll see a green "Credentials Configured" message
   - Your credentials are now encrypted and stored
   - You can now access portfolio features

### Testing Credentials

After adding credentials:

1. Go to your profile page
2. In the Kraken API Credentials section
3. Click **"Test Connection"**
4. If successful: ✓ Credentials are valid message
5. If failed: Error message with details

### Updating Credentials

To update your credentials:

1. Click **"Remove Credentials"**
2. Confirm the removal
3. Add new credentials following steps above

### Removing Credentials

1. Go to your profile page
2. Click **"Remove Credentials"**
3. Confirm: "Are you sure?"
4. Credentials will be deleted from database

**Warning**: Removing credentials will prevent:
- Portfolio tracking
- Automatic rebalancing
- Holdings display

---

## Migration from Environment Variables

### For Existing Users

If you were using environment variable credentials:

**Option A: Keep Environment Variables (Temporary)**
- Old environment variable credentials still work as fallback
- Give users time to add their own credentials
- Eventually remove `KRAKEN_API_KEY` and `KRAKEN_API_SECRET` from `.env`

**Option B: Migrate Immediately**
1. Each user adds their own Kraken API credentials via profile page
2. Remove `KRAKEN_API_KEY` and `KRAKEN_API_SECRET` from `.env.local`
3. All operations now use user-specific credentials

### Migration Checklist

- [x] Update Prisma schema
- [x] Run database migration
- [x] Add encryption key to environment
- [x] Test with first user credentials
- [ ] Notify users to add their credentials
- [ ] Remove legacy environment variables
- [ ] Update deployment configuration

---

## API Changes

### API Endpoints (New)

**GET `/api/auth/kraken-credentials`**
- Check if user has credentials configured
- Returns: `{ hasCredentials: boolean, addedAt: Date }`

**POST `/api/auth/kraken-credentials`**
- Add or update Kraken credentials
- Body: `{ apiKey: string, apiSecret: string, testConnection?: boolean }`
- Returns: `{ success: true, addedAt: Date }`

**PUT `/api/auth/kraken-credentials`**
- Test existing credentials
- Returns: `{ success: true, tested: true, hasBalance: boolean }`

**DELETE `/api/auth/kraken-credentials`**
- Remove user's credentials
- Returns: `{ success: true }`

### Updated API Endpoints

All these endpoints now require user authentication and use user-specific credentials:

- `GET /api/kraken/balance` - User's balance
- `POST /api/kraken/order` - Place order with user's account
- `GET /api/holdings` - User's holdings
- `POST /api/portfolio/calculate` - User's portfolio
- `POST /api/rebalance` - Rebalance user's portfolio
- `POST /api/rebalance/execute` - Execute with user credentials

### Code Changes for Developers

**Before:**
```typescript
import krakenClient from '@/lib/kraken';

// Used global singleton
const balance = await krakenClient.getAccountBalance();
```

**After:**
```typescript
import { getUserKrakenClient } from '@/lib/kraken-user';

// Get user-specific client
const krakenClient = await getUserKrakenClient(userId);
const balance = await krakenClient.getAccountBalance();
```

---

## Troubleshooting

### "Kraken API credentials not configured"

**Problem**: User hasn't added credentials yet

**Solution**:
1. Go to `/profile`
2. Add Kraken API credentials
3. Test connection

### "Failed to verify credentials with Kraken API"

**Problem**: Invalid API key or secret

**Possible Causes**:
- Incorrect API key or secret copied
- API key doesn't have required permissions
- API key has been revoked on Kraken

**Solution**:
1. Go to Kraken website
2. Verify API key is active
3. Check permissions are set correctly
4. Generate new key if needed
5. Re-add in app

### "Failed to decrypt API credentials"

**Problem**: Encryption key has changed or is incorrect

**Possible Causes**:
- `ENCRYPTION_KEY` environment variable changed
- Database credentials encrypted with different key

**Solution**:
1. If you changed `ENCRYPTION_KEY`, revert to original
2. If key is lost, users must re-add credentials
3. Remove and re-add credentials in profile

### "Unauthorized - Please login"

**Problem**: Not authenticated or session expired

**Solution**:
1. Log out and log back in
2. Check session is valid
3. Verify cookies are enabled

### Database Migration Issues

**Problem**: "Drift detected" during migration

**Solution**:
```bash
# Option 1: Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Option 2: Create new migration
npx prisma migrate dev

# Option 3: Deploy without prompts (production)
npx prisma migrate deploy
```

---

## Best Practices

### For Users

1. **Use Strong API Keys**
   - Create dedicated API key for this app
   - Don't share API keys across multiple apps
   - Rotate keys periodically

2. **Set Minimal Permissions**
   - Only enable required permissions
   - Don't enable "Withdraw Funds" if not needed

3. **Monitor Your Account**
   - Check Kraken account regularly
   - Review API key usage in Kraken dashboard

4. **Secure Your Account**
   - Use strong password for the app
   - Enable 2FA on your app account (coming soon)
   - Never share your credentials

### For Developers

1. **Protect Encryption Key**
   - Never commit `ENCRYPTION_KEY` to git
   - Use different keys for dev/staging/production
   - Store securely in environment/secrets manager

2. **Handle Credentials Securely**
   - Never log decrypted credentials
   - Don't expose credentials in API responses
   - Clear credentials from memory after use

3. **Database Backups**
   - Backup encryption key separately
   - Encrypted data useless without key
   - Test backup restoration process

---

## Additional Resources

### Files Created/Modified

**New Files:**
- `lib/encryption.ts` - Encryption utilities
- `lib/kraken-user.ts` - User-specific Kraken client
- `app/api/auth/kraken-credentials/route.ts` - Credentials management API
- `USER_CREDENTIALS_GUIDE.md` - This file

**Modified Files:**
- `prisma/schema.prisma` - Added credential fields to User model
- `app/profile/page.tsx` - Added credentials management UI
- `lib/rebalance.ts` - Updated to use user credentials
- `app/api/kraken/balance/route.ts` - Use user credentials
- `app/api/kraken/order/route.ts` - Use user credentials
- `app/api/holdings/route.ts` - Use user credentials
- `app/api/portfolio/calculate/route.ts` - Use user credentials
- `app/api/rebalance/route.ts` - Use user credentials
- `app/api/rebalance/execute/route.ts` - Use user credentials

### Database Schema Changes

**User Table - New Fields:**
```prisma
model User {
  // ... existing fields
  
  krakenApiKey       String?   // Encrypted API key
  krakenApiSecret    String?   // Encrypted API secret
  krakenApiAddedAt   DateTime? // When credentials were added
}
```

---

## Security Audit

✅ **Encryption**: AES-256-GCM with authentication  
✅ **Key Derivation**: PBKDF2-SHA512 (100,000 iterations)  
✅ **Random IVs**: New IV for each encryption operation  
✅ **Authentication Tags**: Prevents tampering  
✅ **Secure Storage**: PostgreSQL with row-level encryption  
✅ **No Plaintext Logs**: Credentials never logged  
✅ **Session Management**: JWT-based authentication  
✅ **Authorization**: Portfolio ownership verification  

---

## Support

**Questions or Issues?**
- Check the [Troubleshooting](#troubleshooting) section
- Review [API Documentation](./app/api/API_REFERENCE.md)
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Need Help?**
- Create an issue on GitHub
- Contact support

---

## Changelog

### Version 2.0.0 - User-Specific Credentials

**Added:**
- User-specific Kraken API credential storage
- Encrypted credential management in database
- Profile page credentials management UI
- Per-user portfolio and holdings
- Credential testing functionality

**Changed:**
- All Kraken API calls now use user credentials
- Rebalancing uses user-specific credentials
- Portfolio operations require authentication
- Environment credentials now optional (fallback)

**Security:**
- AES-256-GCM encryption for credentials
- PBKDF2 key derivation
- Authentication tags for integrity

**Migration:**
- Database schema updated with credential fields
- Environment credentials remain as fallback
- Users can add credentials via web interface

---

## License

Same license as the main project.

**Last Updated**: October 2025

