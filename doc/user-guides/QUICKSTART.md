# Dashboard Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Set Up Environment Variables

Create `.env.local` file in the project root:

```bash
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/kraken_rebalancer"

# Kraken API (Optional for testing - you can view demo data without this)
KRAKEN_API_KEY=your_api_key_here
KRAKEN_API_SECRET=your_api_secret_here
```

### Step 2: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

### Step 3: Start the Development Server

```bash
npm run dev
```

### Step 4: Create Your First Portfolio

#### Option A: Using the API (Recommended for testing)

```bash
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Crypto Portfolio",
    "targetWeights": {
      "BTC": 40,
      "ETH": 30,
      "SOL": 20,
      "ADA": 10
    },
    "rebalanceEnabled": true,
    "rebalanceInterval": "weekly",
    "rebalanceThreshold": 10
  }'
```

#### Option B: Using the UI (Coming Soon)

Click the "Add Portfolio" button in the sidebar.

### Step 5: View Your Dashboard

Navigate to: **http://localhost:3000/dashboard**

You should see:
- ✅ Your portfolio in the sidebar
- ✅ Live price data (from Kraken public API)
- ✅ Allocation charts
- ✅ Holdings table

## 📊 Understanding the Dashboard

### Sidebar

```
┌─────────────────────┐
│   Portfolios        │
├─────────────────────┤
│ ✓ My Portfolio      │
│   [Auto] weekly     │
├─────────────────────┤
│ [+ Add Portfolio]   │
└─────────────────────┘
```

- Click any portfolio to view its details
- "Auto" badge means automated rebalancing is enabled
- Click "Add Portfolio" to create a new one

### Top Bar

```
Portfolio Dashboard               [Refresh] [Rebalance Now]
Crypto Portfolio Rebalancing & Monitoring
```

- **Refresh**: Manually update live data
- **Rebalance Now**: Trigger immediate rebalancing

### Stats Cards

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Value │   Assets    │  Rebalance  │    Last     │
│  €12,345    │      4      │   Balanced  │  Oct 20     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Charts

**Current Allocation (Pie Chart)**
- Shows your actual holdings distribution
- Color-coded by asset

**Target Allocation (Pie Chart)**
- Shows your desired distribution
- Matches colors with current allocation

**Comparison (Bar Chart)**
- Blue bars: Current %
- Green bars: Target %
- Instantly spot imbalances

### Holdings Table

| Asset | Balance  | Price   | Value    | Current % | Target % | Diff   | Status    |
|-------|----------|---------|----------|-----------|----------|--------|-----------|
| BTC   | 0.123456 | €50,000 | €6,173   | 42%       | 40%      | +2%    | ✅ OK     |
| ETH   | 2.500000 | €3,500  | €8,750   | 28%       | 30%      | -2%    | ✅ OK     |
| SOL   | 50.00000 | €150    | €7,500   | 18%       | 20%      | -2%    | ⚠️ Watch  |
| ADA   | 5000.000 | €0.50   | €2,500   | 12%       | 10%      | +2%    | ✅ OK     |

**Status Indicators:**
- ✅ **OK**: Within ±2% of target
- ⚠️ **Watch**: ±2-5% from target
- 🔴 **Rebalance**: More than ±5% from target

## 🧪 Testing Without Kraken API Credentials

You can test the dashboard without Kraken API credentials:

1. **Prices will still work** (public API, no authentication needed)
2. **Balances will show as 0** (requires authentication)
3. **Charts and UI will still render** (using 0 balances)

To get realistic test data, add dummy balances:

```typescript
// Temporarily add in dashboard page.tsx for testing
useEffect(() => {
  if (!liveBalances) {
    setLiveBalances({
      BTC: 0.5,
      ETH: 5.0,
      SOL: 100.0,
      ADA: 10000.0
    });
  }
}, []);
```

## 📱 Using the Dashboard

### Switch Between Portfolios

1. Click any portfolio in the sidebar
2. Dashboard instantly updates to show that portfolio's data
3. Charts and tables refresh automatically

### Monitor Rebalancing Needs

Look for **red "Rebalance" badges** in the holdings table. These indicate assets that are more than 5% away from target allocation.

### Trigger Manual Rebalance

1. Click "Rebalance Now" button
2. System will:
   - Fetch current balances and prices
   - Calculate required trades
   - Execute orders on Kraken
   - Update database with results

**Note**: This requires Kraken API credentials with trading permissions.

### Auto-Refresh

The dashboard automatically refreshes every 30 seconds:
- ✅ Current prices
- ✅ Account balances (if authenticated)
- ✅ Calculated holdings
- ✅ Charts and tables

You can also click "Refresh" to update immediately.

## 🎨 Customizing Your View

### Change Rebalance Threshold

Edit your portfolio via API:

```bash
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your_portfolio_id",
    "rebalanceThreshold": 5
  }'
```

Now rebalancing will only trigger when assets are 5% (instead of 10%) away from target.

### Modify Target Weights

```bash
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your_portfolio_id",
    "targetWeights": {
      "BTC": 50,
      "ETH": 30,
      "SOL": 15,
      "ADA": 5
    }
  }'
```

Dashboard will instantly reflect the new targets.

### Enable/Disable Auto-Rebalancing

```bash
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your_portfolio_id",
    "rebalanceEnabled": false
  }'
```

## 🔧 Advanced Usage

### Multiple Portfolios

Create different portfolios for different strategies:

```bash
# Conservative portfolio
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conservative",
    "targetWeights": { "BTC": 70, "ETH": 30 },
    "rebalanceInterval": "monthly"
  }'

# Aggressive portfolio
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aggressive",
    "targetWeights": { "SOL": 40, "ADA": 30, "DOT": 30 },
    "rebalanceInterval": "daily"
  }'
```

Switch between them using the sidebar.

### Monitor Rebalance History

```bash
# Fetch portfolio with history
curl http://localhost:3000/api/portfolios/manage?id=your_id&includeHistory=true
```

### Check Scheduler Status

```bash
# View scheduler status
curl http://localhost:3000/api/scheduler

# Response:
{
  "running": true,
  "schedule": "0 0 * * *",
  "portfolioCount": 3
}
```

## 📊 Example Workflows

### Workflow 1: Daily Monitoring

1. Open dashboard: `http://localhost:3000/dashboard`
2. Check "Rebalance Status" card
3. If status is "Balanced" ✅: No action needed
4. If status is "Needed" 🔴: Review holdings table
5. Click "Rebalance Now" if appropriate

### Workflow 2: Weekly Rebalancing

1. Create portfolio with weekly interval
2. Enable auto-rebalancing
3. Scheduler automatically rebalances every week
4. Check dashboard to view results

### Workflow 3: Multi-Portfolio Strategy

1. Create "Long-Term" portfolio (monthly rebalancing)
2. Create "Active" portfolio (daily rebalancing)
3. Switch between them to compare performance
4. Adjust weights based on market conditions

## 🐛 Troubleshooting

### Dashboard is blank

**Check:**
1. Database is running: `psql $DATABASE_URL`
2. Portfolios exist: `curl http://localhost:3000/api/portfolios/manage`
3. Browser console for errors: Press F12

### Prices showing as €0.00

**Solution:** Kraken API might be rate-limited or having issues.

```bash
# Test directly
curl http://localhost:3000/api/kraken/prices?symbols=XXBTZEUR

# If this fails, wait a few minutes and try again
```

### Balances showing as 0.000000

**Solution:** Kraken API credentials not configured or invalid.

```bash
# Test authentication
curl http://localhost:3000/api/kraken/balance

# Should return balance or auth error
```

### "Rebalance Now" button disabled

**Possible reasons:**
1. No portfolio selected (select one from sidebar)
2. Already rebalancing (wait for completion)
3. API credentials not configured

### Charts not rendering

**Solution:** Check that Recharts is installed:

```bash
npm install recharts
```

## 💡 Pro Tips

### Tip 1: Use Browser Tabs

Open multiple tabs to compare portfolios side-by-side.

### Tip 2: Bookmark Your Portfolios

URLs support portfolio IDs (coming soon):
```
http://localhost:3000/dashboard?portfolio=clx123abc
```

### Tip 3: Monitor Performance

Check "Last Rebalanced" card to ensure automatic rebalancing is working.

### Tip 4: Set Conservative Thresholds

Start with a 10% threshold to avoid over-trading. Adjust based on your strategy.

### Tip 5: Test in Dry-Run Mode

Before enabling real trades, test with dry-run mode:

```bash
# In lib/rebalance.ts, set dryRun: true
const result = await executeRebalance({
  portfolioId: 'xxx',
  dryRun: true  // No real trades
});
```

## 🎯 Next Steps

1. ✅ Create your first portfolio
2. ✅ View the dashboard
3. ✅ Configure Kraken API credentials
4. ✅ Enable auto-rebalancing
5. ✅ Monitor daily for a week
6. ✅ Adjust weights and thresholds
7. ✅ Create multiple portfolio strategies

## 📚 Additional Resources

- **Full Documentation**: See `DASHBOARD.md`
- **API Reference**: See `lib/REBALANCE_IMPLEMENTATION.md`
- **Scheduler Guide**: See `lib/SCHEDULER.md`
- **Database Setup**: See `SETUP_GUIDE.md`

## 🆘 Need Help?

**Common Commands:**

```bash
# View all portfolios
curl http://localhost:3000/api/portfolios/manage

# View single portfolio
curl http://localhost:3000/api/portfolios/manage?id=your_id

# Update portfolio
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{"id": "your_id", "name": "New Name"}'

# Delete portfolio
curl -X DELETE http://localhost:3000/api/portfolios/manage?id=your_id

# Trigger rebalance
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId": "your_id"}'

# Check scheduler
curl http://localhost:3000/api/scheduler

# View prices
curl http://localhost:3000/api/kraken/prices?symbols=XXBTZEUR,XETHZEUR

# View balance
curl http://localhost:3000/api/kraken/balance
```

---

**Happy Trading! 🚀**

