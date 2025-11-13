# Threshold Deviation Calculation Fix

## Issue Found

The threshold deviation check was only comparing **current holdings** against target weights, but it was missing assets that should be in the portfolio but aren't currently held (0% allocation).

### Example of the Bug

**Target Allocation**:
- BTC: 40%
- ETH: 30%
- ADA: 30%

**Current Allocation** (if you sold all ADA):
- BTC: 60%
- ETH: 40%
- ADA: 0% (not in holdings)

**Old Behavior** ❌:
- Only checked BTC (60% vs 40% = 20% deviation) ✓ Triggers
- Only checked ETH (40% vs 30% = 10% deviation) ✓ Triggers
- **Did NOT check ADA** (0% vs 30% = 30% deviation) ✗ MISSED!

**New Behavior** ✅:
- Checks BTC (60% vs 40% = 20% deviation) ✓
- Checks ETH (40% vs 30% = 10% deviation) ✓
- **Checks ADA** (0% vs 30% = 30% deviation) ✓
- Correctly triggers rebalancing!

## The Fix

Changed the logic to iterate through **target weights** instead of **current holdings**:

### Before (Incorrect):
```typescript
currentPortfolio.holdings.forEach(holding => {
  const target = targetWeights[holding.symbol] || 0;
  const deviation = Math.abs(holding.percentage - target);
  // This missed assets not in holdings!
});
```

### After (Correct):
```typescript
for (const [symbol, targetPct] of Object.entries(targetWeights)) {
  const holding = currentPortfolio.holdings.find(h => h.symbol === symbol);
  const currentPct = holding ? holding.percentage : 0; // ← Handles missing assets!
  const deviation = Math.abs(currentPct - targetPct);
  // Now catches ALL deviations!
}
```

## What This Means

The threshold rebalancing now correctly detects when:

1. ✅ An asset has **more** than target (e.g., BTC at 50% when target is 40%)
2. ✅ An asset has **less** than target (e.g., ETH at 20% when target is 30%)
3. ✅ An asset is **missing** entirely (e.g., ADA at 0% when target is 30%)
4. ✅ Any combination of the above

## Example Scenarios

### Scenario 1: Asset Overweight
**Target**: BTC 40%, ETH 30%, ADA 30%
**Current**: BTC 55%, ETH 25%, ADA 20%
**Deviations**:
- BTC: 15% over target ✓
- ETH: 5% under target ✓
- ADA: 10% under target ✓

If threshold = 5%, **BTC and ADA trigger rebalancing**

### Scenario 2: Asset Missing
**Target**: BTC 40%, ETH 30%, ADA 30%
**Current**: BTC 70%, ETH 30%, ADA 0%
**Deviations**:
- BTC: 30% over target ✓
- ETH: 0% (on target) ✓
- ADA: 30% under target ✓ (NOW DETECTED!)

If threshold = 5%, **BTC and ADA trigger rebalancing**

### Scenario 3: Multiple Assets Out of Balance
**Target**: BTC 25%, ETH 25%, SOL 25%, ADA 25%
**Current**: BTC 40%, ETH 35%, SOL 15%, ADA 10%
**Deviations**:
- BTC: 15% over ✓
- ETH: 10% over ✓
- SOL: 10% under ✓
- ADA: 15% under ✓

If threshold = 5%, **ALL assets trigger rebalancing**

## Files Updated

1. **`lib/scheduler.ts`** - Fixed threshold check in scheduler
2. **`app/api/portfolios/[id]/check-threshold/route.ts`** - Fixed threshold check API

## Testing

### Test Case 1: Missing Asset
```bash
# Create portfolio with BTC, ETH, ADA at 33% each
# Sell all ADA
# ADA should be at 0% vs target 33% = 33% deviation
# With 5% threshold, this should trigger rebalancing
```

### Test Case 2: Multiple Deviations
```bash
# Create portfolio with 4 assets at 25% each
# Let market move them to: 30%, 28%, 25%, 17%
# Deviations: 5%, 3%, 0%, 8%
# With 5% threshold, assets with 5% and 8% should trigger
```

### Manual API Test
```bash
# Check threshold status
curl http://localhost:3000/api/portfolios/[id]/check-threshold

# Response shows ALL target assets with their deviations
{
  "thresholdBreached": true,
  "maxDeviation": 30,
  "deviations": [
    { "symbol": "BTC", "currentPercentage": 70, "targetPercentage": 40, "deviation": 30 },
    { "symbol": "ETH", "currentPercentage": 30, "targetPercentage": 30, "deviation": 0 },
    { "symbol": "ADA", "currentPercentage": 0, "targetPercentage": 30, "deviation": 30 }
  ]
}
```

## Impact

This fix ensures that threshold-based rebalancing works correctly for:
- ✅ Assets that are overweight
- ✅ Assets that are underweight
- ✅ Assets that are missing from current holdings
- ✅ Any percentage deviation in either direction

The system will now properly maintain your target allocation regardless of which direction assets drift!

---

**Fix Date**: October 22, 2025
**Status**: ✅ Complete

