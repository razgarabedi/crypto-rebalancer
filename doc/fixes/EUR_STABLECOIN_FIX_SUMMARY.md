# EUR and Stablecoin Price Handling Fix

## ✅ Problem Solved

**Issues**:
1. **EUR price not showing** - EUR is the base currency but wasn't being assigned a price
2. **USDC price not showing** - Stablecoins might not have direct EUR pairs on Kraken
3. **Status always "Watch"** - Missing prices caused incorrect percentage calculations

**Root Cause**: The dashboard wasn't setting prices for EUR (base currency) and stablecoins (USDC, USDT, etc.), leading to 0 values and incorrect portfolio allocation calculations.

## 📝 Files Modified

### `app/dashboard/page.tsx`
1. **Added EUR base price** - EUR always set to €1.00 since it's the base currency
2. **Added stablecoin trading pairs** - USDCEUR, USDTEUR, DAIEUR
3. **Added stablecoin fallback pricing** - Calculate from EUR/USD rate if direct pair unavailable
4. **Added fallback in holdings calculation** - Ensures EUR and stablecoins always have prices
5. **Added debug logging** - Console logs to help diagnose price issues

## 🔧 Technical Details

### EUR Handling

EUR is the **base currency** for the portfolio, so its price is always **€1.00**:

```typescript
// EUR is the base currency, so its price is always 1.00
if (allSymbols.includes('EUR')) {
  prices['EUR'] = 1.00;
}
```

And in holdings calculation:
```typescript
if (symbol === 'EUR') {
  price = 1.00;
  console.log(`Using default price for EUR: €1.00`);
}
```

### Stablecoin Handling

Stablecoins (USDC, USDT, DAI, BUSD, TUSD) are pegged to **USD**, so we convert to EUR:

#### Method 1: Fetch from Kraken (preferred)
```typescript
// Added stablecoin trading pairs
const validTradingPairs = new Set([
  // ... other pairs ...
  'USDCEUR', 'USDTEUR', 'DAIEUR' // Stablecoin pairs
]);

const pricePairs = allSymbols.map(s => {
  if (s === 'USDC') return 'USDCEUR';
  if (s === 'USDT') return 'USDTEUR';
  if (s === 'DAI') return 'DAIEUR';
  // ...
});
```

#### Method 2: Calculate from EUR/USD rate (fallback)
```typescript
// Handle stablecoins - set approximate EUR value if not found
const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD'];
for (const stablecoin of stablecoins) {
  if (allSymbols.includes(stablecoin) && !prices[stablecoin]) {
    // Stablecoins are pegged to USD, so convert to EUR using EUR/USD rate
    prices[stablecoin] = 1.0 / eurUsdRate;
    console.log(`Using calculated price for ${stablecoin}: €${prices[stablecoin].toFixed(4)}`);
  }
}
```

#### Method 3: Conservative estimate (last resort)
```typescript
if (['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD'].includes(symbol)) {
  // Stablecoins approximate EUR value (around 0.90-0.95 EUR typically)
  price = 0.92; // Conservative estimate if EUR/USD rate not available
  console.log(`Using estimated price for ${symbol}: €${price.toFixed(2)}`);
}
```

## 🎯 How It Works Now

### Before Fix

```
Portfolio: EUR: 10%, USDC: 10%, BTC: 40%, ETH: 40%

Prices fetched:
- BTC: €55,000
- ETH: €3,200
- EUR: undefined ❌
- USDC: undefined ❌

Holdings calculation:
- EUR balance: 1000, price: 0, value: 0 ❌
- USDC balance: 1000, price: 0, value: 0 ❌
- BTC balance: 0.1, price: 55000, value: 5500
- ETH balance: 1.5, price: 3200, value: 4800

Total value: €10,300 (missing EUR and USDC!)
Current allocation:
- EUR: 0% (target: 10%, difference: -10%) 🔴 Rebalance
- USDC: 0% (target: 10%, difference: -10%) 🔴 Rebalance
- BTC: 53.4% (target: 40%, difference: +13.4%) 🔴 Rebalance
- ETH: 46.6% (target: 40%, difference: +6.6%) 🔴 Rebalance

Result: Everything needs rebalancing! ❌
```

### After Fix

```
Portfolio: EUR: 10%, USDC: 10%, BTC: 40%, ETH: 40%

Prices fetched/calculated:
- BTC: €55,000
- ETH: €3,200
- EUR: €1.00 ✅ (base currency)
- USDC: €0.91 ✅ (calculated from EUR/USD rate)

Holdings calculation:
- EUR balance: 1000, price: 1.00, value: 1000 ✅
- USDC balance: 1000, price: 0.91, value: 910 ✅
- BTC balance: 0.1, price: 55000, value: 5500
- ETH balance: 1.5, price: 3200, value: 4800

Total value: €12,210
Current allocation:
- EUR: 8.2% (target: 10%, difference: -1.8%) 🟢 OK
- USDC: 7.5% (target: 10%, difference: -2.5%) 🟡 Watch
- BTC: 45.0% (target: 40%, difference: +5.0%) 🔴 Rebalance
- ETH: 39.3% (target: 40%, difference: -0.7%) 🟢 OK

Result: Accurate calculations! ✅
```

## 📊 Status Badges Explained

The status badges are based on the **difference** from target:

| Badge | Difference | Meaning | Example |
|-------|------------|---------|---------|
| 🟢 **OK** | < ±2% | Within target | Target: 40%, Current: 39.5% (diff: -0.5%) |
| 🟡 **Watch** | ±2% to ±5% | Moderate deviation | Target: 10%, Current: 7.5% (diff: -2.5%) |
| 🔴 **Rebalance** | > ±5% | Needs rebalancing | Target: 40%, Current: 50% (diff: +10%) |

### Why "Watch" Status?

The "Watch" status means the asset is **slightly** off target but not enough to require immediate rebalancing. This is normal and can happen due to:

1. **Price fluctuations** - Crypto prices change constantly
2. **Stablecoin variations** - USDC might be $0.998 instead of $1.00
3. **EUR/USD rate changes** - Affects stablecoin EUR values
4. **Natural drift** - Portfolio naturally drifts between rebalances

### When to Rebalance?

- **OK**: No action needed ✅
- **Watch**: Monitor, might rebalance soon ⚠️
- **Rebalance**: Action recommended 🔴

You can adjust the rebalance threshold in portfolio settings (default: €10 minimum difference).

## 🧪 Testing

### Check EUR Price

1. **Add EUR to your portfolio** with any target % (e.g., 10%)
2. **Go to dashboard**
3. **Check Holdings table**:
   - EUR should show **Price: €1.00** ✅
   - Value should be correct (balance × 1.00)
   - Status should be accurate

### Check USDC Price

1. **Add USDC to your portfolio** with any target % (e.g., 10%)
2. **Go to dashboard**
3. **Open browser console** (F12)
4. **Look for logs**:
   ```
   Dashboard prices fetched: { BTC: 55000, ETH: 3200, EUR: 1, USDC: 0.91, ... }
   Using calculated price for USDC: €0.91
   ```
5. **Check Holdings table**:
   - USDC should show **Price: €0.91** (or similar) ✅
   - Value should be correct
   - Status should be accurate

### Verify Calculations

1. **Note your balances**:
   - EUR: X amount
   - USDC: Y amount
   - Other assets...

2. **Calculate expected total**:
   ```
   Total = (EUR × 1.00) + (USDC × ~0.91) + (BTC × price) + ...
   ```

3. **Compare with dashboard** "Total Value" card
4. **Should match** (within small rounding differences) ✅

## 🔍 Debugging

If prices still don't show correctly:

### Step 1: Check Console Logs

Open browser console (F12) and look for:

```javascript
// Should see these logs:
"Dashboard prices fetched: { EUR: 1, USDC: 0.91, BTC: 55000, ... }"
"Using default price for EUR: €1.00"
"Using calculated price for USDC: €0.91"
```

### Step 2: Check API Responses

In console, run:
```javascript
// Check if USDC/EUR pair exists on Kraken
fetch('/api/kraken/prices?symbols=USDCEUR')
  .then(r => r.json())
  .then(data => console.log('USDCEUR price:', data));

// Check EUR/USD rate
fetch('/api/kraken/prices?symbols=EURUSD')
  .then(r => r.json())
  .then(data => console.log('EURUSD rate:', data));
```

### Step 3: Check Holdings Calculation

In the console logs, look for:
```
Holdings calculation skipped: No portfolio selected
// or
Using default price for EUR: €1.00
Using calculated price for USDC: €0.92
```

### Common Issues

**Issue**: EUR still shows €0.00
- **Cause**: Live prices not loaded yet
- **Solution**: Wait a few seconds for data to load, or click "Refresh"

**Issue**: USDC shows wrong price (e.g., €10.00)
- **Cause**: Symbol confusion (might be fetching wrong pair)
- **Solution**: Check console logs for errors, ensure using correct symbol

**Issue**: Status is "Rebalance" even with correct prices
- **Cause**: You might actually need to rebalance!
- **Solution**: Check the "Difference" column - if > 5%, rebalancing is recommended

## 💡 Tips

### Portfolio Composition

If you're using EUR or stablecoins in your portfolio:

1. **EUR is great for stability** - Always €1.00, no volatility
2. **Stablecoins are useful for holding value** - Protect against crypto drops
3. **Mix with volatile assets** - Balance risk and reward

### Target Allocations

Example conservative portfolio:
- 40% EUR or stablecoins (low risk)
- 30% BTC (moderate risk)
- 20% ETH (moderate risk)
- 10% Altcoins (high risk)

Example aggressive portfolio:
- 10% EUR or stablecoins (emergency buffer)
- 40% BTC (core position)
- 30% ETH (growth)
- 20% Altcoins (high growth potential)

### Rebalancing Strategy

With EUR/stablecoins:
- **Market crash**: Rebalance to buy crypto with stablecoins
- **Market rally**: Rebalance to take profits into stablecoins
- **Regular intervals**: Automatic rebalancing maintains targets

## 📚 Related Documentation

- [KRAKEN_ASSET_NORMALIZATION.md](./KRAKEN_ASSET_NORMALIZATION.md) - Asset suffix handling
- [REBALANCE_FIX_SUMMARY.md](./REBALANCE_FIX_SUMMARY.md) - Rebalancing functionality
- [REBALANCE_TESTING_GUIDE.md](./REBALANCE_TESTING_GUIDE.md) - Testing guide

## 🎉 Conclusion

EUR and stablecoin prices are now properly handled:
- ✅ EUR always shows €1.00
- ✅ Stablecoins show accurate EUR value
- ✅ Portfolio calculations are correct
- ✅ Status badges reflect actual state
- ✅ Rebalancing works with EUR and stablecoins

The "Watch" status is **normal** for stablecoins when they're slightly off target due to price fluctuations. If the difference is small (2-5%), it's usually fine to wait before rebalancing!

