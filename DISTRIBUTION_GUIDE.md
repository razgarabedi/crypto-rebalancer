# 📦 Distribution Guide for Software Publishers

## Overview

This guide explains how to securely distribute your Crypto Portfolio Rebalancer to customers while keeping the license generation tools private.

---

## 🔒 What to Keep Private (Publisher Only)

These files should NEVER be given to customers:

```
scripts/
├── generate-license.ts          🔒 PRIVATE - Your license generator
├── audit-password-security.ts   🔒 PRIVATE - Admin tool
└── ...other admin scripts       🔒 PRIVATE

LICENSE_SECRET                    🔒 PRIVATE - Your signing key
Your license database             🔒 PRIVATE - Customer records
```

**Why:**
- `generate-license.ts` = customers could generate their own keys
- `LICENSE_SECRET` = customers could forge keys
- Admin tools = security risk

---

## ✅ What Customers Get

### Option 1: Full Source (Recommended for Self-Hosted)

**Create a customer repository:**

```bash
# Clone your repo
git clone <your-main-repo> crypto-rebalancer-customer

cd crypto-rebalancer-customer

# Remove private files
rm -rf scripts/generate-license.ts
rm -rf scripts/audit-*.ts
rm -rf doc/features/LICENSE_SYSTEM.md  # Internal docs
rm -rf BUILD_SUCCESS_AND_SECURITY.md
rm -rf DISTRIBUTION_GUIDE.md

# Keep only customer-facing files
git add .
git commit -m "Customer distribution version"
git push customer-repo
```

**Customer gets:**
```
crypto-rebalancer/
├── app/                    ✅ Application code
├── components/             ✅ UI components  
├── lib/                    ✅ Business logic (includes validation)
├── prisma/                 ✅ Database schema
├── public/                 ✅ Static assets
├── package.json            ✅ Dependencies
├── README.md               ✅ User documentation
└── .env.example            ✅ Configuration template
```

### Option 2: Pre-Built Package

**Build and package:**

```bash
# 1. Build production version
npm run build

# 2. Create distribution package
tar -czf crypto-rebalancer-v1.0.0.tar.gz \
  .next/ \
  node_modules/ \
  package.json \
  package-lock.json \
  prisma/ \
  public/ \
  README.md \
  .env.example

# 3. Upload to your distribution server
# Customer downloads and extracts
```

**Customer installation:**
```bash
tar -xzf crypto-rebalancer-v1.0.0.tar.gz
cd crypto-rebalancer
npm install  # If node_modules not included
npm start
```

---

## 🔧 Customer Installation Instructions

### Prerequisites
```
- Node.js 20+
- PostgreSQL 12+
- Server with 2GB+ RAM
```

### Installation Steps

**1. Extract/Clone the software**
```bash
git clone <customer-repo-url>
cd crypto-rebalancer
npm install
```

**2. Configure Database**
```bash
# Install PostgreSQL if needed
# Create database
createdb crypto_rebalancer
```

**3. Configure Environment**
```bash
cp .env.example .env

# Edit .env:
DATABASE_URL="postgresql://user:password@localhost:5432/crypto_rebalancer"
JWT_SECRET="<generate-random-secret>"
LICENSE_SECRET="<you-provide-this>"  # YOU provide this value
```

**Important: LICENSE_SECRET**
- YOU provide this to customers
- Must be the SAME secret you use to generate keys
- Include in their environment setup
- Example: `LICENSE_SECRET=your-public-validation-key-12345`

**4. Initialize Database**
```bash
npx prisma generate
npx prisma db push
```

**5. Build (if not pre-built)**
```bash
npm run build
```

**6. Start Application**
```bash
npm start

# Or with PM2 for production:
pm2 start npm --name "crypto-rebalancer" -- start
```

**7. Access Application**
```
http://localhost:3010
```

**8. Activate License**
- License modal appears automatically
- Copy Server ID shown in modal
- Send Server ID to you (software publisher)
- Wait for license key from you
- Paste license key and activate

---

## 🔑 License Distribution Workflow

### Step 1: Customer Setup

Customer installs software and opens in browser:

```
╔══════════════════════════════════════════════╗
║       Activate Crypto Rebalancer             ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Your Server ID:                             ║
║  ┌─────────────────────────────────────┐    ║
║  │ 691f3d97-e462-49dd-a57e-98adf1bfb73e│[Copy]║
║  └─────────────────────────────────────┘    ║
║                                              ║
║  ⚠️ Send this Server ID to your provider    ║
║                                              ║
╚══════════════════════════════════════════════╝
```

### Step 2: Customer Requests License

**Support Ticket / Email:**
```
To: support@your-company.com
Subject: License Request

Hi,

I just installed Crypto Portfolio Rebalancer on my server.
Please send me a [trial/subscription/lifetime] license.

Server ID: 691f3d97-e462-49dd-a57e-98adf1bfb73e
Name: John Smith
Company: Acme Corp
Email: john@acme.com

Thank you!
```

### Step 3: YOU Generate License

**On YOUR machine (private):**
```bash
# Record in your customer database:
# Customer: Acme Corp
# Server ID: 691f3d97-e462-49dd-a57e-98adf1bfb73e
# Type: Lifetime
# Price: $999
# Date: 2024-11-13

# Generate license:
npx tsx scripts/generate-license.ts \
  --serverId 691f3d97-e462-49dd-a57e-98adf1bfb73e \
  --type lifetime
```

**Output (save this):**
```
License Key:
CRYPTO-REBALANCER-eyJpZCI6IjMzODE1NDFlLTcyOGItNGIyNi04NmVlLTY2OWQxNGM5NmFjNyIsInR5cGUiOiJsaWZldGltZSIsInNlcnZlcklkIjoiNjkxZjNkOTctZTQ2Mi00OWRkLWE1N2UtOThhZGYxYmZiNzNlIiwiZXhwIjpudWxsLCJtYXhVc2VycyI6bnVsbCwiZmVhdHVyZXMiOnsiYWR2YW5jZWRfYW5hbHl0aWNzIjp0cnVlLCJhcGlfYWNjZXNzIjp0cnVlLCJ1bmxpbWl0ZWRfcG9ydGZvbGlvcyI6dHJ1ZX0sImlhdCI6MTc2MzAzNTMwNn0.XiyGD8s_srs7FM_5N4Uch1N8yRdZ_kXJ5krqy49i5W4
```

### Step 4: Send License to Customer

**Email Response:**
```
To: john@acme.com
Subject: Your Crypto Rebalancer License Key

Hi John,

Thank you for your purchase! Here is your lifetime license key:

CRYPTO-REBALANCER-eyJpZCI6IjMzODE1NDFlLTcyOGItNGIyNi04NmVlLTY2OWQxNGM5NmFjNyIsInR5cGUiOiJsaWZldGltZSIsInNlcnZlcklkIjoiNjkxZjNkOTctZTQ2Mi00OWRkLWE1N2UtOThhZGYxYmZiNzNlIiwiZXhwIjpudWxsLCJtYXhVc2VycyI6bnVsbCwiZmVhdHVyZXMiOnsiYWR2YW5jZWRfYW5hbHl0aWNzIjp0cnVlLCJhcGlfYWNjZXNzIjp0cnVlLCJ1bmxpbWl0ZWRfcG9ydGZvbGlvcyI6dHJ1ZX0sImlhdCI6MTc2MzAzNTMwNn0.XiyGD8s_srs7FM_5N4Uch1N8yRdZ_kXJ5krqy49i5W4

License Details:
- Type: Lifetime (never expires)
- Server ID: 691f3d97-e462-49dd-a57e-98adf1bfb73e
- Features: All features included

To activate:
1. Open your Crypto Rebalancer dashboard
2. Paste the license key in the activation modal
3. Click "Activate License"

The license is bound to your specific server installation.
If you need to migrate to a new server, contact support.

Support: support@your-company.com

Best regards,
Your Company
```

### Step 5: Customer Activates

Customer pastes key → ✅ Activation succeeds!

---

## 📋 Customer Database Tracking

**Recommended spreadsheet/database:**

| Customer | Server ID | License Key | Type | Purchased | Expires | Status | Notes |
|----------|-----------|-------------|------|-----------|---------|--------|-------|
| Acme Corp | 691f3d97... | CRYPTO-... | Lifetime | 2024-11-13 | Never | Active | - |
| Tech Inc | 12345678... | CRYPTO-... | Yearly | 2024-11-13 | 2025-11-13 | Active | Auto-renew |
| StartupCo | 87654321... | CRYPTO-... | Trial | 2024-11-13 | 2024-12-13 | Expired | - |

**Benefits:**
- Track all customers and licenses
- Easy license lookups for support
- Renewal reminders
- Revenue tracking
- Server migration handling

---

## 🛡️ Security Best Practices

### For Publishers (You)

**1. Protect LICENSE_SECRET**
```bash
# Store in password manager
# Never commit to git
# Use different secrets for dev/prod
# Backup securely
```

**2. Secure License Generator**
```bash
# Keep scripts/ folder private
# Only on your admin machines
# Use version control (private repo)
# Regular backups
```

**3. Track All Licenses**
```bash
# Maintain customer database
# Log all license generations
# Monitor for unusual activity
# Regular audits
```

### For Customers

**1. Protect Environment**
```bash
# Secure .env file
chmod 600 .env

# Don't commit secrets
echo ".env" >> .gitignore

# Use environment variables in production
```

**2. Secure Database**
```bash
# Strong PostgreSQL password
# Firewall rules
# Regular backups
# SSL/TLS connections
```

**3. Keep Software Updated**
```bash
# Monitor for updates
# Apply security patches
# Keep dependencies updated
```

---

## 💰 Pricing Models

### Option 1: Per-Server Licensing

```
Trial:      Free (30 days)
Monthly:    $29/server/month
Yearly:     $299/server/year (save 15%)
Lifetime:   $999/server (one-time)
```

**Multi-Server Discounts:**
- 3-5 servers: 10% off
- 6-10 servers: 20% off
- 11+ servers: Contact for enterprise pricing

### Option 2: User-Based Licensing

```
1-5 users:    $99/month
6-20 users:   $299/month
21-50 users:  $699/month
51+ users:    Custom pricing
```

### Option 3: Feature-Based Licensing

```
Basic:        $49/month (core features)
Professional: $149/month (+ advanced analytics)
Enterprise:   $499/month (+ API access, priority support)
```

---

## 📧 Customer Communication Templates

### Welcome Email

```
Subject: Welcome to Crypto Portfolio Rebalancer!

Hi [Customer Name],

Thank you for purchasing Crypto Portfolio Rebalancer!

What's Next:
1. Download the software: [link]
2. Follow installation guide: [link]
3. Get your Server ID from the activation modal
4. Reply with your Server ID to receive your license key

Need help? Contact support@your-company.com

Best regards,
[Your Name]
```

### License Delivery Email

```
Subject: Your License Key

Hi [Customer Name],

Your license key is ready! See attached or below.

License Key:
[KEY]

Type: [Lifetime/Subscription]
Server ID: [ID]

Activation Instructions:
1. Open application
2. Paste key in activation modal
3. Click "Activate License"

Questions? Reply to this email.

Best regards,
[Your Name]
```

### Renewal Reminder (Subscriptions)

```
Subject: License Renewal - [X] Days Remaining

Hi [Customer Name],

Your Crypto Portfolio Rebalancer license expires in [X] days.

Current License:
- Server ID: [ID]
- Expires: [Date]
- Type: [Type]

To renew:
1. Reply to confirm renewal
2. Process payment: [link]
3. Receive new license key

Questions? Contact support.

Best regards,
[Your Name]
```

---

## 🚀 Quick Start Checklist

### For First Customer Distribution

- [ ] Create customer repository (without private scripts)
- [ ] Update README with customer instructions
- [ ] Prepare .env.example with LICENSE_SECRET placeholder
- [ ] Document installation steps
- [ ] Set up customer database/spreadsheet
- [ ] Create email templates
- [ ] Test full workflow (install → license → activate)
- [ ] Prepare support process
- [ ] Set up payment system
- [ ] Launch! 🎉

---

## 📞 Support Process

### Customer Opens Ticket

**Common Issues:**

**1. "Can't activate license"**
- Verify Server ID matches
- Check LICENSE_SECRET in their environment
- Regenerate key if needed

**2. "License expired"**
- Check expiration date
- Generate renewal key
- Process payment if needed

**3. "Server migration"**
- Get new Server ID
- Deactivate old license (optional)
- Generate new license for new Server ID
- May charge migration fee

**4. "Lost license key"**
- Look up in customer database
- Resend same key
- Verify Server ID matches

---

## 🎉 You're Ready to Distribute!

Your distribution strategy is secure and professional:

✅ **Security:** License generator remains private  
✅ **Scalability:** Easy to generate thousands of licenses  
✅ **Support:** Clear customer workflow  
✅ **Revenue:** Protected licensing model  
✅ **Professional:** Enterprise-ready distribution  

**Start selling your software with confidence!**

---

**Last Updated:** November 13, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

