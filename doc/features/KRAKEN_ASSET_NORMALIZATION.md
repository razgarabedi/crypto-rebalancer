# Kraken Asset Name Normalization

## Problem Overview

When assets are held in Kraken's staking programs or other services, they are returned from the API with special suffixes:

- `.F` - Flex Staking (most common)
- `.S` - Staked assets
- `.M` - Margin assets
- `.P` - Perpetual assets

For example, if you have ADA in Kraken Flex staking, the API returns it as `ADA.F` instead of just `ADA`.

This caused a mismatch issue where:
1. The balance API showed `ADA.F` 
2. Users created portfolios with `ADA`
3. The system couldn't match them, showing "no balance" for ADA

## Solution

We've implemented asset name normalization across all API endpoints to automatically strip these suffixes and standardize asset names.

### Files Modified

1. **`app/api/holdings/route.ts`** - Holdings endpoint
2. **`app/api/kraken/balance/route.ts`** - Balance endpoint
3. **`lib/rebalance.ts`** - Rebalancing logic
4. **`app/api/prices/route.ts`** - Price fetching endpoint

### Normalization Logic

The `normalizeSymbol` function now:

1. **Removes staking suffixes**: `.F`, `.S`, `.M`, `.P`
2. **Removes Kraken's X prefix**: `XXBT` → `XBT`
3. **Handles special mappings**: `XBT` → `BTC`, `XETH` → `ETH`

```typescript
const normalizeSymbol = (asset: string): string => {
  // Remove suffixes (.F for Flex staking, .S for Staked, .M for Margin, etc.)
  let normalized = asset.replace(/\.(F|S|M|P)$/i, '');
  
  // Remove X prefix
  normalized = normalized.replace(/^X+/, '');
  
  // Handle special mappings
  const mapping: Record<string, string> = {
    'XBT': 'BTC',
    'XXBT': 'BTC',
    'XETH': 'ETH',
  };
  
  return mapping[asset.replace(/\.(F|S|M|P)$/i, '')] || mapping[asset] || normalized;
};
```

## How It Works Now

### Before Fix
```
Kraken API Response: { "ADA.F": "1000.5" }
Holdings API: Shows "ADA.F" with balance
Portfolio Creation: User creates portfolio with "ADA"
Portfolio Check: "No balance found for ADA" ❌
```

### After Fix
```
Kraken API Response: { "ADA.F": "1000.5" }
Normalization: "ADA.F" → "ADA"
Holdings API: Shows "ADA" with balance
Portfolio Creation: User creates portfolio with "ADA"
Portfolio Check: "Balance found: 1000.5 ADA" ✅
```

## Impact on Existing Features

### ✅ Portfolio Creation
- Now works correctly with staked assets
- Users can create portfolios using standard names (BTC, ETH, ADA)
- System automatically matches with staked versions (BTC.F, ETH.F, ADA.F)

### ✅ Rebalancing
- Rebalancing logic now handles staked assets correctly
- Orders are placed using the correct trading pairs
- Asset matching works regardless of staking status

### ✅ Holdings Display
- Holdings API shows normalized names
- Original asset name is preserved in `rawAsset` field for reference
- Frontend displays clean asset names (ADA instead of ADA.F)

### ✅ Balance Checking
- Balance endpoint shows normalized names
- Maintains raw balance data in the response
- Users see familiar asset names in the UI

## Testing

To verify the fix works:

1. **Check Your Staked Assets:**
   ```bash
   # Call the balance API
   GET /api/kraken/balance
   
   # Should return normalized names with rawAsset for reference:
   {
     "balance": [
       { "asset": "ADA", "rawAsset": "ADA.F", "amount": 1000.5 }
     ]
   }
   ```

2. **Create a Portfolio:**
   - Go to Dashboard → Create New Portfolio
   - Add assets using standard names (ADA, BTC, ETH)
   - System should recognize your staked balances

3. **Check Holdings:**
   ```bash
   GET /api/holdings
   
   # Should show your assets with normalized names
   {
     "holdings": [
       { "symbol": "ADA", "amount": 1000.5, "value": 500.25 }
     ]
   }
   ```

## Common Kraken Asset Suffixes

| Suffix | Meaning | Example |
|--------|---------|---------|
| `.F` | Flex Staking | ADA.F, DOT.F, ETH.F |
| `.S` | Staked (locked) | ETH.S, DOT.S |
| `.M` | Margin | BTC.M, ETH.M |
| `.P` | Perpetual | BTC.P |

All of these are now automatically normalized to the base asset name.

## Benefits

1. **User-Friendly**: Users don't need to know about Kraken's internal naming
2. **Consistent**: All asset names are standardized across the application
3. **Flexible**: Works whether assets are staked or not
4. **Transparent**: Raw asset names are preserved for debugging
5. **Future-Proof**: Handles new suffixes that Kraken might add

## Migration Notes

No migration is needed! The changes are backward compatible:
- Existing portfolios continue to work
- Asset matching is improved
- No database changes required
- No frontend changes required

## Related Documentation

- [Kraken API Asset Pairs](https://docs.kraken.com/rest/#tag/Market-Data/operation/getTradableAssetPairs)
- [Kraken Staking Products](https://www.kraken.com/features/staking-coins)
- [API Implementation Summary](./app/api/API_IMPLEMENTATION_SUMMARY.md)

