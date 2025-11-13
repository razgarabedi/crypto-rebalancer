# Analytics Page - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Getting Started](#getting-started)
4. [Dashboard Tab](#dashboard-tab)
5. [Innovation Insights Tab](#innovation-insights-tab)
6. [Performance Analytics Tab](#performance-analytics-tab)
7. [AI Insights Tab](#ai-insights-tab)
8. [Loading States & Performance](#loading-states--performance)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

The **Analytics Page** (`/dashboard/analytics`) is a comprehensive portfolio analysis dashboard that provides deep insights into your cryptocurrency portfolio performance, risk metrics, trend signals, and AI-powered recommendations. The page is organized into four main tabs, each focusing on different aspects of portfolio analysis.

### Key Features
- **Real-time Portfolio Analysis**: View current allocations, target allocations, and drift
- **Performance Metrics**: Track returns over 7, 30, and 90-day periods
- **Risk Analysis**: Volatility measurements and correlation analysis
- **Trend Signals**: Developer activity, social metrics, and community engagement data
- **AI-Powered Insights**: Natural-language recommendations for portfolio optimization

---

## Page Structure

The analytics page consists of:
- **Header**: Navigation controls and portfolio selector
- **Global Loading Bar**: Shows progress during initial page load and portfolio changes
- **Tabbed Interface**: Four main tabs for different analytics views
- **Portfolio Selector**: Dropdown to switch between portfolios

### Tabs Overview
1. **Dashboard** - Core portfolio metrics and allocations (loads immediately)
2. **Innovation Insights** - Trend signals and forward-looking notes (lazy-loaded)
3. **Performance Analytics** - Historical performance and risk metrics (lazy-loaded)
4. **AI Insights** - AI-generated portfolio recommendations (calculates from loaded data)

---

## Getting Started

### Accessing the Analytics Page
1. Navigate to `/dashboard/analytics` from the main dashboard
2. The page will automatically load data for your selected portfolio
3. If no portfolio is selected, it will default to your first portfolio

### Initial Load
- **Dashboard Tab**: Loads immediately with core portfolio data
- **Other Tabs**: Load on-demand when you click them (lazy loading)
- **Loading Bar**: Shows progress during initial load (5% → 100%)

### Portfolio Selection
- Use the dropdown at the top to select a different portfolio
- Changing portfolios triggers a reload with a new loading bar
- Previous tab data is cleared when switching portfolios

---

## Dashboard Tab

The **Dashboard Tab** displays the core portfolio metrics and is always available immediately after page load.

### Sections

#### 1. Portfolio Value & P/L
- **Total Portfolio Value**: Current EUR value of all holdings
- **P/L Badges**: Profit/Loss indicators for:
  - Daily (1 day)
  - Weekly (7 days)
  - Monthly (30 days)
- **Visual Indicators**: Green for positive, red for negative

#### 2. Allocation: Current vs Target
- **Pie Chart**: Visual representation of current allocations
- **Bar Chart**: Side-by-side comparison of current vs target percentages
- **Color Coding**:
  - Blue: Current allocation
  - Green: Target allocation
- **Drift Indicator**: Shows which assets are over/under target

#### 3. Biggest Drift
- **Top Drift Items**: Assets with the largest deviation from target
- **Format**: `Symbol: Current% vs Target% (Diff%)`
- **Sorted**: By absolute deviation (largest first)

#### 4. Portfolio Value Chart
- **Line Chart**: Historical portfolio value over time
- **Sparkline**: Compact trend visualization
- **Time Range**: Based on available historical data

#### 5. Diversification Score
- **Calculation**: Based on Herfindahl-Hirschman Index (HHI)
- **Range**: 0-100%
- **Interpretation**:
  - 0-40%: Low diversification (concentrated)
  - 40-65%: Moderate diversification
  - 65-100%: High diversification (well-spread)

#### 6. Allocation Drift
- **Visual Representation**: Shows all assets and their drift from target
- **Color Indicators**: 
  - Green: Over-allocated
  - Red: Under-allocated
  - Neutral: Close to target

### Data Refresh
- **Automatic**: Loads on page load and portfolio change
- **Manual**: Click "Update" button in the header
- **Real-time**: Prices update from Kraken API

---

## Innovation Insights Tab

The **Innovation Insights Tab** provides trend signals and forward-looking notes based on developer activity, social metrics, and community engagement data from CoinGecko.

### Loading Process
1. **Initial State**: Shows "Load Innovation Insights" button
2. **On Click**: Begins fetching data with progress bar
3. **Progress**: Shows estimated time remaining
4. **Completion**: Displays insights data

### Data Sources
- **CoinGecko API**: Developer data, community metrics, social signals
- **Rate Limited**: Sequential fetching with 1.5s delays between requests
- **Typical Load Time**: 1-3 minutes depending on portfolio size

### Sections

#### 1. Forward-Looking Insights
- **AI-Generated Notes**: Contextual insights about portfolio assets
- **Types**:
  - `trend`: Market trend observations
  - `signal`: Actionable signals
  - `warning`: Risk warnings
  - `opportunity`: Investment opportunities
- **Severity Levels**:
  - `high`: Critical information
  - `medium`: Important information
  - `low`: General information

#### 2. Trend Signals
Displays individual signals for each asset:

**Signal Types**:
- **Developer** (`Code2` icon):
  - GitHub stars, forks, commits
  - Pull requests, contributors
  - Development activity trends
- **Social** (`Users` icon):
  - Twitter followers
  - Reddit subscribers
  - Community growth
- **TVL** (`Activity` icon):
  - Total Value Locked metrics
  - DeFi protocol activity
- **Community** (`Users` icon):
  - General community metrics
  - Engagement statistics

**Signal Indicators**:
- 🟢 **Bullish** (`bullish`): Positive trend, growing activity
- 🔴 **Bearish** (`bearish`): Negative trend, declining activity
- ⚪ **Neutral** (`neutral`): Stable, no significant change

**Signal Display**:
- **Symbol**: Asset identifier
- **Metric**: What's being measured
- **Value**: Current value
- **Change**: Absolute change and percentage change
- **Note**: Additional context

### Example Insights
```
"ETH shows 3 strong bullish signals (developer, social, community), 
indicating growing developer activity and community engagement."
```

---

## Performance Analytics Tab

The **Performance Analytics Tab** provides detailed historical performance metrics, volatility analysis, and correlation data.

### Loading Process
1. **Initial State**: Shows "Load Performance Analytics" button
2. **On Click**: Begins fetching historical data
3. **Progress**: Shows estimated time remaining (typically 1-3 minutes)
4. **Data Sources**: Kraken OHLC API (parallel) + CoinGecko fallback (sequential)

### Sections

#### 1. Top Movers Table
Shows best and worst performers over different time periods.

**Time Periods**:
- **7 Days**: Short-term performance
- **30 Days**: Medium-term performance
- **90 Days**: Long-term performance

**For Each Period**:
- **Best Performers**: Top 3 assets by return (sorted descending)
- **Worst Performers**: Bottom 3 assets by return (sorted ascending)

**Display Format**:
- **Best**: Green background, shows `+X.XX%` or `X.XX%` (positive)
- **Worst**: Red background, shows `-X.XX%` (negative)
- **Sign Handling**: Only shows `+` for positive returns

**Data Structure**:
```typescript
{
  best7d: [{ symbol: "ETH", return7d: 5.23 }],
  worst7d: [{ symbol: "BTC", return7d: -2.15 }],
  best30d: [{ symbol: "SOL", return30d: 15.67 }],
  worst30d: [{ symbol: "ADA", return30d: -8.45 }],
  // ... 90d similarly
}
```

#### 2. Volatility Analysis
**Portfolio Volatility**:
- **Calculation**: Weighted average of individual asset volatilities, adjusted for correlations
- **Display**: Percentage value with color-coded badge
- **Interpretation**:
  - 0-30%: Low Risk (Green)
  - 30-50%: Moderate Risk (Yellow)
  - 50%+: High Risk (Red)

**Individual Coin Volatility**:
- **List**: All assets in portfolio
- **Metric**: Annualized standard deviation of daily returns
- **Visual**: Progress bar showing volatility level
- **Sorting**: Typically by volatility (highest first)

#### 3. Correlation Heatmap
**Purpose**: Visualize how assets move together in price

**How to Read**:
- **Color Scale**: 
  - Dark Red: Strong negative correlation (-1.0)
  - White/Light: No correlation (0.0)
  - Dark Green: Strong positive correlation (+1.0)
- **Matrix Layout**: Assets listed on both axes
- **Values**: Correlation coefficient (-1.0 to +1.0)

**Interpretation**:
- **High Correlation (0.7+)**: Assets move together (limited diversification benefit)
- **Low Correlation (<0.3)**: Assets move independently (better diversification)
- **Negative Correlation**: Assets move in opposite directions (optimal for risk reduction)

**Legend**:
- Shows color scale reference
- Explains correlation ranges

### Performance Metrics Calculated

**For Each Asset**:
- **Return7d**: 7-day return percentage
- **Return30d**: 30-day return percentage
- **Return90d**: 90-day return percentage
- **Volatility**: Annualized volatility percentage

**Portfolio-Level**:
- **Portfolio Volatility**: Weighted average with correlations
- **Correlation Matrix**: Pairwise correlation coefficients

---

## AI Insights Tab

The **AI Insights Tab** provides intelligent, natural-language recommendations for portfolio optimization. This tab calculates recommendations from all available data and requires no external API calls.

### How It Works
1. **Data Analysis**: Analyzes current portfolio, allocations, performance data, and trend signals
2. **Recommendation Generation**: Creates contextual recommendations
3. **Priority Sorting**: Sorts by priority (High → Medium → Low)
4. **Display**: Shows recommendations with actionable insights

### Recommendation Types

#### 1. Rebalance Recommendations
**Type**: `rebalance`
**Icon**: Target icon
**Color**: Blue

**Triggers**:
- Asset allocation drifts >2% from target
- Significant over-allocation (>5% above target)
- Significant under-allocation (>5% below target)

**Example**:
```
"Your BTC allocation is over target by 8.3% (currently 48.3% vs target 40.0%). 
Consider taking profits or redistributing ~€850 to other assets to reduce 
concentration risk."
```

#### 2. Opportunity Recommendations
**Type**: `opportunity`
**Icon**: TrendingUp icon
**Color**: Green

**Triggers**:
- Under-allocated assets with staking yields
- Assets with multiple bullish trend signals not in portfolio
- Forward-looking notes suggesting opportunities

**Example**:
```
"Your ETH allocation is under target by 3.2%. Given ETH's strong staking yield 
(~3.5% APY), topping up could improve long-term returns while rebalancing 
toward your target allocation."
```

#### 3. Warning Recommendations
**Type**: `warning`
**Icon**: AlertTriangle icon
**Color**: Yellow

**Triggers**:
- High concentration risk (single asset >45%)
- Bearish trend signals for portfolio assets
- Significant allocation imbalances

**Example**:
```
"High concentration risk: BTC represents 58.5% of your portfolio. While this may 
be intentional, consider reducing exposure to avoid overexposure to a single 
asset's volatility."
```

#### 4. Diversification Recommendations
**Type**: `diversification`
**Icon**: BarChart3 icon
**Color**: Purple

**Triggers**:
- Diversification score <65%
- High correlation between assets (>80%)
- Lack of non-correlated assets

**Example**:
```
"Your portfolio diversification score is 42%. Consider adding non-correlated 
assets to reduce risk. Diversifying across different sectors (DeFi, Layer 1s, 
AI tokens, etc.) can improve portfolio resilience."
```

#### 5. Performance Recommendations
**Type**: `performance`
**Icon**: Activity icon
**Color**: Indigo

**Triggers**:
- Significant portfolio gains/losses
- Opportunities for profit-taking
- Rebalancing opportunities based on performance

**Example**:
```
"Your portfolio gained 12.5% over the past month. Strong performance! Consider 
taking some profits if you're significantly over target allocations."
```

#### 6. Optimization Recommendations
**Type**: `optimization`
**Icon**: Sparkles icon
**Color**: Cyan

**Triggers**:
- High correlation between portfolio assets (>80%)
- High volatility assets with better alternatives
- Risk-adjusted return optimization opportunities

**Example**:
```
"BTC and ETH are highly correlated (87%), meaning they move together and 
provide limited diversification benefit. Consider adding SOL which has low 
correlation with both, improving portfolio risk-adjusted returns."
```

#### 7. Asset Swap Recommendations
**Type**: `asset-swap`
**Icon**: RefreshCw icon
**Color**: Orange

**Triggers**:
- Underperforming assets in portfolio (<-15% in 30d or <-20% in 90d)
- Well-performing assets not in portfolio (>15% in 30d or >25% in 90d)
- Clear performance differential

**Example**:
```
"BTC has underperformed significantly (-18.2% in 30d, -22.5% in 90d). 
Meanwhile, ETH has shown strong momentum (+24.3% in 30d). Consider replacing 
BTC with ETH to improve portfolio returns."
```

### Priority Levels

**High Priority**:
- Critical issues requiring immediate attention
- High concentration risk
- Significant underperformance
- Multiple bearish signals

**Medium Priority**:
- Important optimizations
- Moderate drift from targets
- Diversification improvements
- Performance opportunities

**Low Priority**:
- General suggestions
- Long-term optimizations
- Minor adjustments

### Recommendation Features

**For Each Recommendation**:
- **Type Badge**: Color-coded by recommendation type
- **Priority Badge**: High/Medium/Low indicator
- **Symbol Badge(s)**: Relevant asset symbols
- **Message**: Natural-language explanation
- **Suggested Action**: Specific, actionable recommendation with EUR amounts

### Staking Assets Recognition

The AI Insights engine recognizes staking opportunities for:
- **ETH**: 3.5% APY
- **SOL**: 6.8% APY
- **ADA**: 4.2% APY
- **DOT**: 14.0% APY
- **ATOM**: 19.5% APY
- **AVAX**: 8.5% APY

When suggesting to add these assets, it includes staking yield information.

---

## Loading States & Performance

### Page-Level Loading

**When It Appears**:
- Initial page load
- Portfolio change
- Manual refresh

**Progress Stages**:
1. **5%**: Initializing...
2. **10%**: Loading portfolios...
3. **25%**: Fetching balances...
4. **35%**: Fetching prices...
5. **50%**: Calculating portfolio summary...
6. **75%**: Finalizing...
7. **90%**: Complete
8. **100%**: Data ready

**Visual Indicator**:
- Progress bar at top of page
- Percentage display
- Status message
- Spinner icon during active loading

### Tab-Level Loading

#### Innovation Insights Tab
- **Trigger**: Click "Load Innovation Insights" button
- **Progress**: Updates every 100ms with estimated time remaining
- **Status**: Shows current operation ("Fetching innovation insights from CoinGecko...")
- **Typical Duration**: 1-3 minutes (depends on portfolio size)
- **Rate Limiting**: 1.5s delay between CoinGecko requests

#### Performance Analytics Tab
- **Trigger**: Click "Load Performance Analytics" button
- **Progress**: Updates every 100ms with estimated time remaining
- **Status**: Shows current operation ("Fetching historical data...")
- **Typical Duration**: 1-3 minutes
- **Optimization**: Kraken API calls run in parallel; CoinGecko used as fallback sequentially

### Performance Optimizations

1. **Lazy Loading**: Heavy tabs only load when clicked
2. **Parallel Fetching**: Kraken API calls run simultaneously
3. **Fallback Strategy**: Kraken first (fast), CoinGecko fallback (rate-limited)
4. **Data Caching**: Portfolio summary cached until portfolio changes
5. **Progress Feedback**: Users always know what's happening

### Loading Best Practices

- **Dashboard Tab**: Always loads first (essential data)
- **Heavy Tabs**: Load only when needed to avoid rate limits
- **Progress Indicators**: Clear feedback during long operations
- **Error Handling**: Graceful fallbacks if APIs fail

---

## API Endpoints

### Core Portfolio Data
- **`/api/portfolios`**: GET - Fetch user portfolios
- **`/api/kraken/balance`**: GET - Fetch current balances
- **`/api/kraken/prices`**: GET - Fetch current prices

### Analytics Endpoints

#### `/api/analytics/innovation-insights`
**Method**: GET
**Parameters**:
- `symbols`: Comma-separated list of asset symbols

**Response**:
```typescript
{
  signals: Array<{
    symbol: string;
    type: 'developer' | 'social' | 'tvl' | 'community';
    metric: string;
    value: number;
    change?: number;
    changePercent?: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    note?: string;
  }>;
  notes: Array<{
    type: 'trend' | 'signal' | 'warning' | 'opportunity';
    title: string;
    description: string;
    symbols: string[];
    severity: 'high' | 'medium' | 'low';
  }>;
}
```

**Rate Limiting**:
- Sequential requests with 1.5s delay
- CoinGecko API rate limits apply
- Retry logic with exponential backoff

#### `/api/analytics/performance-risk`
**Method**: GET
**Parameters**:
- `symbols`: Comma-separated list of asset symbols
- `weights`: JSON string of target allocations (optional)

**Response**:
```typescript
{
  success: true;
  metrics: Array<{
    symbol: string;
    return7d: number;
    return30d: number;
    return90d: number;
    volatility: number;
    prices: number[];
    timestamps: number[];
  }>;
  correlationMatrix: Record<string, Record<string, number>>;
  portfolioVolatility: number;
  topMovers: {
    best7d: Array<{ symbol: string; return7d: number }>;
    worst7d: Array<{ symbol: string; return7d: number }>;
    best30d: Array<{ symbol: string; return30d: number }>;
    worst30d: Array<{ symbol: string; return30d: number }>;
    best90d: Array<{ symbol: string; return90d: number }>;
    worst90d: Array<{ symbol: string; return90d: number }>;
  };
  timestamp: string; // ISO timestamp
}
```

**Data Sources**:
- **Kraken OHLC API**: Primary source (parallel fetching)
- **CoinGecko API**: Fallback (sequential with delays)
- **Historical Data**: 90 days of daily candles

---

## Troubleshooting

### Common Issues

#### 1. "No AI insights available yet"
**Cause**: Portfolio data not loaded
**Solution**: Wait for Dashboard tab to load, then check AI Insights tab

#### 2. Innovation Insights takes too long
**Cause**: CoinGecko rate limiting
**Solution**: 
- Wait for current request to complete
- System handles rate limits automatically with retries
- Typical wait: 1-3 minutes

#### 3. Performance Analytics shows same data for all periods
**Cause**: Historical data not available
**Solution**: 
- Ensure assets have sufficient historical data
- Check if CoinGecko fallback is working
- Some newer assets may have limited history

#### 4. Portfolio selection not updating
**Cause**: State synchronization issue
**Solution**:
- Wait a moment for data to refresh
- Manually refresh the page if needed
- Check browser console for errors

#### 5. Loading bar stuck
**Cause**: API timeout or network issue
**Solution**:
- Check network connection
- Wait for retry logic (automatic)
- Refresh page if stuck >5 minutes

### Error States

**Innovation Insights Errors**:
- Shows error card with retry button
- Displays error message
- Allows manual retry

**Performance Analytics Errors**:
- Shows error card with retry button
- Displays error message
- Allows manual retry

### Data Validation

**Automatic Filtering**:
- Invalid data (NaN, Infinity) filtered out
- Missing prices handled gracefully
- Empty results show appropriate messages

---

## Best Practices

### Using the Analytics Page

1. **Start with Dashboard**: Always review dashboard tab first for core metrics
2. **Load Heavy Tabs When Needed**: Only load Innovation Insights and Performance Analytics when you need them
3. **Monitor Loading Progress**: Pay attention to progress bars for long operations
4. **Review AI Insights Regularly**: Check AI Insights tab for optimization opportunities
5. **Use Portfolio Selector**: Easily switch between portfolios for comparison

### Interpreting Data

1. **Allocation Drift**: 
   - >5% drift: Consider rebalancing
   - >10% drift: High priority rebalancing
   
2. **Diversification Score**:
   - Aim for 65%+ for well-diversified portfolio
   - <50%: High concentration risk
   
3. **Correlation**:
   - Target: <0.7 correlation between major holdings
   - <0.3: Excellent diversification
   
4. **Volatility**:
   - <30%: Conservative portfolio
   - 30-50%: Moderate risk
   - >50%: High risk

### Optimization Tips

1. **Follow AI Recommendations**: High-priority recommendations address real issues
2. **Balance Risk and Return**: Consider volatility when making changes
3. **Monitor Trends**: Innovation Insights show early signals
4. **Diversify Correlations**: Add assets with low correlation to existing holdings
5. **Review Regularly**: Check analytics weekly for portfolio health

### Performance Tips

1. **Avoid Frequent Reloads**: Let data load completely before reloading
2. **Load Tabs Sequentially**: Don't load multiple heavy tabs simultaneously
3. **Be Patient**: CoinGecko rate limits require time for large portfolios
4. **Use Update Button**: Manual refresh only when needed

---

## Technical Details

### Data Flow

1. **Page Load**: 
   - Fetch portfolios → Load balances → Fetch prices → Calculate summary
   
2. **Portfolio Change**:
   - Clear previous data → Set loading state → Fetch new portfolio data → Update all tabs

3. **Tab Loading**:
   - Innovation Insights: Fetch CoinGecko data sequentially
   - Performance Analytics: Fetch Kraken in parallel, CoinGecko as fallback

### State Management

- **React Hooks**: `useState`, `useMemo`, `useEffect`
- **URL State**: Portfolio selection synced with URL query params
- **Loading States**: Separate states for page, tabs, and operations

### Component Structure

- **SmartAnalyticsDashboard**: Suspense wrapper
- **SmartAnalyticsDashboardInner**: Main component
- **Tabs**: Dashboard, Innovation Insights, Performance Analytics, AI Insights
- **Helper Components**: PLBadge, Sparkline, DonutAllocation

### Calculations

**Returns**:
- 7d: `((current_price - price_7d_ago) / price_7d_ago) * 100`
- 30d: `((current_price - price_30d_ago) / price_30d_ago) * 100`
- 90d: `((current_price - price_90d_ago) / price_90d_ago) * 100`

**Volatility**:
- Annualized standard deviation of daily returns
- `std_dev_daily_returns * sqrt(365)`

**Correlation**:
- Pearson correlation coefficient
- Calculated from overlapping price history

**Portfolio Volatility**:
- Weighted average of individual volatilities
- Adjusted for correlation between assets

---

## Summary

The Analytics Page is a comprehensive tool for portfolio analysis, providing:

✅ **Real-time Metrics**: Current allocations, values, and performance
✅ **Historical Analysis**: 7/30/90-day returns and trends
✅ **Risk Assessment**: Volatility and correlation metrics
✅ **Trend Signals**: Developer activity and social metrics
✅ **AI Recommendations**: Intelligent portfolio optimization suggestions
✅ **User-Friendly**: Clear visualizations and natural-language insights

Use this documentation as a reference guide to maximize the value of your portfolio analytics.

---

*Last Updated: [Current Date]*
*Version: 1.0*

