# Rebalance Fix Summary

## ✅ Problem Solved

**Issue**: When clicking the "Rebalance Now" button on the dashboard, the rebalancing would fail silently or do nothing because the scheduler wasn't passing the user's ID to the rebalancing function, which meant it couldn't access the Kraken API credentials.

**Root Cause**: The `rebalancePortfolio` function requires a `userId` parameter to fetch the user's Kraken API credentials from the database. The scheduler's `triggerManualRebalance` function was calling the rebalance logic without passing the `userId`.

## 📝 Files Modified

### `lib/scheduler.ts`
- **Updated `rebalancePortfolioScheduled` function** to include `userId` in the portfolio type signature
- **Added validation** to check if portfolio has userId before attempting rebalance
- **Pass userId** to `rebalancePortfolio` function call
- **Updated `checkAndRebalancePortfolios`** to fetch userId from database
- **Updated `triggerManualRebalance`** to include userId in database query and validate it exists

## 🔧 Technical Details

### Before Fix

```typescript
// Scheduler was calling rebalancePortfolio without userId
const result = await rebalancePortfolio(portfolio.id, {
  targetWeights,
  rebalanceThreshold: portfolio.rebalanceThreshold,
  maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
  dryRun: this.config.dryRunMode,
});
```

This would fail in the rebalance logic because:
```typescript
// In lib/rebalance.ts
if (!config?.userId) {
  const error = 'User ID is required for rebalancing';
  logger.error(error);
  errors.push(error);
  return result; // Returns empty result
}
```

### After Fix

```typescript
// Scheduler now fetches userId from database
const portfolio = await prisma.portfolio.findUnique({
  where: { id: portfolioId },
  select: {
    id: true,
    name: true,
    userId: true, // Now included!
    targetWeights: true,
    rebalanceThreshold: true,
    maxOrdersPerRebalance: true,
    rebalanceInterval: true,
  },
});

// Validates userId exists
if (!portfolio.userId) {
  throw new Error('Portfolio does not have a userId assigned. Cannot access Kraken credentials.');
}

// Passes userId to rebalancePortfolio
const result = await rebalancePortfolio(portfolio.id, {
  userId: portfolio.userId, // Now provided!
  portfolioId: portfolio.id,
  targetWeights,
  rebalanceThreshold: portfolio.rebalanceThreshold,
  maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
  dryRun: this.config.dryRunMode,
});
```

## 🎯 How It Works Now

### Rebalancing Flow

1. **User clicks "Rebalance Now"** on the dashboard
2. **Confirmation dialog** appears
3. **User confirms** → triggers `triggerRebalance(portfolioId)`
4. **API call** to `/api/scheduler/trigger` with portfolioId
5. **Scheduler fetches portfolio** including userId from database
6. **Validates userId** exists (throws error if not)
7. **Calls rebalancePortfolio** with all required params including userId
8. **Gets user's Kraken credentials** from database using userId
9. **Fetches balances and prices** from Kraken API
10. **Calculates rebalance orders** needed
11. **Executes trades** on Kraken (or dry-run)
12. **Updates portfolio** lastRebalancedAt timestamp
13. **Saves history** to database
14. **Returns success** to user with toast notification

## ✨ Improvements Made

1. **Better Error Handling**: Now throws clear error if portfolio doesn't have userId
2. **Database Query Optimization**: Only fetches fields needed for rebalancing
3. **Validation**: Checks for userId before attempting expensive operations
4. **Type Safety**: Updated TypeScript types to include userId
5. **Filtering**: Automatic scheduler only processes portfolios with userId

## 🧪 How to Test

### Test 1: Manual Rebalance from Dashboard

1. **Login** to your account
2. **Go to Dashboard**
3. **View a portfolio** that needs rebalancing
4. **Click "Rebalance Now"**
5. **Confirm** in the dialog
6. **Expected Result**: 
   - Loading toast appears
   - Rebalancing executes successfully
   - Success toast shows "Portfolio rebalanced successfully!"
   - Last Rebalanced date updates

### Test 2: Check Browser Console

Open browser console (F12) and look for logs:
```
[Scheduler] Manual rebalance triggered for portfolio: abc123
[Rebalance:abc123] INFO: Starting portfolio rebalance
[Rebalance:abc123] SUCCESS: User Kraken client initialized
[Rebalance:abc123] INFO: Retrieved balance
[Rebalance:abc123] SUCCESS: Portfolio rebalanced successfully!
```

### Test 3: Check API Response

You can also test the API directly:
```bash
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"your-portfolio-id"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Manual rebalance triggered for portfolio your-portfolio-id"
}
```

## ⚠️ Prerequisites

For rebalancing to work, you need:

1. **Kraken API Credentials** configured in your profile:
   - Go to Profile page
   - Add your Kraken API Key and API Secret
   - Keys must have permission to:
     - Query Funds (to check balances)
     - Create & Modify Orders (to execute trades)
     - Query Open/Closed Orders (to verify execution)

2. **Portfolio with Assets**: Your portfolio must have:
   - Target weights defined
   - Assets available in your Kraken account
   - Sufficient balance to rebalance

3. **Network Connection**: Kraken API must be accessible

## 🚨 Troubleshooting

### Error: "Portfolio does not have a userId assigned"
**Solution**: This shouldn't happen with new portfolios, but if you have old test data:
- Delete the portfolio and create a new one while logged in
- Or manually update the database to set userId

### Error: "Credentials not configured"
**Solution**: 
- Go to Profile page
- Add your Kraken API credentials
- Make sure they're saved successfully

### Error: "Failed to trigger rebalance" 
**Solution**: 
- Check browser console for detailed error
- Verify your Kraken API credentials are valid
- Check that you have sufficient balance
- Ensure assets in portfolio exist on Kraken

### Rebalancing shows "No orders needed"
**Explanation**: This means your portfolio is already balanced within the threshold
- Check the "Difference" column in the holdings table
- If all differences are < 5%, no rebalancing is needed
- You can adjust the rebalance threshold in portfolio settings

## 📊 What Gets Rebalanced?

The rebalancing logic will:

1. **Calculate current allocation** based on live prices
2. **Compare to target allocation** from your portfolio settings
3. **Generate orders** for assets that differ by more than threshold (default: 5%)
4. **Execute trades** to bring portfolio back to target
5. **Respect limits** like max orders per rebalance

### Example:

**Target Allocation:**
- BTC: 40%
- ETH: 30%
- ADA: 20%
- SOL: 10%

**Current Allocation:**
- BTC: 35% (need to buy)
- ETH: 28% (need to buy)
- ADA: 25% (need to sell)
- SOL: 12% (need to sell)

**Result**: Creates 4 orders to rebalance

## 🎉 Conclusion

The rebalancing functionality is now fully working! The fix ensures that:
- ✅ User credentials are properly passed to rebalancing logic
- ✅ Clear error messages if something goes wrong
- ✅ Better validation before expensive operations
- ✅ Both manual and automatic rebalancing work correctly

**Try it now**: Go to your dashboard and click "Rebalance Now"!

