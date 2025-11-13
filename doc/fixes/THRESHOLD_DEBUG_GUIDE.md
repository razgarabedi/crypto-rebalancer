# Threshold Rebalancing - Debugging Guide

## Issue: Threshold Not Triggering Despite Deviations

If your portfolio has deviations exceeding the threshold but rebalancing isn't triggering, follow this guide.

## Step 1: Verify Portfolio Settings

Check your portfolio database settings:

```bash
# In your database, check the portfolio
# Make sure these fields are set:
thresholdRebalanceEnabled: true
thresholdRebalancePercentage: 10 (or your desired threshold)
```

## Step 2: Test Threshold Detection

Use the test script to verify the threshold check works:

```bash
# Get your portfolio ID from the dashboard URL or database
# Then run:
npx tsx scripts/test-threshold.ts <your-portfolio-id>
```

**Example Output**:
```
🔍 Testing threshold rebalancing for portfolio: cm2abc123xyz

📊 Portfolio: My Crypto Portfolio
   ID: cm2abc123xyz
   Threshold Enabled: true
   Threshold Percentage: 10%
   Min Trade Size: €10

🎯 Target Allocation:
   BTC: 40%
   ETH: 30%
   ADA: 30%

💰 Total Portfolio Value: €5000.00

📈 Current Allocation vs Target:

Asset  | Current | Target | Deviation | Status
-------|---------|--------|-----------|--------
BTC    |  55.44% |  40.00% |   15.44% | ❌ EXCEEDS
ETH    |  30.00% |  30.00% |    0.00% | ✅ OK
ADA    |  19.59% |  30.00% |   10.41% | ❌ EXCEEDS

============================================================

🚨 THRESHOLD EXCEEDED - REBALANCING NEEDED
   Threshold: 10%
   Max Deviation: 15.44%

   Assets exceeding threshold:
   - BTC: +15.44% (15.44% deviation)
   - ADA: -10.41% (10.41% deviation)

✅ This portfolio SHOULD trigger automatic rebalancing
```

## Step 3: Check Scheduler Status

The scheduler only runs automatically in **production mode**.

### In Development Mode (NODE_ENV=development)

The scheduler is **NOT running** by default. You have two options:

**Option A: Manually Start the Scheduler**

```bash
# Start the scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# Check scheduler status
curl http://localhost:3000/api/scheduler
```

**Option B: Manually Trigger Threshold Check**

```bash
# Trigger threshold check for specific portfolio
curl -X POST http://localhost:3000/api/portfolios/<portfolio-id>/rebalance-if-needed \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Without dryRun to actually execute
curl -X POST http://localhost:3000/api/portfolios/<portfolio-id>/rebalance-if-needed \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

### In Production Mode (NODE_ENV=production)

The scheduler starts automatically and checks every hour.

```bash
# Check if scheduler is running
curl http://localhost:3000/api/scheduler

# Should return:
{
  "enabled": true,
  "isRunning": true,
  "checkInterval": "0 * * * *",
  "dryRunMode": false
}
```

## Step 4: Enable Scheduler in Development

If you want the scheduler to run automatically in development:

**Method 1: Environment Variable**
```bash
# In your .env or .env.local file
NODE_ENV=production
```

**Method 2: Force Start**
```bash
# Set auto-start environment variable
SCHEDULER_AUTO_START=true
```

**Method 3: Manual Start via API**
```bash
# Start scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

## Step 5: Monitor Scheduler Logs

Once the scheduler is running, you should see logs:

```
[Scheduler] Starting scheduler...
[Scheduler] Check interval: 0 * * * *
[Scheduler] Dry run mode: false
[Scheduler] Scheduler started successfully
[Scheduler] Checking portfolios for rebalancing...
[Scheduler] Found 0 time-based and 1 threshold-based portfolio(s) to check
[Scheduler] Checking threshold portfolio: My Crypto Portfolio (cm2abc123xyz)
[Scheduler] BTC exceeds threshold: Current 55.44% vs Target 40% (Deviation: 15.44%)
[Scheduler] ADA exceeds threshold: Current 19.59% vs Target 30% (Deviation: 10.41%)
[Scheduler] Threshold exceeded - triggering rebalance for My Crypto Portfolio
[Scheduler] Threshold rebalance completed for My Crypto Portfolio (3/3 orders)
```

## Common Issues

### Issue 1: "thresholdRebalanceEnabled is false"

**Fix**: Edit your portfolio and enable "Threshold-Based Rebalancing"

1. Go to Dashboard
2. Click "Edit" on your portfolio
3. Scroll to "Rebalancing Settings"
4. Enable "Threshold-Based Rebalancing"
5. Set deviation threshold (e.g., 10%)
6. Save

### Issue 2: "Scheduler not running in development"

**Fix**: Start the scheduler manually

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

### Issue 3: "No deviations detected"

**Fix**: Verify the test script shows deviations

```bash
npx tsx scripts/test-threshold.ts <portfolio-id>
```

If the script shows deviations but scheduler doesn't detect them, restart the scheduler:

```bash
# Restart scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"restart"}'
```

### Issue 4: "Scheduler runs but doesn't trigger"

**Check**:
1. Are you in dry-run mode?
2. Check scheduler status: `curl http://localhost:3000/api/scheduler`
3. If `dryRunMode: true`, update config:

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"update-config","config":{"dryRunMode":false}}'
```

## Quick Checklist

✅ Portfolio has `thresholdRebalanceEnabled: true`
✅ Portfolio has `thresholdRebalancePercentage` set (e.g., 10)
✅ Test script shows deviations exceeding threshold
✅ Scheduler is running (check API or logs)
✅ Scheduler is NOT in dry-run mode (unless testing)
✅ Check logs for threshold detection messages

## Manual Trigger for Testing

While debugging, you can manually trigger threshold rebalancing:

```bash
# Check if threshold is breached
curl http://localhost:3000/api/portfolios/<portfolio-id>/check-threshold

# Trigger rebalancing if needed (dry-run)
curl -X POST http://localhost:3000/api/portfolios/<portfolio-id>/rebalance-if-needed \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Actually execute rebalancing
curl -X POST http://localhost:3000/api/portfolios/<portfolio-id>/rebalance-if-needed \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

## Summary

The most common issue is that **the scheduler is not running in development mode**.

**Quick Fix**:
1. Start the scheduler: `curl -X POST http://localhost:3000/api/scheduler -H "Content-Type: application/json" -d '{"action":"start"}'`
2. Or manually trigger: `curl -X POST http://localhost:3000/api/portfolios/<id>/rebalance-if-needed -H "Content-Type: application/json" -d '{"dryRun":false}'`

For production deployment, the scheduler will start automatically and check every hour.

---

**Need Help?**
1. Run test script: `npx tsx scripts/test-threshold.ts <portfolio-id>`
2. Check scheduler status: `curl http://localhost:3000/api/scheduler`
3. View server logs for detailed information

