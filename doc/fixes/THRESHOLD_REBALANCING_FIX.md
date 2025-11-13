# Threshold-Based Rebalancing - Bug Fix Summary

## Issues Fixed

### 1. Threshold Rebalancing Not Working Automatically ✅

**Problem**: Threshold-based rebalancing was not triggering automatically when coins reached their deviation threshold.

**Root Cause**: The scheduler (`lib/scheduler.ts`) only checked for time-based rebalancing portfolios. It did not check for threshold-based portfolios.

**Solution**:
- Updated `checkAndRebalancePortfolios()` to query for both time-based AND threshold-based portfolios
- Added new method `checkAndRebalanceThresholdPortfolio()` that:
  - Fetches current portfolio holdings from Kraken
  - Fetches current prices
  - Calculates each asset's deviation from target percentage
  - Triggers rebalancing if ANY asset exceeds the configured threshold percentage
  - Logs which assets triggered the rebalance

**How It Works Now**:
```
Scheduler runs every hour (configurable)
├─ Check time-based portfolios (rebalanceEnabled: true)
│  └─ Execute if nextRebalanceAt <= now
└─ Check threshold-based portfolios (thresholdRebalanceEnabled: true)
   └─ Calculate deviations for each asset
   └─ Execute if any deviation >= thresholdRebalancePercentage
```

### 2. Dashboard Not Showing Rebalancing Strategy ✅

**Problem**: The dashboard didn't clearly indicate which rebalancing strategy was active (Time-Based, Threshold-Based, or Both).

**Solution**:
- Added new **"Rebalancing Strategy"** card to dashboard
- Displays strategy type: "Time-Based", "Threshold", "Both", or "Manual"
- Shows relevant settings:
  - Time-Based: ⏱️ interval (daily/weekly/monthly)
  - Threshold: 📊 deviation percentage
  - Both: Shows both settings
- Updated "Last Rebalanced" card to indicate next rebalance method

**Dashboard Display Examples**:

| Strategy | Display | Settings Shown |
|----------|---------|----------------|
| Time-Based Only | "Time-Based" | ⏱️ weekly |
| Threshold Only | "Threshold" | 📊 5% deviation |
| Both Enabled | "Both" | ⏱️ weekly + 📊 5% deviation |
| Neither | "Manual" | Manual rebalancing only |

## Technical Changes

### Files Modified

1. **`lib/scheduler.ts`**
   - Added `checkAndRebalanceThresholdPortfolio()` method
   - Modified `checkAndRebalancePortfolios()` to query both types
   - Added imports for rebalancing helper functions
   - Logs detailed information about threshold breaches

2. **`lib/rebalance.ts`**
   - Exported `normalizeAssetSymbol()` function
   - Exported `getTradingPair()` function
   - These are now used by the scheduler for threshold checks

3. **`app/dashboard/page.tsx`**
   - Added "Rebalancing Strategy" card
   - Updated grid layout from 2 columns to 3 columns
   - Shows strategy type and settings
   - Dynamic display based on enabled options

## How Threshold Rebalancing Works

### Configuration
- **Enable**: Set `thresholdRebalanceEnabled: true` in portfolio settings
- **Threshold**: Set `thresholdRebalancePercentage` (e.g., 5 = 5% deviation)

### Trigger Logic
The scheduler checks every hour:

1. **Fetch Current Holdings**: Gets actual balances from Kraken
2. **Calculate Current Percentages**: Determines actual allocation
3. **Compare to Targets**: Calculates deviation for each asset
4. **Check Threshold**: If ANY asset's deviation >= threshold, trigger rebalance

### Example

**Portfolio Configuration**:
- Target: BTC 40%, ETH 30%, ADA 30%
- Threshold: 5% deviation
- Strategy: Threshold-based

**Current State**:
- BTC: 46% (deviation: 6% ✗ exceeds threshold!)
- ETH: 29% (deviation: 1% ✓ within threshold)
- ADA: 25% (deviation: 5% ✓ at threshold limit)

**Result**: Rebalancing triggered because BTC deviation (6%) exceeds threshold (5%)

**Logs**:
```
[Scheduler] Checking threshold portfolio: My Portfolio (abc123)
[Scheduler] BTC exceeds threshold: Current 46.00% vs Target 40% (Deviation: 6.00%)
[Scheduler] Threshold exceeded - triggering rebalance for My Portfolio
[Scheduler] Threshold rebalance completed for My Portfolio (3/3 orders)
```

## Scheduler Behavior

### Check Interval
- Default: Every hour (`0 * * * *` cron expression)
- Configurable in scheduler initialization

### What Happens Each Check

1. **Time-Based Portfolios**: 
   - Checked if `nextRebalanceAt <= now`
   - Triggered by: daily/weekly/monthly schedule

2. **Threshold-Based Portfolios**:
   - Always checked when scheduler runs
   - Triggered by: deviation exceeding threshold
   - No time restriction - triggers whenever threshold is breached

3. **Both Enabled**:
   - Portfolio can be rebalanced by either trigger
   - Whichever condition is met first

### History Tracking
Rebalances are logged with `triggeredBy` field:
- `"scheduler"` - Time-based rebalancing
- `"threshold"` - Threshold-based rebalancing  
- `"manual"` - User-triggered

## Testing

### Test Threshold Rebalancing

1. **Create a Threshold-Based Portfolio**:
   - Navigate to Dashboard → Create Portfolio
   - Enable "Threshold-Based Rebalancing"
   - Set deviation threshold (e.g., 5%)
   - Create portfolio

2. **Wait for Market Movement**:
   - The scheduler checks hourly
   - When any asset deviates >= threshold, rebalancing triggers

3. **Monitor Logs**:
   ```bash
   # Check server logs for threshold checks
   [Scheduler] Checking threshold portfolio: My Portfolio
   [Scheduler] BTC exceeds threshold: Current X% vs Target Y%
   [Scheduler] Threshold exceeded - triggering rebalance
   ```

4. **View Dashboard**:
   - Check "Rebalancing Strategy" card
   - Should show "Threshold" with configured percentage
   - "Last Rebalanced" updates after execution

### Manual Testing

You can manually trigger threshold checks via API:

```bash
# Check if threshold is breached (dry-run)
curl -X GET '/api/portfolios/[id]/check-threshold'

# Trigger rebalance if needed
curl -X POST '/api/portfolios/[id]/rebalance-if-needed' \
  -H 'Content-Type: application/json' \
  -d '{"dryRun": true}'
```

## Configuration Examples

### Threshold Only
```typescript
{
  rebalanceEnabled: false,
  thresholdRebalanceEnabled: true,
  thresholdRebalancePercentage: 5,
}
```
✅ Rebalances only when deviation >= 5%
✅ No time-based scheduling

### Time-Based Only
```typescript
{
  rebalanceEnabled: true,
  rebalanceInterval: "weekly",
  thresholdRebalanceEnabled: false,
}
```
✅ Rebalances every week
✅ No threshold checking

### Both Strategies
```typescript
{
  rebalanceEnabled: true,
  rebalanceInterval: "monthly",
  thresholdRebalanceEnabled: true,
  thresholdRebalancePercentage: 10,
}
```
✅ Rebalances monthly OR when deviation >= 10%
✅ Whichever happens first

### Manual Only
```typescript
{
  rebalanceEnabled: false,
  thresholdRebalanceEnabled: false,
}
```
✅ No automatic rebalancing
✅ User must trigger manually

## Performance Considerations

### Scheduler Load
- **Time-Based**: Minimal - simple date comparison
- **Threshold-Based**: Higher - requires:
  - Kraken API call for balances
  - Kraken API call for prices
  - Portfolio calculations

### Recommendations
- Use threshold percentage >= 3% to avoid excessive checks
- Consider combining with time-based (e.g., weekly + 10% threshold)
- Monitor Kraken API rate limits

## Benefits

### Threshold-Based Advantages
✅ Responds to market volatility automatically
✅ More precise than time-based rebalancing
✅ Prevents drift during high volatility
✅ Only rebalances when truly needed

### Combined Strategy Advantages
✅ Regular baseline rebalancing (time-based)
✅ Emergency rebalancing (threshold-based)
✅ Flexibility for different market conditions

## Troubleshooting

### Threshold Not Triggering

**Check**:
1. Is `thresholdRebalanceEnabled` true?
2. Is threshold percentage too high?
3. Are assets actually deviating enough?
4. Check scheduler logs for threshold checks

**Debug**:
```bash
# Check current deviations
curl '/api/portfolios/[id]/check-threshold'
```

### Dashboard Not Showing Strategy

**Check**:
1. Refresh the page
2. Ensure portfolio data is loaded
3. Check browser console for errors

**Verify**:
```javascript
// In browser console
console.log({
  thresholdEnabled: currentDBPortfolio.thresholdRebalanceEnabled,
  timeBasedEnabled: currentDBPortfolio.rebalanceEnabled,
  threshold: currentDBPortfolio.thresholdRebalancePercentage
});
```

## Conclusion

The threshold-based rebalancing feature is now fully functional:
- ✅ Automatically checks for deviations every hour
- ✅ Triggers rebalancing when ANY asset exceeds threshold
- ✅ Dashboard clearly shows active strategy
- ✅ Works independently or alongside time-based rebalancing
- ✅ Full logging and history tracking

The system is production-ready and will keep portfolios balanced based on actual market conditions, not just time intervals.

---

**Fix Date**: October 22, 2025
**Status**: ✅ Complete and Tested

