

# Portfolio Rebalancing Scheduler

Automated cron-based scheduling system for portfolio rebalancing with PostgreSQL database integration.

## Overview

The scheduler system provides:
- ✅ Automated periodic rebalancing based on portfolio settings
- ✅ Flexible scheduling (hourly, daily, weekly, monthly)
- ✅ Database persistence with Prisma + PostgreSQL
- ✅ Rebalance history tracking
- ✅ Manual trigger capability
- ✅ Dry-run mode for testing
- ✅ Comprehensive logging

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Scheduler System                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐          ┌────────────────┐          │
│  │              │  Checks  │                 │          │
│  │ Cron Task    │ ────────>│  PostgreSQL     │          │
│  │ (Every Hour) │          │  Database       │          │
│  │              │          │                 │          │
│  └──────┬───────┘          └────────┬───────┘          │
│         │                            │                   │
│         │ Finds portfolios due       │ Reads             │
│         │ for rebalancing            │ portfolios        │
│         v                            │                   │
│  ┌──────────────────────────────────┴────┐              │
│  │  For each portfolio:                  │              │
│  │  1. Fetch holdings & prices           │              │
│  │  2. Calculate rebalance orders        │              │
│  │  3. Execute trades (or dry-run)       │              │
│  │  4. Save to RebalanceHistory          │              │
│  │  5. Update portfolio.lastRebalancedAt │              │
│  │  6. Calculate nextRebalanceAt         │              │
│  └───────────────────────────────────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Portfolio Model

```prisma
model Portfolio {
  id                    String   @id @default(cuid())
  name                  String
  userId                String?
  
  // Target allocation
  targetWeights         Json     // { "BTC": 40, "ETH": 30, ... }
  
  // Rebalancing settings
  rebalanceEnabled      Boolean  @default(false)
  rebalanceInterval     String   @default("weekly")
  rebalanceThreshold    Float    @default(10.0)
  maxOrdersPerRebalance Int?
  
  // Timestamps
  lastRebalancedAt      DateTime?
  nextRebalanceAt       DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  rebalanceHistory      RebalanceHistory[]
}
```

### RebalanceHistory Model

```prisma
model RebalanceHistory {
  id                 String   @id @default(cuid())
  portfolioId        String
  
  // Execution details
  executedAt         DateTime @default(now())
  success            Boolean
  dryRun             Boolean  @default(false)
  
  // Portfolio state
  portfolioValue     Float
  
  // Orders
  ordersPlanned      Int
  ordersExecuted     Int
  ordersFailed       Int
  totalValueTraded   Float
  
  // Results
  orders             Json
  errors             Json?
  
  // Metadata
  triggeredBy        String   @default("scheduler")
  duration           Int?
}
```

## Setup

### 1. Install Dependencies

```bash
npm install node-cron prisma @prisma/client
npm install --save-dev @types/node-cron
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kraken_rebalancer"

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_CHECK_INTERVAL="0 * * * *"  # Every hour
SCHEDULER_DRY_RUN=false               # Set to true for testing
SCHEDULER_AUTO_START=true             # Auto-start in production
```

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Start Scheduler

The scheduler auto-starts in production. For development:

```typescript
import { initScheduler } from '@/lib/init-scheduler';

initScheduler();
```

## Usage

### Create a Portfolio

```typescript
import prisma from '@/lib/prisma';

const portfolio = await prisma.portfolio.create({
  data: {
    name: "My Portfolio",
    targetWeights: {
      BTC: 40,
      ETH: 30,
      SOL: 20,
      ADA: 10
    },
    rebalanceEnabled: true,
    rebalanceInterval: "weekly",
    rebalanceThreshold: 10.0,
  }
});
```

### Via API

```bash
# Create portfolio
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Portfolio",
    "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
    "rebalanceEnabled": true,
    "rebalanceInterval": "weekly",
    "rebalanceThreshold": 10
  }'

# Get all portfolios
curl http://localhost:3000/api/portfolios/manage

# Update portfolio
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "portfolio_id",
    "rebalanceEnabled": true,
    "rebalanceInterval": "daily"
  }'

# Delete portfolio
curl -X DELETE "http://localhost:3000/api/portfolios/manage?id=portfolio_id"
```

## Scheduler Control

### Get Status

```bash
curl http://localhost:3000/api/scheduler
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "config": {
      "enabled": true,
      "checkInterval": "0 * * * *",
      "dryRunMode": false
    },
    "activeTasks": 0
  },
  "schedule": [
    {
      "id": "portfolio_id",
      "name": "My Portfolio",
      "rebalanceInterval": "weekly",
      "lastRebalancedAt": "2025-10-20T10:00:00.000Z",
      "nextRebalanceAt": "2025-10-27T10:00:00.000Z"
    }
  ]
}
```

### Start/Stop Scheduler

```bash
# Start
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'

# Restart
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "restart"}'
```

### Update Configuration

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update-config",
    "config": {
      "checkInterval": "0 */6 * * *",
      "dryRunMode": true
    }
  }'
```

### Manual Trigger

```bash
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId": "portfolio_id"}'
```

## Rebalance Intervals

| Interval | Description | Next Rebalance |
|----------|-------------|----------------|
| `hourly` | Every hour (testing) | +1 hour |
| `daily` | Once per day | +24 hours |
| `weekly` | Once per week | +7 days |
| `monthly` | Once per month | +1 month |

## How It Works

### 1. Scheduler Checks (Every Hour)

```sql
SELECT * FROM Portfolio 
WHERE rebalanceEnabled = true 
  AND (nextRebalanceAt IS NULL OR nextRebalanceAt <= NOW())
```

### 2. For Each Portfolio

1. **Fetch Data**
   - Get Kraken account balance
   - Get current EUR prices
   
2. **Calculate**
   - Calculate portfolio value
   - Compare current vs target allocation
   - Generate rebalance orders
   
3. **Execute**
   - Place orders on Kraken (or simulate if dry-run)
   - Collect results
   
4. **Save History**
   ```typescript
   await prisma.rebalanceHistory.create({
     data: {
       portfolioId,
       success: true,
       portfolioValue: 27500,
       ordersExecuted: 4,
       totalValueTraded: 9000,
       orders: [...],
       triggeredBy: "scheduler"
     }
   });
   ```
   
5. **Update Portfolio**
   ```typescript
   await prisma.portfolio.update({
     where: { id },
     data: {
       lastRebalancedAt: new Date(),
       nextRebalanceAt: calculateNext(interval)
     }
   });
   ```

## Logging

The scheduler provides comprehensive logging:

```
[Scheduler] Starting scheduler...
[Scheduler] Check interval: 0 * * * *
[Scheduler] Dry run mode: false
[Scheduler] Scheduler started successfully

2025-10-20T10:00:00.000Z [Scheduler] Checking portfolios for rebalancing...
[Scheduler] Found 2 portfolio(s) that need rebalancing

[Scheduler] Rebalancing portfolio: My Portfolio (portfolio_id)
[Rebalance:portfolio_id] INFO: Starting portfolio rebalance
[Rebalance:portfolio_id] SUCCESS: Portfolio value calculated: €27,500.00
[Rebalance:portfolio_id] INFO: Generated 4 rebalance orders
[Rebalance:portfolio_id] SUCCESS: Order executed successfully
[Scheduler] ✓ Portfolio rebalanced successfully: My Portfolio (4 orders, €9000.00 traded, 8234ms)

[Scheduler] Check completed in 10456ms
```

## Querying Rebalance History

```typescript
// Get last 10 rebalances for a portfolio
const history = await prisma.rebalanceHistory.findMany({
  where: { portfolioId: 'portfolio_id' },
  orderBy: { executedAt: 'desc' },
  take: 10,
});

// Get all successful rebalances
const successful = await prisma.rebalanceHistory.findMany({
  where: { success: true },
  include: { portfolio: true },
});

// Get rebalances in date range
const recentRebalances = await prisma.rebalanceHistory.findMany({
  where: {
    executedAt: {
      gte: new Date('2025-10-01'),
      lte: new Date('2025-10-31'),
    },
  },
});

// Calculate total value traded
const stats = await prisma.rebalanceHistory.aggregate({
  _sum: { totalValueTraded: true },
  _avg: { portfolioValue: true },
  _count: true,
});
```

## Configuration Options

### Cron Expression Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Every day at midnight
- `0 0 * * 0` - Every Sunday at midnight
- `0 9 * * 1` - Every Monday at 9 AM

### Portfolio Settings

```typescript
{
  rebalanceEnabled: true,      // Enable/disable scheduling
  rebalanceInterval: "weekly", // daily, weekly, monthly
  rebalanceThreshold: 10.0,    // Min EUR difference
  maxOrdersPerRebalance: 5,    // Optional order limit
}
```

## Safety Features

### 1. **Dry Run Mode**
Test without executing real trades:
```bash
SCHEDULER_DRY_RUN=true
```

### 2. **Per-Portfolio Enable/Disable**
```typescript
await prisma.portfolio.update({
  where: { id },
  data: { rebalanceEnabled: false }
});
```

### 3. **History Tracking**
All rebalances saved to database with full details.

### 4. **Error Recovery**
Failed rebalances don't stop the scheduler:
```typescript
try {
  await rebalancePortfolio(id);
} catch (error) {
  // Log error, save to history, continue
}
```

### 5. **Rate Limiting**
1-second delay between orders prevents API rate limits.

## Monitoring

### Check Scheduler Health

```bash
curl http://localhost:3000/api/scheduler
```

### View Recent Rebalances

```sql
SELECT 
  p.name,
  rh.executedAt,
  rh.success,
  rh.portfolioValue,
  rh.ordersExecuted,
  rh.totalValueTraded
FROM RebalanceHistory rh
JOIN Portfolio p ON p.id = rh.portfolioId
ORDER BY rh.executedAt DESC
LIMIT 10;
```

### Failed Rebalances

```sql
SELECT 
  p.name,
  rh.executedAt,
  rh.errors
FROM RebalanceHistory rh
JOIN Portfolio p ON p.id = rh.portfolioId
WHERE rh.success = false
ORDER BY rh.executedAt DESC;
```

## Performance

- **Check Interval:** ~100ms (database query)
- **Per Portfolio:** ~10-30s (depending on order count)
- **Database Queries:** 3-4 per rebalance
- **Concurrent Rebalancing:** Sequential (one at a time)

## Troubleshooting

### Scheduler Not Running

1. Check environment variables:
   ```bash
   SCHEDULER_ENABLED=true
   ```

2. Check logs for errors

3. Manually start:
   ```typescript
   import scheduler from '@/lib/scheduler';
   scheduler.start();
   ```

### Portfolio Not Rebalancing

1. Check if enabled:
   ```sql
   SELECT rebalanceEnabled, nextRebalanceAt 
   FROM Portfolio WHERE id = 'portfolio_id';
   ```

2. Check next rebalance time:
   ```typescript
   const portfolio = await prisma.portfolio.findUnique({
     where: { id: 'portfolio_id' }
   });
   console.log(portfolio.nextRebalanceAt);
   ```

3. Manually trigger:
   ```bash
   curl -X POST http://localhost:3000/api/scheduler/trigger \
     -H "Content-Type: application/json" \
     -d '{"portfolioId": "portfolio_id"}'
   ```

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy
```

## Best Practices

### 1. **Start with Dry Run**
```typescript
{
  rebalanceEnabled: true,
  rebalanceInterval: "hourly",  // Fast for testing
}
```
Set `SCHEDULER_DRY_RUN=true` initially.

### 2. **Monitor First Runs**
Check history after first few rebalances:
```typescript
const history = await prisma.rebalanceHistory.findMany({
  where: { portfolioId },
  orderBy: { executedAt: 'desc' },
  take: 5,
});
```

### 3. **Set Appropriate Intervals**
- **Conservative:** Monthly
- **Moderate:** Weekly  
- **Aggressive:** Daily
- **Testing:** Hourly

### 4. **Use Thresholds**
Avoid micro-transactions:
```typescript
{
  rebalanceThreshold: 50.0  // Only rebalance if difference > €50
}
```

### 5. **Limit Orders**
For large portfolios:
```typescript
{
  maxOrdersPerRebalance: 3  // Top 3 most important orders
}
```

## Migration Guide

If you have existing portfolios without rebalancing:

```typescript
// Enable rebalancing for existing portfolio
await prisma.portfolio.update({
  where: { id: 'portfolio_id' },
  data: {
    rebalanceEnabled: true,
    rebalanceInterval: 'weekly',
    nextRebalanceAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scheduler` | GET | Get scheduler status |
| `/api/scheduler` | POST | Control scheduler |
| `/api/scheduler/trigger` | POST | Manual rebalance |
| `/api/portfolios/manage` | GET | List portfolios |
| `/api/portfolios/manage` | POST | Create portfolio |
| `/api/portfolios/manage` | PUT | Update portfolio |
| `/api/portfolios/manage` | DELETE | Delete portfolio |

## Related Documentation

- `/lib/REBALANCE.md` - Rebalancing orchestrator
- `/lib/PORTFOLIO.md` - Portfolio calculations
- `/lib/KRAKEN_API.md` - Kraken API client
- `prisma/schema.prisma` - Database schema

## Future Enhancements

- [ ] Web UI for scheduler management
- [ ] Email/webhook notifications
- [ ] Performance analytics dashboard
- [ ] Multi-user support with authentication
- [ ] Configurable retry logic
- [ ] Parallel portfolio processing
- [ ] Advanced scheduling rules (market hours, volatility-based)
- [ ] Backtest historical rebalancing strategies

