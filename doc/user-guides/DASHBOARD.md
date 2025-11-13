# Dashboard Documentation

## Overview

The Kraken Rebalancer Dashboard is a comprehensive, real-time portfolio monitoring and management interface built with Next.js 14, TailwindCSS, shadcn/ui, and Recharts.

## Features

### 🎨 Clean UI Layout

#### Sidebar
- **Portfolio List**: View all your portfolios from the database
- **Portfolio Selection**: Click to switch between portfolios
- **Status Badges**: "Auto" badge for portfolios with auto-rebalancing enabled
- **Add Portfolio Button**: Quick access to create new portfolios

#### Top Bar
- **Portfolio Name**: Dynamic title showing current portfolio
- **Refresh Button**: Manually refresh live data (also auto-refreshes every 30s)
- **Rebalance Now Button**: Trigger immediate portfolio rebalancing

### 📊 Dashboard Content

#### 1. Statistics Cards (4 Cards)
- **Total Value**: Current portfolio value in EUR
- **Assets**: Number of cryptocurrencies tracked
- **Rebalance Status**: Visual indicator if rebalancing is needed
- **Last Rebalanced**: Timestamp and next rebalance schedule

#### 2. Visualization Charts

**Current Allocation Pie Chart**
- Real-time portfolio distribution
- Color-coded by asset
- Interactive tooltips
- Percentage labels

**Target Allocation Pie Chart**
- Desired portfolio distribution
- Matches colors with current allocation
- Visual comparison aid

**Current vs Target Bar Chart**
- Side-by-side comparison
- Blue bars: Current allocation
- Green bars: Target allocation
- Easy to spot discrepancies

#### 3. Holdings Table
Comprehensive table showing:
- **Asset**: Cryptocurrency symbol (BTC, ETH, etc.)
- **Balance**: Current holdings (6 decimal precision)
- **Price (EUR)**: Real-time price per unit
- **Value (EUR)**: Total value of holding
- **Current %**: Current allocation percentage
- **Target %**: Desired allocation percentage
- **Difference**: Delta between current and target
- **Status**: Visual badge (OK, Watch, Rebalance)

Status thresholds:
- ✅ **OK**: Within ±2% of target
- ⚠️ **Watch**: Between ±2% and ±5% of target
- 🔴 **Rebalance**: More than ±5% from target

## Data Flow

### Live Data Fetching

```typescript
// Fetches every 30 seconds
useEffect(() => {
  const fetchLiveData = async () => {
    // 1. Fetch balances from Kraken
    const balances = await fetch('/api/kraken/balance');
    
    // 2. Fetch prices from Kraken
    const prices = await fetch('/api/kraken/prices?symbols=...');
    
    // 3. Calculate holdings
    calculateHoldings(balances, prices, targetWeights);
  };
  
  fetchLiveData();
  const interval = setInterval(fetchLiveData, 30000);
  return () => clearInterval(interval);
}, [currentDBPortfolio]);
```

### API Endpoints Used

#### `/api/kraken/balance`
- **Method**: GET
- **Response**: Account balances for all assets
- **Authentication**: Requires Kraken API credentials

#### `/api/kraken/prices?symbols=XXBTZEUR,XETHZEUR,...`
- **Method**: GET
- **Response**: Current ticker prices for specified pairs
- **Authentication**: None (public endpoint)

#### `/api/portfolios/manage`
- **Method**: GET
- **Response**: All portfolios from database

#### `/api/scheduler/trigger`
- **Method**: POST
- **Body**: `{ portfolioId: string }`
- **Action**: Triggers rebalancing for specified portfolio

## State Management

The dashboard uses Zustand for state management with the following stores:

### Portfolio Store (`usePortfolioStore`)

**State:**
```typescript
{
  dbPortfolios: DBPortfolio[];      // All portfolios from database
  currentDBPortfolio: DBPortfolio | null;  // Active portfolio
  isLoading: boolean;               // Loading state
  error: string | null;             // Error messages
}
```

**Actions:**
```typescript
fetchDBPortfolios(includeHistory?: boolean)  // Load all portfolios
setCurrentDBPortfolio(portfolio)             // Set active portfolio
triggerRebalance(portfolioId)                // Trigger rebalance
```

### Local State (React useState)

```typescript
const [liveBalances, setLiveBalances] = useState<LiveBalance | null>(null);
const [livePrices, setLivePrices] = useState<Record<string, number>>({});
const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
const [totalValue, setTotalValue] = useState(0);
const [isRefreshing, setIsRefreshing] = useState(false);
```

## Component Architecture

```
DashboardPage (Client Component)
├── Sidebar
│   ├── Portfolio List
│   │   └── Portfolio Item (with onClick handler)
│   └── Add Portfolio Button
│
└── Main Content
    ├── Top Bar
    │   ├── Title & Subtitle
    │   └── Action Buttons (Refresh, Rebalance)
    │
    └── Dashboard Content
        ├── Stats Cards (4x)
        ├── Charts Section
        │   ├── Current Allocation (Pie)
        │   ├── Target Allocation (Pie)
        │   └── Comparison (Bar)
        └── Holdings Table
```

## Styling

### Design System

- **Framework**: TailwindCSS
- **Component Library**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

### Color Palette

```typescript
const COLORS = [
  '#3b82f6',  // Blue - BTC
  '#10b981',  // Green - ETH
  '#f59e0b',  // Yellow - SOL
  '#ef4444',  // Red - ADA
  '#8b5cf6',  // Purple
  '#ec4899',  // Pink
];
```

### Responsive Design

- **Mobile**: Single column layout, sidebar collapses
- **Tablet**: 2-column grid for charts
- **Desktop**: Full layout with sidebar + main content

## Usage Examples

### 1. View Portfolio Dashboard

```bash
# Navigate to dashboard
http://localhost:3000/dashboard

# Dashboard will:
# 1. Load all portfolios from database
# 2. Select first portfolio automatically
# 3. Start fetching live data every 30s
```

### 2. Switch Portfolio

Click on any portfolio in the sidebar to switch views instantly.

### 3. Manual Refresh

Click the "Refresh" button to immediately fetch latest data from Kraken.

### 4. Trigger Rebalance

Click "Rebalance Now" to:
1. Fetch current holdings
2. Calculate differences
3. Generate orders
4. Execute trades on Kraken
5. Update database

### 5. Monitor Status

Visual indicators show:
- ✅ Green badges: Portfolio is balanced
- 🔴 Red badges: Rebalancing needed
- ⚠️ Yellow badges: Monitor closely

## Error Handling

### API Errors

```typescript
if (!response.ok) {
  console.error('API Error:', response.statusText);
  // Dashboard shows "No data available" state
}
```

### Missing Credentials

If Kraken API credentials are not configured:
- Balance fetching fails gracefully
- Dashboard shows zeros for balances
- Prices still work (public API)

### Network Errors

```typescript
try {
  await fetchLiveData();
} catch (err) {
  console.error('Network error:', err);
  // Dashboard continues with cached data
}
```

## Performance Optimizations

### 1. Auto-Refresh Interval

```typescript
// Refreshes every 30 seconds
const interval = setInterval(fetchLiveData, 30000);
```

### 2. Conditional Rendering

```typescript
if (isLoading && dbPortfolios.length === 0) {
  return <LoadingSpinner />;
}

if (!currentDBPortfolio) {
  return <EmptyState />;
}
```

### 3. Memoized Calculations

Holdings calculations only run when dependencies change:
```typescript
useEffect(() => {
  // Only recalculate when prices or balances change
  calculateHoldings();
}, [currentDBPortfolio, liveBalances, livePrices]);
```

## Development Tips

### Testing Locally

```bash
# 1. Start development server
npm run dev

# 2. Open dashboard
open http://localhost:3000/dashboard

# 3. Create test portfolio via API
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portfolio",
    "targetWeights": { "BTC": 50, "ETH": 50 },
    "rebalanceEnabled": true,
    "rebalanceInterval": "daily"
  }'
```

### Debugging

Enable detailed logging:
```typescript
// In dashboard page.tsx
console.log('Current portfolio:', currentDBPortfolio);
console.log('Live balances:', liveBalances);
console.log('Live prices:', livePrices);
console.log('Calculated holdings:', holdings);
```

### Customization

#### Change Refresh Interval

```typescript
// Change from 30s to 60s
const interval = setInterval(fetchLiveData, 60000);
```

#### Modify Status Thresholds

```typescript
// Current: 5% triggers rebalance
const rebalanceNeeded = holdings.some(h => Math.abs(h.difference) > 5);

// Custom: 3% triggers rebalance
const rebalanceNeeded = holdings.some(h => Math.abs(h.difference) > 3);
```

#### Add More Charts

```typescript
// Add a line chart for historical performance
<Card>
  <CardHeader>
    <CardTitle>Performance Over Time</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={historicalData}>
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        <XAxis dataKey="date" />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

## Future Enhancements

### Planned Features
- [ ] Add Portfolio modal/form
- [ ] Edit Portfolio inline
- [ ] Historical performance charts
- [ ] Rebalance history log
- [ ] Dark/Light mode toggle
- [ ] Export portfolio data (CSV/JSON)
- [ ] Mobile-responsive sidebar collapse
- [ ] Real-time WebSocket updates
- [ ] Multi-currency support (USD, GBP, etc.)
- [ ] Portfolio comparison view

### API Improvements
- [ ] Caching layer for prices
- [ ] Rate limiting indicators
- [ ] Offline mode with cached data
- [ ] Optimistic UI updates

## Troubleshooting

### Dashboard shows "No portfolios yet"
**Solution**: Create a portfolio via API or UI
```bash
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Portfolio", "targetWeights": {"BTC": 50, "ETH": 50}}'
```

### Balances show as 0.000000
**Solution**: Configure Kraken API credentials in `.env.local`
```bash
KRAKEN_API_KEY=your_api_key
KRAKEN_API_SECRET=your_api_secret
```

### Prices not updating
**Solution**: Check Kraken API status and network connection
```bash
# Test prices endpoint
curl http://localhost:3000/api/kraken/prices?symbols=XXBTZEUR
```

### "Rebalance Now" button does nothing
**Solution**: Check browser console for errors and verify scheduler is running
```bash
# Check scheduler status
curl http://localhost:3000/api/scheduler
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support

## Security Considerations

- API credentials never exposed to client
- All sensitive operations server-side only
- CSRF protection via Next.js
- Input validation on all forms
- Rate limiting on API endpoints

---

**Built with ❤️ using Next.js 14, TailwindCSS, shadcn/ui, and Recharts**

