# Kraken Rebalancer - Complete Setup Guide

Step-by-step guide to set up and run the Kraken portfolio rebalancing system with automated scheduling.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Kraken API credentials (optional for testing)
- Git (for cloning the repository)

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd kraken-rebalancer

# Install dependencies
npm install
```

**Installs:**
- Next.js 14
- TypeScript
- TailwindCSS
- shadcn/ui components
- Prisma
- node-cron
- axios
- zustand
- date-fns

### 2. Configure Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start

# Windows
# Download from https://www.postgresql.org/download/windows/

# Create database
psql postgres
CREATE DATABASE kraken_rebalancer;
\q
```

**Option B: Cloud Database**

Use a cloud PostgreSQL service:
- [Supabase](https://supabase.com) (Free tier available)
- [Neon](https://neon.tech) (Free tier available)
- [Railway](https://railway.app)
- [Heroku Postgres](https://www.heroku.com/postgres)

### 3. Environment Variables

Create `.env.local` file:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/kraken_rebalancer?schema=public"

# Kraken API (Optional - for live trading)
KRAKEN_API_KEY=your_api_key_here
KRAKEN_API_SECRET=your_api_secret_here

# Scheduler Configuration
SCHEDULER_ENABLED=true
SCHEDULER_CHECK_INTERVAL="0 * * * *"  # Every hour
SCHEDULER_DRY_RUN=true                # Start with dry-run mode
SCHEDULER_AUTO_START=false            # Manual start in development

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# (Optional) Seed with example data
npx tsx scripts/seed.ts

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

**What this creates:**
- `Portfolio` table with rebalance settings
- `RebalanceHistory` table for tracking
- Indexes for performance

### 5. Start Development Server

```bash
# Start Next.js
npm run dev

# Open in browser
# http://localhost:3000
```

### 6. Test the System

**Option A: Via API**

```bash
# 1. Create a portfolio
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portfolio",
    "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
    "rebalanceEnabled": true,
    "rebalanceInterval": "hourly",
    "rebalanceThreshold": 10
  }'

# 2. Start scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# 3. Check status
curl http://localhost:3000/api/scheduler

# 4. Manual trigger (for immediate test)
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId": "portfolio_id_from_step_1"}'

# 5. View history
curl "http://localhost:3000/api/portfolios/manage?includeHistory=true"
```

**Option B: Via Prisma Studio**

```bash
npx prisma studio

# Open http://localhost:5555
# Navigate to Portfolio table
# Click "Add record"
# Fill in fields
# Save
```

**Option C: Via Code**

```typescript
// scripts/test-scheduler.ts
import prisma from './lib/prisma';
import scheduler from './lib/scheduler';

async function test() {
  // Create portfolio
  const portfolio = await prisma.portfolio.create({
    data: {
      name: 'Test Portfolio',
      targetWeights: { BTC: 60, ETH: 40 },
      rebalanceEnabled: true,
      rebalanceInterval: 'hourly',
      rebalanceThreshold: 5.0,
      nextRebalanceAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log('Portfolio created:', portfolio.id);

  // Start scheduler
  scheduler.start();

  // Manual trigger
  await scheduler.triggerManualRebalance(portfolio.id);

  // Check history
  const history = await prisma.rebalanceHistory.findMany({
    where: { portfolioId: portfolio.id },
  });

  console.log('History:', history);

  await prisma.$disconnect();
}

test();
```

```bash
npx tsx scripts/test-scheduler.ts
```

### 7. Configure Kraken API (Optional)

**For live trading:**

1. Log in to [Kraken](https://www.kraken.com)
2. Go to Settings → API
3. Create new API key with permissions:
   - Query Funds
   - Query Open Orders & Trades
   - Create & Modify Orders
4. Add to `.env.local`:
   ```bash
   KRAKEN_API_KEY=your_key
   KRAKEN_API_SECRET=your_secret
   ```
5. Set `SCHEDULER_DRY_RUN=false` (when ready for live trading)

**For testing:**
- Keep `SCHEDULER_DRY_RUN=true`
- System will simulate trades without executing

### 8. Monitor and Manage

**View Logs:**
```bash
# Development
npm run dev
# Watch console for scheduler logs

# Production
pm2 logs
```

**Check Database:**
```bash
# Prisma Studio (GUI)
npx prisma studio

# Direct SQL
psql $DATABASE_URL

# View portfolios
SELECT * FROM "Portfolio";

# View recent rebalances
SELECT * FROM "RebalanceHistory" ORDER BY "executedAt" DESC LIMIT 10;
```

**API Endpoints:**
- `GET /api/scheduler` - Status
- `POST /api/scheduler` - Control
- `GET /api/portfolios/manage` - List portfolios
- `POST /api/portfolios/manage` - Create portfolio

## Production Deployment

### Option A: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard
# DATABASE_URL
# KRAKEN_API_KEY
# KRAKEN_API_SECRET
# SCHEDULER_ENABLED=true
# SCHEDULER_AUTO_START=true

# 4. Note: Vercel serverless doesn't support long-running cron jobs
# Use Vercel Cron (see below) or external cron service
```

**Vercel Cron Setup:**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scheduler/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create `app/api/scheduler/cron/route.ts`:
```typescript
import { rebalancePortfolio } from '@/lib/rebalance';
import prisma from '@/lib/prisma';

export async function GET() {
  // Check for portfolios that need rebalancing
  const portfolios = await prisma.portfolio.findMany({
    where: {
      rebalanceEnabled: true,
      nextRebalanceAt: { lte: new Date() },
    },
  });

  for (const portfolio of portfolios) {
    await rebalancePortfolio(portfolio.id, {
      targetWeights: portfolio.targetWeights,
      // ... config
    });
  }

  return Response.json({ success: true });
}
```

### Option B: Traditional Server

```bash
# 1. Build
npm run build

# 2. Use PM2 for process management
npm install -g pm2

# 3. Start
pm2 start npm --name "kraken-rebalancer" -- start

# 4. Auto-restart on reboot
pm2 startup
pm2 save

# 5. Monitor
pm2 monit
pm2 logs kraken-rebalancer
```

### Option C: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t kraken-rebalancer .
docker run -p 3000:3000 --env-file .env.local kraken-rebalancer
```

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database (CAUTION: deletes data)
npx prisma migrate reset
```

### Scheduler Not Running

```bash
# Check logs
# Look for: "[Scheduler] Starting scheduler..."

# Verify environment variables
echo $SCHEDULER_ENABLED
echo $SCHEDULER_AUTO_START

# Manual start via API
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### Kraken API Errors

```bash
# Test connection
curl http://localhost:3000/api/kraken/prices

# Check credentials
echo $KRAKEN_API_KEY
echo $KRAKEN_API_SECRET

# Test authentication
curl http://localhost:3000/api/kraken/balance
```

### No Rebalances Happening

```sql
-- Check portfolio settings
SELECT 
  id, 
  name, 
  "rebalanceEnabled", 
  "rebalanceInterval", 
  "nextRebalanceAt"
FROM "Portfolio";

-- Update next rebalance time
UPDATE "Portfolio" 
SET "nextRebalanceAt" = NOW() 
WHERE id = 'portfolio_id';

-- Check for errors in history
SELECT * FROM "RebalanceHistory" 
WHERE success = false 
ORDER BY "executedAt" DESC;
```

## Best Practices

### 1. Start with Dry-Run Mode

```bash
SCHEDULER_DRY_RUN=true
```

Test for several days before enabling live trading.

### 2. Set Conservative Thresholds

```typescript
{
  rebalanceThreshold: 50.0,  // €50 minimum
  rebalanceInterval: "weekly", // Not too frequent
}
```

### 3. Monitor First Rebalances

Check history after first few runs:
```sql
SELECT * FROM "RebalanceHistory" 
ORDER BY "executedAt" DESC 
LIMIT 5;
```

### 4. Backup Database

```bash
# Regular backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20251020.sql
```

### 5. Set Up Alerts

Monitor for:
- Failed rebalances
- API errors
- Database connection issues

## Next Steps

1. ✅ System is running
2. Create your first portfolio
3. Test with dry-run mode
4. Review rebalance history
5. Adjust thresholds and intervals
6. Enable live trading (when ready)
7. Monitor and optimize

## Support

- Documentation: `/lib/SCHEDULER.md`
- API Reference: `/lib/REBALANCE.md`
- Examples: `/lib/scheduler.example.ts`
- Database: `prisma/schema.prisma`

## Summary

You now have:
- ✅ Next.js app running
- ✅ PostgreSQL database configured
- ✅ Prisma ORM set up
- ✅ Scheduler system ready
- ✅ API endpoints available
- ✅ Rebalance tracking enabled

The scheduler will automatically check every hour for portfolios that need rebalancing based on their interval settings!

