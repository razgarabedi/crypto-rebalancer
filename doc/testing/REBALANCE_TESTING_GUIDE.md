# Rebalancing Testing Guide

This guide will help you test that the rebalancing functionality is working correctly after the fix.

## Prerequisites

Before testing, make sure you have:

1. ✅ **User account** created and logged in
2. ✅ **Kraken API credentials** configured in your profile
3. ✅ **Portfolio created** with target allocations
4. ✅ **Assets in Kraken account** that match your portfolio

## Test 1: Check Rebalance Status

### Steps:
1. Open your dashboard
2. Select a portfolio
3. Look at the "Rebalance Status" card

### Expected Result:
- If assets differ from target by >5%: Shows "**Needed**" badge (red)
- If assets are within target: Shows "**Balanced**" badge (green)
- Check the "Holdings & Target Comparison" table for details

### What to Check:
- **Difference column**: Shows % difference from target
- **Status column**: 
  - 🔴 "Rebalance" = needs rebalancing (>5% difference)
  - 🟡 "Watch" = moderate difference (2-5%)
  - 🟢 "OK" = within target (<2%)

---

## Test 2: Manual Rebalance (Button Test)

### Steps:
1. On the dashboard, click **"Rebalance Now"** button
2. Review the confirmation dialog:
   - Shows portfolio name
   - Shows current value
   - Shows number of orders needed
3. Click **"Continue Rebalancing"**

### Expected Result:
- Loading toast appears: "Rebalancing portfolio..."
- Browser console shows logs (press F12):
  ```
  [Scheduler] Manual rebalance triggered for portfolio: <id>
  [Rebalance:<id>] INFO: Starting portfolio rebalance
  [Rebalance:<id>] SUCCESS: User Kraken client initialized
  ```
- Success toast appears: "Portfolio rebalanced successfully!"
- Last Rebalanced date updates on dashboard

### If It Fails:
Check browser console for error messages:
- **"User ID is required"** = Old bug (should be fixed now!)
- **"Credentials not configured"** = Add Kraken API keys in profile
- **"Portfolio not found"** = Portfolio ID issue, try creating a new one
- **"Insufficient balance"** = Not enough funds on Kraken

---

## Test 3: Check API Endpoints Directly

### Test Rebalance Check Endpoint

Open browser console (F12) and run:
```javascript
fetch('/api/rebalance/check?portfolioId=YOUR_PORTFOLIO_ID&threshold=10')
  .then(r => r.json())
  .then(data => console.log('Check result:', data));
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "portfolioId": "...",
    "threshold": 10,
    "needsRebalancing": true,
    "portfolio": {
      "totalValue": 1000.50,
      "currency": "EUR",
      "holdings": [...]
    },
    "orders": [
      {
        "symbol": "BTC",
        "side": "buy",
        "volume": 0.001,
        "currentValue": 350.00,
        "targetValue": 400.00,
        "difference": 50.00
      }
    ],
    "summary": {
      "ordersRequired": 2,
      "totalValueToRebalance": 100.50,
      "buyOrders": 1,
      "sellOrders": 1
    }
  }
}
```

### Test Rebalance Execute Endpoint

```javascript
fetch('/api/scheduler/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ portfolioId: 'YOUR_PORTFOLIO_ID' })
})
  .then(r => r.json())
  .then(data => console.log('Execute result:', data));
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Manual rebalance triggered for portfolio YOUR_PORTFOLIO_ID"
}
```

---

## Test 4: Check Rebalance History

### Steps:
1. After a successful rebalance, check the database
2. Or add a history view to your dashboard (future feature)

### SQL Query (if you have database access):
```sql
SELECT * FROM "RebalanceHistory" 
WHERE "portfolioId" = 'YOUR_PORTFOLIO_ID'
ORDER BY "executedAt" DESC
LIMIT 5;
```

### Expected Columns:
- `executedAt`: Timestamp of rebalance
- `success`: true/false
- `ordersPlanned`: Number of orders calculated
- `ordersExecuted`: Number of orders completed
- `ordersFailed`: Number of orders that failed
- `totalValueTraded`: EUR value traded
- `triggeredBy`: "manual" or "scheduler"

---

## Test 5: Dry Run Mode (Safe Testing)

You can test without actually executing trades:

### Method 1: Via API
```javascript
fetch('/api/rebalance/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    portfolioId: 'YOUR_PORTFOLIO_ID',
    dryRun: true
  })
})
  .then(r => r.json())
  .then(data => console.log('Dry run result:', data));
```

### Expected Result:
- Shows what orders **would** be executed
- Does NOT actually place orders on Kraken
- Safe for testing!

---

## Test 6: Error Handling Tests

### Test Missing Credentials
1. Remove your Kraken API credentials from profile
2. Try to rebalance
3. **Expected**: Error message "Credentials not configured"

### Test Invalid Portfolio
1. Try to rebalance a non-existent portfolio ID
2. **Expected**: Error message "Portfolio not found"

### Test Unauthorized Access
1. Try to rebalance another user's portfolio (if you can manipulate the API call)
2. **Expected**: Error message "Unauthorized - Portfolio does not belong to you"

---

## Common Issues & Solutions

### Issue: "Rebalancing does nothing"

**Check:**
1. Open browser console (F12) for errors
2. Verify Kraken API credentials are configured
3. Check if portfolio needs rebalancing (difference > 5%)
4. Verify you have balance in Kraken for the assets

**Solution:**
- Add API credentials in Profile page
- Increase the difference threshold in portfolio settings
- Transfer funds to Kraken

---

### Issue: "User ID is required for rebalancing"

**Status:** ✅ This is the bug we just fixed!

**If you still see this:**
1. Clear browser cache and reload
2. Check if the code changes were deployed
3. Restart your development server
4. Check that `lib/scheduler.ts` has the updated code

---

### Issue: Orders are calculated but not executed

**Possible Causes:**
1. Running in dry-run mode
2. Kraken API key doesn't have order permissions
3. Insufficient balance
4. Network issues

**Solution:**
1. Check if `SCHEDULER_DRY_RUN=true` in your environment
2. Verify API key permissions on Kraken
3. Check your Kraken account balance
4. Test Kraken API connectivity

---

## Success Indicators

You know rebalancing works when you see:

1. ✅ **No console errors** during rebalancing
2. ✅ **Success toast** appears after clicking "Rebalance Now"
3. ✅ **Last Rebalanced date** updates on dashboard
4. ✅ **RebalanceHistory** record created in database
5. ✅ **Orders executed** on Kraken (check Kraken order history)
6. ✅ **Portfolio allocation** moves closer to target
7. ✅ **Logs show** successful execution without "User ID is required" errors

---

## Verification Checklist

After the fix, verify:

- [ ] Dashboard "Rebalance Now" button works
- [ ] Confirmation dialog shows correct info
- [ ] Loading state displays during rebalancing
- [ ] Success toast appears after completion
- [ ] Last rebalanced date updates
- [ ] Browser console shows no errors
- [ ] API endpoints return proper responses
- [ ] Orders appear in Kraken order history (if not dry-run)
- [ ] RebalanceHistory table has new records
- [ ] Portfolio allocation changes toward target

---

## Additional Debugging

### Enable Verbose Logging

Add to your `.env` file:
```env
NODE_ENV=development
DEBUG=true
```

### Check Server Logs

If running with npm/yarn:
```bash
npm run dev
```

Look for scheduler logs:
```
[Scheduler] Manual rebalance triggered for portfolio: abc123
[Rebalance:abc123] INFO: Starting portfolio rebalance
[Rebalance:abc123] INFO: Getting user Kraken client
[Rebalance:abc123] SUCCESS: User Kraken client initialized
[Rebalance:abc123] INFO: Fetching current holdings from Kraken
...
[Rebalance:abc123] SUCCESS: Portfolio rebalanced successfully!
```

### Monitor Network Traffic

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "Rebalance Now"
4. Watch for API calls:
   - POST `/api/scheduler/trigger`
   - Should return `200 OK`
   - Response: `{"success": true, "message": "..."}`

---

## Need Help?

If rebalancing still doesn't work after testing:

1. **Check the logs** in browser console and server terminal
2. **Review error messages** - they should now be clearer
3. **Verify prerequisites** - credentials, balance, portfolio setup
4. **Test with dry-run** first to ensure logic works
5. **Create an issue** with:
   - Error messages from console
   - Portfolio configuration
   - Server logs
   - Steps to reproduce

---

## Next Steps

Once rebalancing works:

1. ✨ **Enable automatic rebalancing** in portfolio settings
2. 📊 **Monitor performance** over time
3. 🔔 **Set up notifications** for rebalancing events (future feature)
4. 📈 **Review rebalance history** to optimize thresholds
5. 💼 **Adjust target allocations** based on market conditions

Happy rebalancing! 🎉

