# License Activation System

## Overview

The Crypto Portfolio Rebalancer now includes a comprehensive license activation system for distributing the software as a freemium product. This system allows you to generate and distribute license keys that can be time-limited or lifetime.

## Features

- ✅ **License Key Generation** - Create trial, subscription, or lifetime licenses
- ✅ **Server-Tied Activation** - Each license is tied to a specific server installation
- ✅ **Expiration Management** - Time-limited licenses with automatic expiration checks
- ✅ **First-Start Activation** - Automatic prompt for license key on first use
- ✅ **Profile Integration** - License status display in user profile
- ✅ **Expiration Warnings** - Automatic notifications when license is expiring
- ✅ **Secure Signing** - Cryptographically signed license keys to prevent tampering

## Architecture

### Database Models

#### SystemSettings
Stores the global license activation state for this installation:
- `isActivated` - Whether a license is currently active
- `licenseKey` - The activated license key
- `licenseType` - Type of license (trial, subscription, lifetime)
- `licenseExpiresAt` - Expiration date (null for lifetime)
- `serverId` - Unique identifier for this server installation

#### License
Tracks all license activations:
- `licenseKey` - The unique license key
- `licenseType` - Type of license
- `isActive` - Whether the license is currently active
- `expiresAt` - Expiration date
- `serverId` - Server this license is tied to
- `activatedBy` - User who activated the license
- `maxUsers` - Optional user limit
- `features` - Optional feature flags

### Components

#### LicenseGuard
Wrapper component that checks license status on app load and periodically:
- Shows activation modal if no license is active
- Displays expiration warnings
- Prevents closing modal if license is required

#### LicenseActivationModal
Modal dialog for entering and activating license keys:
- Displays server ID for reference
- Validates and activates license keys
- Shows feature list
- Provides clipboard paste functionality

#### Profile Page Integration
License status card showing:
- Activation status
- License type
- Expiration date (if applicable)
- Days remaining
- Server ID

### API Endpoints

#### GET /api/license/check
Check the current license status.

**Response:**
```json
{
  "isValid": true,
  "isActivated": true,
  "licenseType": "subscription",
  "expiresAt": "2025-12-31T23:59:59Z",
  "daysRemaining": 365,
  "serverId": "abc123..."
}
```

#### POST /api/license/activate
Activate a license key.

**Request:**
```json
{
  "licenseKey": "CRYPTO-REBALANCER-..."
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "isValid": true,
    "isActivated": true,
    "licenseType": "subscription",
    "expiresAt": "2025-12-31T23:59:59Z",
    "daysRemaining": 365
  }
}
```

#### GET /api/license/server-id
Get the unique server ID for this installation.

**Response:**
```json
{
  "serverId": "abc123..."
}
```

#### POST /api/license/deactivate
Deactivate the current license (admin only).

## Generating License Keys

### Using the CLI Script

The `generate-license.ts` script creates cryptographically signed license keys.

**Generate a 30-day trial:**
```bash
npm run license:generate -- --type trial --days 30
```

**Generate a lifetime license:**
```bash
npm run license:generate -- --type lifetime
```

**Generate a 1-year subscription:**
```bash
npm run license:generate -- --type subscription --days 365
```

**Generate multiple keys:**
```bash
npm run license:generate -- --type subscription --days 365 --count 5
```

**Generate with user limit:**
```bash
npm run license:generate -- --type subscription --days 365 --maxUsers 10
```

### License Key Format

License keys follow this format:
```
CRYPTO-REBALANCER-{BASE64_PAYLOAD}.{SIGNATURE}
```

The payload contains:
- Unique license ID
- License type (trial, subscription, lifetime)
- Expiration timestamp (if applicable)
- Max users (if applicable)
- Feature flags
- Issued-at timestamp

The signature is a SHA-256 HMAC ensuring the key hasn't been tampered with.

## License Types

### Trial
- **Purpose**: Short-term evaluation
- **Duration**: Typically 7-30 days
- **Use Case**: Let users try before buying

```bash
npm run license:generate -- --type trial --days 30
```

### Subscription
- **Purpose**: Recurring revenue model
- **Duration**: Custom (30, 90, 365 days, etc.)
- **Use Case**: Monthly/yearly subscriptions

```bash
npm run license:generate -- --type subscription --days 365
```

### Lifetime
- **Purpose**: One-time purchase
- **Duration**: Never expires
- **Use Case**: Premium offering

```bash
npm run license:generate -- --type lifetime
```

## Setup Instructions

### 1. Database Migration

Run the migration to add the license tables:

```bash
npx prisma migrate dev --name add_license_system
```

Or push directly:

```bash
npx prisma db push
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Set License Secret

Add to your `.env.local`:

```env
LICENSE_SECRET=your-very-secure-random-string-change-this
```

**⚠️ IMPORTANT:** Change this to a strong random string in production! This secret is used to sign license keys.

Generate a strong secret:
```bash
openssl rand -base64 32
```

### 4. Install Dependencies

If you haven't already:

```bash
npm install
```

This will install the new `@radix-ui/react-dialog` dependency.

### 5. Restart the Application

```bash
npm run dev
```

## User Experience Flow

### First Installation

1. User installs the software on their server
2. User opens the application for the first time
3. **License activation modal appears automatically**
4. User enters their license key
5. License is validated and tied to the server ID
6. User gains access to the application

### License Expiration

1. **30 days before expiration**: Warning notification appears
2. **7 days before expiration**: Warning shown every 3rd check
3. **On expiration**: Access blocked, re-activation required

### Profile Page

Users can view their license status at any time:
- License type (Trial, Subscription, Lifetime)
- Expiration date
- Days remaining
- Server ID

## Security Features

### Cryptographic Signing
- License keys are signed with HMAC-SHA256
- Tampering with keys is detected and rejected
- Secret key must be kept secure

### Server Binding
- Each license is tied to a specific server ID
- Cannot be used on multiple servers simultaneously
- Server ID is automatically generated on first run

### Validation
- License validity checked on app start
- Periodic checks every 5 minutes
- Expiration checked against server time

## Distribution Strategy

### Freemium Model

1. **Free Tier (No License)**
   - Could offer limited features
   - Require license for full access

2. **Trial Licenses**
   - 7-30 day evaluation period
   - Full feature access
   - Automatic conversion prompt

3. **Paid Subscriptions**
   - Monthly: 30-day licenses
   - Yearly: 365-day licenses
   - Automatic renewal reminders

4. **Lifetime Licenses**
   - One-time payment
   - Never expires
   - Premium pricing

### Recommended Pricing Tiers

```
Trial        → Free (30 days)
Monthly      → $29/month
Yearly       → $299/year (save 15%)
Lifetime     → $999 one-time
```

## Administration

### Viewing Active Licenses

Query the database to see all active licenses:

```sql
SELECT 
  licenseKey,
  licenseType,
  expiresAt,
  activatedAt,
  activatedBy,
  serverId
FROM License
WHERE isActive = true
ORDER BY activatedAt DESC;
```

### Deactivating a License

Use Prisma Studio or SQL:

```sql
UPDATE License 
SET isActive = false 
WHERE licenseKey = 'CRYPTO-REBALANCER-...';
```

### Checking System Settings

```sql
SELECT * FROM SystemSettings;
```

## Troubleshooting

### License Not Activating

**Check:**
1. License key is valid and not expired
2. License not already used on another server
3. LICENSE_SECRET matches the one used to generate keys
4. Database tables exist (run migration)

### License Expired

Users need to:
1. Obtain a new license key
2. Enter it in the activation modal
3. Previous license is replaced

### Server ID Changed

If server ID changes (server reinstall):
- Previous license becomes invalid
- New license key required
- Or deactivate old license manually

### Modal Won't Close

This is by design - users must enter a valid license to use the software.

**Admin override:** Manually update database:

```sql
UPDATE SystemSettings 
SET isActivated = true,
    licenseType = 'lifetime',
    licenseExpiresAt = NULL;
```

## Customization

### Changing Check Interval

In `components/license-guard.tsx`:

```typescript
// Check every 10 minutes instead of 5
const interval = setInterval(() => {
  checkLicense(true);
}, 10 * 60 * 1000);
```

### Custom Expiration Warning Threshold

In `components/license-guard.tsx`:

```typescript
// Show warning at 14 days instead of 7
if (data.daysRemaining <= 14 && data.daysRemaining > 0) {
  // ...
}
```

### Adding Feature Flags

When generating licenses:

```typescript
const licenseData: LicenseData = {
  id: crypto.randomUUID(),
  type: 'subscription',
  features: {
    advanced_analytics: true,
    api_access: true,
    unlimited_portfolios: true,
    priority_support: true,  // Add custom features
  },
};
```

Check features in your code:

```typescript
const licenseInfo = await checkLicense();
if (licenseInfo.features?.priority_support) {
  // Show priority support options
}
```

## Best Practices

### Security

1. **Change LICENSE_SECRET** - Never use default secret
2. **Keep Secret Secure** - Don't commit to version control
3. **Regular Backups** - Backup license database
4. **Monitor Usage** - Track license activations

### User Experience

1. **Clear Messaging** - Explain license requirements
2. **Easy Activation** - Provide copy-paste functionality
3. **Advance Warnings** - Notify before expiration
4. **Renewal Process** - Make it easy to renew

### Business

1. **Trial Period** - Offer 30-day trials
2. **Flexible Pricing** - Multiple subscription options
3. **Upgrade Path** - Easy transition from trial
4. **Support** - Help with license issues

## Support

### Common User Questions

**Q: Do I need a license to use this software?**
A: Yes, a license key is required to activate the software.

**Q: Can I use my license on multiple servers?**
A: No, each license is tied to a specific server installation.

**Q: What happens when my license expires?**
A: You'll receive warnings before expiration. After expiration, you'll need to enter a new license key.

**Q: How do I check my license status?**
A: Visit your profile page to see license details including expiration date.

**Q: Can I transfer my license to a new server?**
A: Contact support to deactivate your old server and activate on the new one.

## Future Enhancements

Potential improvements to the license system:

- [ ] License key validation server (online validation)
- [ ] Automatic renewal integration
- [ ] License transfer functionality
- [ ] Usage analytics and reporting
- [ ] Multi-server licenses (enterprise tier)
- [ ] Feature flags per license type
- [ ] License marketplace/reseller support
- [ ] API for license management
- [ ] Webhook notifications for events
- [ ] License pool management (team licenses)

## Conclusion

The license activation system provides a robust foundation for distributing your Crypto Portfolio Rebalancer as a commercial product. It includes security, flexibility, and a good user experience while protecting your intellectual property.

For questions or issues, refer to the troubleshooting section or contact support.

