# 🔧 Production License Fix

## Problem

License activation only works in `npm run dev` but not in `npm start` (production mode).

## Root Cause

Next.js was **statically generating** pages at build time, which means:
1. License check happened during `npm run build`
2. Database state at build time was captured
3. Production mode used the cached/built state
4. New license activations didn't work because the app used old build-time data

## Solution Applied

### 1. Force Dynamic Rendering ✅

Added dynamic rendering to prevent static generation:

**Files Modified:**
- `app/layout.tsx` - Root layout now dynamic
- `app/api/license/check/route.ts` - Never cache license checks
- `app/api/license/activate/route.ts` - Never cache activations
- `app/api/license/server-id/route.ts` - Always fetch at runtime

**Code added:**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**What this does:**
- ✅ License checks happen at runtime, not build time
- ✅ Database is queried when user accesses the app
- ✅ License state is always fresh
- ✅ Activations work in production

### 2. Environment Variables Required

**Make sure these are set in production:**

**`.env` or `.env.production`:**
```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/crypto_rebalancer"

# JWT Secret (REQUIRED)
JWT_SECRET="your-random-secret-here"

# License Secret (REQUIRED - must match key generation secret)
LICENSE_SECRET="your-license-secret-here"

# Optional
KRAKEN_API_KEY="your-kraken-key"
KRAKEN_API_SECRET="your-kraken-secret"
```

**Important:**
- `LICENSE_SECRET` must be the SAME in both:
  - Your key generation environment (where you run generate-license script)
  - Customer's production environment (where they activate)

### 3. Production Workflow (Fixed)

**Step 1: Build**
```bash
npm run build
```

**Step 2: Start Production**
```bash
npm start
# OR with PM2:
pm2 start npm --name "crypto-rebalancer" -- start
```

**Step 3: Access Application**
```
http://localhost:3010
```

**Step 4: License Activation**
- License modal appears ✅
- Shows Server ID ✅
- User enters license key ✅
- Activation works! ✅

---

## Testing the Fix

### Test 1: Fresh Production Build

```bash
# 1. Clean build
rm -rf .next/

# 2. Build production
npm run build

# 3. Start production
npm start

# 4. Open browser
# http://localhost:3010

# Expected Result:
# ✅ License modal appears
# ✅ Server ID displayed
# ✅ Can activate license
# ✅ Activation persists
```

### Test 2: License Activation in Production

```bash
# 1. Production mode running
npm start

# 2. Open browser
# 3. Copy Server ID from modal

# 4. Generate license (on your machine)
npx tsx scripts/generate-license.ts \
  --serverId <server-id-from-modal> \
  --type lifetime

# 5. Paste license key in modal
# 6. Click "Activate License"

# Expected Result:
# ✅ Activation succeeds
# ✅ Modal closes
# ✅ App is accessible
```

### Test 3: License Persists After Restart

```bash
# 1. Activate license in production (as above)

# 2. Stop server
pm2 stop crypto-rebalancer
# OR Ctrl+C

# 3. Start again
pm2 start crypto-rebalancer
# OR npm start

# 4. Open browser

# Expected Result:
# ✅ No license modal (already activated)
# ✅ App loads normally
# ✅ License status shows in Profile page
```

---

## Troubleshooting

### Issue: "License activation succeeds but modal reappears on restart"

**Cause:** Database not persisting

**Fix:**
```bash
# Check database connection
npx prisma studio

# Verify SystemSettings table exists and has data
# Should see isActivated: true
```

### Issue: "License key is invalid"

**Cause:** LICENSE_SECRET mismatch

**Fix:**
```bash
# Ensure LICENSE_SECRET is set in production
echo $LICENSE_SECRET

# Must be the SAME secret used to generate keys
# Add to .env:
LICENSE_SECRET="same-secret-as-key-generation"
```

### Issue: "Server ID changes on each restart"

**Cause:** Database not persisting SystemSettings

**Fix:**
```bash
# Check database
npx prisma studio

# SystemSettings table should have ONE row with serverId
# If empty, database is not working correctly

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db push
```

### Issue: "Build fails with license errors"

**Cause:** Old issue (now fixed)

**Fix:**
```bash
# Update dependencies
npm install

# Clean build
rm -rf .next/ node_modules/.cache

# Rebuild
npm run build
```

---

## Production Deployment Checklist

Before deploying to customers:

- [ ] Environment variables configured
  - [ ] DATABASE_URL set
  - [ ] JWT_SECRET set
  - [ ] LICENSE_SECRET set (same as key generation)
- [ ] Database initialized
  - [ ] `npx prisma generate`
  - [ ] `npx prisma db push`
- [ ] Build successful
  - [ ] `npm run build` (no errors)
- [ ] Test in production mode
  - [ ] `npm start` works
  - [ ] License activation works
  - [ ] License persists after restart
- [ ] Documentation provided to customer
  - [ ] Installation instructions
  - [ ] How to get Server ID
  - [ ] How to request license
  - [ ] How to activate

---

## Customer Instructions (Updated)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Build
npm run build

# 5. Start
npm start
```

### Activation

```bash
# 1. Open browser
http://localhost:3010

# 2. Copy Server ID from activation modal

# 3. Send Server ID to software provider

# 4. Receive license key from provider

# 5. Paste license key in modal

# 6. Click "Activate License"

# ✅ Done!
```

### Verification

```bash
# Check license status in Profile page
# Should show:
# - ✅ License Activated
# - Type: LIFETIME/SUBSCRIPTION/TRIAL
# - Expiration (if applicable)
# - Days remaining (if applicable)
```

---

## What Changed

### Before (Broken in Production)

```
Build Process:
npm run build
  └─> Static generation
      └─> License check at BUILD TIME
          └─> Database state captured
              └─> Production uses OLD state ❌

Production:
npm start
  └─> Serves pre-built pages
      └─> License state from build time
          └─> New activations don't work ❌
```

### After (Working in Production)

```
Build Process:
npm run build
  └─> Builds app structure only
      └─> NO license check at build time ✅
          └─> NO state captured ✅

Production:
npm start
  └─> Dynamic rendering
      └─> License check at RUNTIME ✅
          └─> Fresh database queries ✅
              └─> Activations work! ✅
```

---

## Technical Details

### Next.js Rendering Modes

**Static Generation (Default):**
- Pages generated at build time
- Same HTML served to all users
- Fast but not suitable for dynamic data
- ❌ Not suitable for license checks

**Dynamic Rendering (Now Enabled):**
- Pages generated per request
- Fresh data on every request
- Perfect for user-specific data
- ✅ Perfect for license checks

### Configuration Added

```typescript
// app/layout.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**What it does:**
- `dynamic = 'force-dynamic'` - Never static generate
- `revalidate = 0` - Never cache
- Every request = fresh data
- License checks = real-time

---

## Summary

✅ **Fixed:** License activation now works in production  
✅ **Fixed:** License state persists after restart  
✅ **Fixed:** Dynamic rendering enabled  
✅ **Fixed:** No build-time caching of license data  

**The software is now production-ready and licenses work correctly in both dev and production modes!** 🎉

---

**Fixed:** November 13, 2025  
**Status:** Production Ready ✅

