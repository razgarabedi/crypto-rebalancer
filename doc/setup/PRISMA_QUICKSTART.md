# Prisma + PostgreSQL Quick Start Guide

Complete guide to set up and use Prisma with PostgreSQL for the Kraken Rebalancer project.

## ✅ What's Already Done

- ✅ Prisma installed (`@prisma/client`, `prisma`)
- ✅ Prisma initialized (`prisma/schema.prisma`)
- ✅ Database models defined (Portfolio, RebalanceHistory)
- ✅ Prisma client generated
- ✅ Zustand store updated with database integration

## 🚀 Quick Setup (5 Steps)

### Step 1: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (if not installed)
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb kraken_rebalancer

# Or using psql:
psql postgres
CREATE DATABASE kraken_rebalancer;
\q
```

**Option B: Cloud Database (Recommended for Beginners)**

Free options:
1. **[Supabase](https://supabase.com)** - Free tier, easy setup
2. **[Neon](https://neon.tech)** - Serverless PostgreSQL, free tier
3. **[Railway](https://railway.app)** - $5 credit, easy deploy

Steps for Supabase:
1. Sign up at https://supabase.com
2. Create new project
3. Wait for database to initialize (~2 minutes)
4. Go to Settings → Database
5. Copy "Connection string" (URI format)

### Step 2: Configure Database URL

Create `.env.local` file in project root:

```bash
# For local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/kraken_rebalancer?schema=public"

# For Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# For Neon
DATABASE_URL="postgresql://[user]:[password]@[host].neon.tech/[dbname]?sslmode=require"
```

**Replace:**
- `username` → Your PostgreSQL username (default: `postgres`)
- `password` → Your PostgreSQL password
- `localhost:5432` → Your database host and port
- `kraken_rebalancer` → Your database name

### Step 3: Run Prisma Migration

This creates the database tables:

```bash
# Generate Prisma client (already done, but run again if needed)
npm run db:generate

# Create and apply migration
npm run db:migrate

# Enter migration name when prompted:
# Example: "init" or "create_portfolios"
```

**What this does:**
- Creates `Portfolio` table
- Creates `RebalanceHistory` table
- Sets up indexes
- Generates migration SQL file

**Expected output:**
```
✔ Generated Prisma Client
✔ Name of migration: init
✔ Your database is now in sync with your schema
```

### Step 4: Verify Setup

**Option A: Prisma Studio (Visual GUI)**

```bash
npm run db:studio

# Opens http://localhost:5555
# You can view, add, edit, delete records
```

**Option B: Command Line**

```bash
# Test connection
npx prisma db pull

# View schema
npx prisma format
```

### Step 5: Test in Your App

Start the development server:

```bash
npm run dev

# Open http://localhost:3000
```

Test database integration:

```bash
# Create a test portfolio
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portfolio",
    "targetWeights": { "BTC": 60, "ETH": 40 },
    "rebalanceEnabled": true,
    "rebalanceInterval": "weekly",
    "rebalanceThreshold": 10
  }'

# List portfolios
curl http://localhost:3000/api/portfolios/manage
```

## 📊 Database Schema

### Portfolio Table

```sql
CREATE TABLE "Portfolio" (
  "id"                    TEXT NOT NULL PRIMARY KEY,
  "name"                  TEXT NOT NULL,
  "userId"                TEXT,
  "targetWeights"         JSONB NOT NULL,
  "rebalanceEnabled"      BOOLEAN NOT NULL DEFAULT false,
  "rebalanceInterval"     TEXT NOT NULL DEFAULT 'weekly',
  "rebalanceThreshold"    DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  "maxOrdersPerRebalance" INTEGER,
  "lastRebalancedAt"      TIMESTAMP(3),
  "nextRebalanceAt"       TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL
);
```

### RebalanceHistory Table

```sql
CREATE TABLE "RebalanceHistory" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "portfolioId"        TEXT NOT NULL,
  "executedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "success"            BOOLEAN NOT NULL,
  "dryRun"             BOOLEAN NOT NULL DEFAULT false,
  "portfolioValue"     DOUBLE PRECISION NOT NULL,
  "ordersPlanned"      INTEGER NOT NULL,
  "ordersExecuted"     INTEGER NOT NULL,
  "ordersFailed"       INTEGER NOT NULL,
  "totalValueTraded"   DOUBLE PRECISION NOT NULL,
  "orders"             JSONB NOT NULL,
  "errors"             JSONB,
  "triggeredBy"        TEXT NOT NULL DEFAULT 'scheduler',
  "duration"           INTEGER,
  
  CONSTRAINT "RebalanceHistory_portfolioId_fkey" 
    FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

## 💻 Using the Store in Components

### Fetch Portfolios

```typescript
'use client';

import { usePortfolioStore } from '@/store';
import { useEffect } from 'react';

export function PortfolioList() {
  const { dbPortfolios, fetchDBPortfolios, isLoading } = usePortfolioStore();

  useEffect(() => {
    fetchDBPortfolios();
  }, [fetchDBPortfolios]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {dbPortfolios.map(portfolio => (
        <div key={portfolio.id}>
          <h3>{portfolio.name}</h3>
          <p>{portfolio.rebalanceInterval}</p>
        </div>
      ))}
    </div>
  );
}
```

### Create Portfolio

```typescript
const { createDBPortfolio } = usePortfolioStore();

const handleCreate = async () => {
  const portfolio = await createDBPortfolio({
    name: "My Portfolio",
    targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
    rebalanceEnabled: true,
    rebalanceInterval: "weekly",
    rebalanceThreshold: 10.0
  });
  
  if (portfolio) {
    console.log('Created:', portfolio.id);
  }
};
```

### Update Portfolio

```typescript
const { updateDBPortfolio } = usePortfolioStore();

await updateDBPortfolio(portfolioId, {
  rebalanceEnabled: true,
  rebalanceInterval: "daily"
});
```

### Delete Portfolio

```typescript
const { deleteDBPortfolio } = usePortfolioStore();

await deleteDBPortfolio(portfolioId);
```

### Trigger Rebalance

```typescript
const { triggerRebalance } = usePortfolioStore();

await triggerRebalance(portfolioId);
```

## 🔧 Common Commands

```bash
# Generate Prisma client
npm run db:generate

# Create new migration
npm run db:migrate

# Push schema without migration (dev only)
npm run db:push

# Open Prisma Studio
npm run db:studio

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# View current migrations
ls prisma/migrations

# Format schema file
npx prisma format
```

## 🐛 Troubleshooting

### "Can't reach database server"

```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Ubuntu/Debian
sudo service postgresql status

# Test connection
psql $DATABASE_URL

# If connection fails, check:
# 1. Database is running
# 2. DATABASE_URL is correct
# 3. Firewall allows connection
# 4. Database credentials are correct
```

### "Database does not exist"

```bash
# Create the database
createdb kraken_rebalancer

# Or in psql:
psql postgres
CREATE DATABASE kraken_rebalancer;
```

### "Migration failed"

```bash
# Reset and try again
npx prisma migrate reset

# Or force push schema
npx prisma db push --force-reset
```

### "Prisma Client not generated"

```bash
npm run db:generate

# Or
npx prisma generate
```

### "Environment variable not found: DATABASE_URL"

```bash
# Make sure .env.local exists
cat .env.local | grep DATABASE_URL

# Or create it
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/kraken_rebalancer"' > .env.local
```

## 📚 Useful Queries

### Get all portfolios

```typescript
import prisma from '@/lib/prisma';

const portfolios = await prisma.portfolio.findMany();
```

### Get portfolio with history

```typescript
const portfolio = await prisma.portfolio.findUnique({
  where: { id: portfolioId },
  include: { rebalanceHistory: true }
});
```

### Get recent rebalances

```typescript
const history = await prisma.rebalanceHistory.findMany({
  where: { portfolioId },
  orderBy: { executedAt: 'desc' },
  take: 10
});
```

### Count successful rebalances

```typescript
const count = await prisma.rebalanceHistory.count({
  where: { success: true }
});
```

## 🎯 Next Steps

1. ✅ Database is set up
2. ✅ Tables are created
3. ✅ Store is configured
4. Create your first portfolio via API or Prisma Studio
5. Start the scheduler to enable automatic rebalancing
6. Monitor rebalance history

## 📖 Documentation

- **Prisma Schema:** `prisma/schema.prisma`
- **Prisma Client:** `lib/prisma.ts`
- **Portfolio Store:** `store/portfolio-store.ts`
- **Store Examples:** `store/portfolio-store.example.tsx`
- **API Endpoints:** `app/api/portfolios/manage/route.ts`

## 🚀 Production Deployment

### Environment Variables

Add to your hosting platform (Vercel, Railway, etc.):

```bash
DATABASE_URL="postgresql://..."
KRAKEN_API_KEY="..."
KRAKEN_API_SECRET="..."
SCHEDULER_ENABLED="true"
SCHEDULER_AUTO_START="true"
```

### Run Migrations

```bash
# In production, use:
npx prisma migrate deploy

# NOT:
# npx prisma migrate dev (dev only)
```

## ✅ Setup Complete!

Your Prisma + PostgreSQL integration is ready. You can now:

- Create portfolios through the UI
- Store data in PostgreSQL
- Use automated scheduling
- Track rebalance history
- Manage portfolios with Zustand store

**Need help?** Check the examples in `store/portfolio-store.example.tsx`

