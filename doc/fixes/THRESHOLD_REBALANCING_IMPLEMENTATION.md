# Threshold-Based Rebalancing Implementation

## Overview
This document describes the implementation of threshold-based rebalancing for the Kraken Portfolio Rebalancer. Unlike time-based rebalancing (daily, weekly, etc.), threshold-based rebalancing triggers automatically when any asset deviates from its target allocation by a specified percentage.

## Key Concepts

### Time-Based vs Threshold-Based Rebalancing

**Time-Based Rebalancing** (existing feature):
- Runs on a schedule (daily, weekly, monthly, etc.)
- Rebalances at fixed intervals regardless of portfolio drift
- Example: Weekly rebalancing every Monday

**Threshold-Based Rebalancing** (new feature):
- Monitors portfolio continuously
- Triggers immediately when deviation exceeds threshold
- Example: Rebalance when BTC drifts from 40% target to 35% or 45% (5% threshold)

### How It Works

1. **Deviation Calculation**: For each asset, calculate the difference between current percentage and target percentage
2. **Threshold Check**: Compare maximum deviation against threshold setting
3. **Automatic Trigger**: If max deviation ≥ threshold percentage, trigger rebalancing immediately
4. **Independent Operation**: Works independently from time-based rebalancing (can use both or either)

## Features Implemented

### 1. Database Schema

Added two new fields to the `Portfolio` model:

```prisma
thresholdRebalanceEnabled    Boolean  @default(false)
thresholdRebalancePercentage Float    @default(5.0)
```

- `thresholdRebalanceEnabled`: Enable/disable threshold-based rebalancing
- `thresholdRebalancePercentage`: Deviation threshold in percentage points (e.g., 5%)

### 2. Portfolio Creation & Edit Pages

**Locations:**
- `app/dashboard/new/page.tsx` (Create Portfolio)
- `app/dashboard/[id]/edit/page.tsx` (Edit Portfolio)

**New UI Components:**
- **Threshold-Based Rebalancing Section**: Separate from time-based settings with clear visual separation (divider)
- **Enable/Disable Toggle**: Button to activate threshold rebalancing
- **Deviation Threshold Input**: Number input for percentage (0.1% - 100%)
- **Informational Note**: Blue info box explaining how threshold rebalancing works
- **Real-time Feedback**: Dynamic text showing the threshold value in the explanation

### 3. API Endpoints

#### Check Threshold Endpoint
**Location:** `app/api/portfolios/[id]/check-threshold/route.ts`

**Purpose:** Check if a portfolio has breached its threshold

**GET** `/api/portfolios/[id]/check-threshold`

**Response:**
```typescript
{
  portfolioId: string;
  thresholdBreached: boolean;
  maxDeviation: number;
  thresholdPercentage: number;
  deviations: Array<{
    symbol: string;
    currentPercentage: number;
    targetPercentage: number;
    deviation: number;
  }>;
  totalValue: number;
  timestamp: string;
}
```

**Features:**
- Fetches current balances from Kraken
- Calculates asset values and percentages
- Computes deviation for each asset
- Determines if threshold is breached

#### Rebalance If Needed Endpoint
**Location:** `app/api/portfolios/[id]/rebalance-if-needed/route.ts`

**Purpose:** Check threshold and trigger rebalancing if needed

**POST** `/api/portfolios/[id]/rebalance-if-needed`

**Request Body:**
```typescript
{
  dryRun?: boolean; // Preview without executing
}
```

**Response:**
```typescript
{
  thresholdBreached: boolean;
  rebalanceTriggered: boolean;
  maxDeviation: number;
  thresholdPercentage: number;
  result?: RebalanceResult; // If rebalancing was triggered
}
```

**Features:**
- Calls check-threshold endpoint
- If threshold breached, triggers rebalancing automatically
- Updates database with rebalance history
- Marks triggeredBy as "threshold" for tracking
- Supports dry-run mode for testing

### 4. TypeScript Types

Updated types in `store/portfolio-store.ts`:

```typescript
interface DBPortfolio {
  // ... existing fields
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
}

interface CreatePortfolioData {
  // ... existing fields
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
}

interface UpdatePortfolioData {
  // ... existing fields
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
}
```

## Usage Guide

### Setting Up Threshold Rebalancing

#### During Portfolio Creation

1. Navigate to **"Create New Portfolio"**
2. Configure assets and target allocation
3. In the **"Rebalancing Settings"** card:
   - Scroll past time-based rebalancing settings
   - Find **"Threshold-Based Rebalancing"** section (after divider)
4. Click **"Enabled"** button
5. Set **"Deviation Threshold (%)"**:
   - **Conservative**: 2-3% (rebalances more frequently)
   - **Moderate**: 5% (default, balanced approach)
   - **Aggressive**: 8-10% (rebalances less frequently, allows more drift)
6. Review the informational note
7. Create portfolio

#### For Existing Portfolios

1. Click **"Edit"** on your portfolio dashboard
2. Scroll to **"Rebalancing Settings"**
3. Enable **"Threshold-Based Rebalancing"**
4. Set desired deviation threshold
5. Click **"Update Portfolio"**

### How Threshold Rebalancing Triggers

#### Automatic Monitoring
To check if rebalancing is needed, call the API endpoint:

```bash
curl GET https://your-domain/api/portfolios/[id]/check-threshold
```

This can be integrated into:
- A cron job that runs every X minutes/hours
- A background worker
- Your frontend dashboard (polling)

#### Manual Trigger
To manually check and trigger rebalancing:

```bash
curl POST https://your-domain/api/portfolios/[id]/rebalance-if-needed
Content-Type: application/json

{
  "dryRun": false
}
```

## Examples

### Example 1: Conservative Threshold (2%)

**Portfolio Setup:**
- Target: BTC 40%, ETH 30%, SOL 20%, ADA 10%
- Threshold: 2%
- Total Value: €10,000

**Scenario:**
- BTC price increases significantly
- Current allocation becomes: BTC 42.5%, ETH 28%, SOL 18%, ADA 11.5%
- BTC deviation: 42.5% - 40% = 2.5% ✓ **Threshold breached!**
- Rebalancing triggers automatically

**Result:**
- Sells some BTC to buy other assets
- Brings portfolio back to 40/30/20/10 target

### Example 2: Moderate Threshold (5%)

**Portfolio Setup:**
- Target: BTC 50%, ETH 50%
- Threshold: 5%
- Total Value: €20,000

**Scenario 1 - No Trigger:**
- Current: BTC 53%, ETH 47%
- Deviation: 3% (below 5% threshold)
- **No rebalancing** ✗

**Scenario 2 - Trigger:**
- Current: BTC 56%, ETH 44%
- Deviation: 6% (above 5% threshold)
- **Rebalancing triggered** ✓

### Example 3: Combining Both Methods

**Portfolio Setup:**
- Time-based: Weekly rebalancing (enabled)
- Threshold-based: 5% deviation (enabled)

**Behavior:**
- **Week 1, Day 1**: Portfolio drifts 6% → Threshold rebalance ✓
- **Week 1, Day 3**: Portfolio drifts 3% → No action (under threshold)
- **Week 1, Day 7**: Weekly rebalance ✓ (scheduled)
- **Week 2, Day 2**: Portfolio drifts 5.5% → Threshold rebalance ✓

**Result:** Portfolio stays closer to target with both methods active

## Best Practices

### Choosing the Right Threshold

| Threshold | Use Case | Frequency | Pros | Cons |
|-----------|----------|-----------|------|------|
| 1-2% | High precision | Very frequent | Very tight tracking | Higher trading fees |
| 3-5% | Balanced | Moderate | Good balance | Moderate fees |
| 6-8% | Relaxed | Less frequent | Lower fees | More portfolio drift |
| 10%+ | Hands-off | Rare | Minimal fees | Significant drift allowed |

### Recommendations

1. **Start with 5%**: Good default for most portfolios
2. **Consider portfolio size**:
   - Larger portfolios (€50k+): Can use tighter thresholds (2-3%)
   - Smaller portfolios (<€10k): Use wider thresholds (5-8%) to minimize fees
3. **Match with order type**:
   - Limit orders (maker): Can use tighter thresholds (lower fees)
   - Market orders (taker): Use wider thresholds (higher per-trade fees)
4. **Volatile assets**: Use wider thresholds (7-10%) to avoid excessive rebalancing
5. **Stable allocations**: Can use tighter thresholds (3-4%)

### Monitoring Setup

For production use, set up automated monitoring:

```typescript
// Example: Check threshold every hour
setInterval(async () => {
  const response = await fetch(`/api/portfolios/${portfolioId}/rebalance-if-needed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun: false }),
  });
  
  const result = await response.json();
  
  if (result.rebalanceTriggered) {
    console.log(`Threshold rebalance triggered! Deviation: ${result.maxDeviation}%`);
    // Send notification, log event, etc.
  }
}, 3600000); // Every hour
```

## Technical Details

### Deviation Calculation

```typescript
// For each asset:
currentPercentage = (currentValue / totalPortfolioValue) * 100
deviation = Math.abs(currentPercentage - targetPercentage)

// Check threshold:
maxDeviation = Math.max(...deviations)
thresholdBreached = maxDeviation >= thresholdPercentage
```

### Order of Operations

1. **Check Enabled**: Verify `thresholdRebalanceEnabled === true`
2. **Fetch Balances**: Get current holdings from Kraken
3. **Get Prices**: Fetch latest prices for all assets
4. **Calculate Values**: Compute current portfolio value and percentages
5. **Compute Deviations**: Calculate deviation for each asset
6. **Compare Threshold**: Check if max deviation ≥ threshold
7. **Trigger Rebalance**: If breached, execute rebalancing
8. **Record History**: Save to database with `triggeredBy: 'threshold'`

### Database Records

Threshold-triggered rebalances are stored in `RebalanceHistory` with:
- `triggeredBy: 'threshold'` (vs 'scheduler' or 'manual')
- All standard rebalancing metrics (fees, orders, values)
- Can be filtered/analyzed separately

## Troubleshooting

### Threshold Not Triggering

**Problem**: Threshold is breached but rebalancing doesn't trigger

**Solutions**:
1. Verify `thresholdRebalanceEnabled` is `true` in database
2. Check API endpoint is being called
3. Ensure user has valid Kraken API credentials
4. Review console logs for errors

### Too Frequent Rebalancing

**Problem**: Portfolio rebalances too often

**Solutions**:
1. Increase threshold percentage (e.g., 3% → 6%)
2. Reduce monitoring frequency (e.g., every 4 hours instead of hourly)
3. Use limit orders (maker) instead of market orders to reduce fee impact
4. Consider disabling time-based rebalancing if using threshold-based

### Not Rebalancing Enough

**Problem**: Portfolio drifts significantly before rebalancing

**Solutions**:
1. Decrease threshold percentage (e.g., 7% → 4%)
2. Increase monitoring frequency
3. Verify monitoring service is running
4. Check for errors in API calls

## Future Enhancements

Potential improvements:
1. **Per-Asset Thresholds**: Different thresholds for different assets
2. **Time-of-Day Restrictions**: Only rebalance during specific hours
3. **Cooldown Period**: Minimum time between threshold rebalances
4. **Dashboard Indicator**: Real-time threshold status on dashboard
5. **Push Notifications**: Alert when threshold is breached
6. **Historical Analytics**: Chart showing threshold breaches over time
7. **Smart Thresholds**: AI-suggested thresholds based on asset volatility

## Testing

### Test Scenarios

1. **Basic Threshold Breach**:
   - Create portfolio with 5% threshold
   - Manually adjust one asset to trigger 6% deviation
   - Verify rebalancing triggers

2. **Below Threshold**:
   - Create portfolio with 5% threshold
   - Ensure deviation is 3-4%
   - Verify NO rebalancing occurs

3. **Dry Run Mode**:
   - Call with `dryRun: true`
   - Verify no actual trades execute
   - Check preview data is returned

4. **Disabled Threshold**:
   - Set `thresholdRebalanceEnabled: false`
   - Verify threshold checks return immediately
   - Ensure no rebalancing occurs

---

**Implementation Date:** October 22, 2024  
**Version:** 1.0.0  
**Status:** ✅ Complete

