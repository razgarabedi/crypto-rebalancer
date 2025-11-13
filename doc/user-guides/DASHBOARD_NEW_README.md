# Create New Portfolio Page

## Overview

A comprehensive form page for creating new cryptocurrency portfolios with an intuitive user interface.

**Location:** `/app/dashboard/new`

---

## Features

### ✅ Form Fields

1. **Portfolio Name**
   - Text input
   - Required field
   - Example: "Conservative Portfolio", "Aggressive Strategy"

2. **Asset Allocation**
   - Dynamic list of assets with target weights
   - Add/remove assets
   - Symbol input with autocomplete suggestions
   - Weight input (percentage)
   - Real-time total weight calculation
   - Validation (must sum to 100%)

3. **Rebalancing Settings**
   - Enable/disable automatic rebalancing
   - Rebalance interval dropdown (daily, weekly, bi-weekly, monthly, quarterly)
   - Rebalance threshold (EUR)
   - Max orders per rebalance

### ✅ User Experience

- **Auto-complete**: Common asset symbols (BTC, ETH, SOL, ADA, DOT, MATIC, LINK, AVAX, ATOM, UNI)
- **Helper Buttons**:
  - "Distribute Evenly" - Splits 100% equally among all assets
  - "Normalize to 100%" - Adjusts weights proportionally to sum to 100%
- **Real-time Validation**: Total weight indicator with visual feedback
- **Error Messages**: Clear validation errors
- **Loading States**: Shows loading indicator during submission
- **Responsive Design**: Works on all screen sizes

---

## Usage

### Accessing the Page

From the dashboard:
1. Click "Add Portfolio" button in the sidebar
2. Or click "Create Portfolio" in the empty state

Direct URL:
```
http://localhost:3000/dashboard/new
```

### Creating a Portfolio

1. **Enter Portfolio Name**
   ```
   Portfolio Name: "My Crypto Portfolio"
   ```

2. **Define Asset Allocation**
   ```
   Assets:
   - BTC: 40%
   - ETH: 30%
   - SOL: 20%
   - ADA: 10%
   
   Total: 100% ✓
   ```

3. **Configure Rebalancing** (Optional)
   ```
   Enable Automatic Rebalancing: Yes
   Rebalance Interval: Weekly
   Rebalance Threshold: 10 EUR
   Max Orders Per Rebalance: 10
   ```

4. **Submit**
   - Click "Create Portfolio"
   - Automatically redirects to dashboard
   - New portfolio appears in sidebar

---

## Form Validation

### Required Fields
- ✅ Portfolio name cannot be empty
- ✅ At least one asset is required
- ✅ All assets must have a symbol
- ✅ All weights must be greater than 0
- ✅ Total weight must equal 100%
- ✅ No duplicate asset symbols

### Optional Validation
- Rebalance threshold must be > 0 (if enabled)
- Max orders must be > 0 (if enabled)

### Visual Indicators
- **Green Badge**: Total weight is 100% ✓
- **Red Badge**: Total weight is not 100% ✗
- **Error Messages**: Displayed below invalid fields
- **Error Alert**: Summary of all errors at top of page

---

## API Integration

### Zustand Store Action

The form uses `createDBPortfolio()` from the portfolio store:

```typescript
import { usePortfolioStore } from '@/store';

const { createDBPortfolio, isLoading, error } = usePortfolioStore();

// On submit
const portfolio = await createDBPortfolio({
  name: 'My Portfolio',
  targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
  rebalanceEnabled: true,
  rebalanceInterval: 'weekly',
  rebalanceThreshold: 10,
  maxOrdersPerRebalance: 10,
});
```

### Backend API

The store calls `POST /api/portfolios/manage`:

```bash
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Portfolio",
    "targetWeights": {"BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10},
    "rebalanceEnabled": true,
    "rebalanceInterval": "weekly",
    "rebalanceThreshold": 10,
    "maxOrdersPerRebalance": 10
  }'
```

### Database Storage

Data is saved to PostgreSQL via Prisma:

```prisma
model Portfolio {
  id                    String   @id @default(cuid())
  name                  String
  targetWeights         Json
  rebalanceEnabled      Boolean  @default(false)
  rebalanceInterval     String   @default("weekly")
  rebalanceThreshold    Float    @default(10.0)
  maxOrdersPerRebalance Int?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Code Structure

### Component Architecture

```
NewPortfolioPage
├── Header Section
│   ├── Back Button
│   └── Title + Description
│
├── Error Alert (conditional)
│
├── Form
│   ├── Basic Information Card
│   │   └── Portfolio Name Input
│   │
│   ├── Asset Allocation Card
│   │   ├── Helper Buttons (Distribute, Normalize)
│   │   ├── Asset List (dynamic)
│   │   │   ├── Symbol Input
│   │   │   ├── Weight Input
│   │   │   └── Remove Button
│   │   ├── Add Asset Button
│   │   └── Total Weight Indicator
│   │
│   ├── Rebalancing Settings Card
│   │   ├── Enable Toggle
│   │   ├── Interval Select
│   │   ├── Threshold Input
│   │   └── Max Orders Input
│   │
│   └── Action Buttons
│       ├── Cancel Button
│       └── Create Button
```

### State Management

```typescript
// Form state
const [portfolioName, setPortfolioName] = useState('');
const [assets, setAssets] = useState<AssetWeight[]>([...]);
const [rebalanceInterval, setRebalanceInterval] = useState('weekly');
const [rebalanceEnabled, setRebalanceEnabled] = useState(true);
const [rebalanceThreshold, setRebalanceThreshold] = useState(10);
const [maxOrders, setMaxOrders] = useState(10);

// Validation state
const [errors, setErrors] = useState<Record<string, string>>({});

// Store state
const { createDBPortfolio, isLoading, error } = usePortfolioStore();
```

### Helper Functions

```typescript
// Add new asset to list
const addAsset = () => { ... }

// Remove asset from list
const removeAsset = (index: number) => { ... }

// Update asset symbol
const updateAssetSymbol = (index: number, symbol: string) => { ... }

// Update asset weight
const updateAssetWeight = (index: number, weight: string) => { ... }

// Validate entire form
const validateForm = (): boolean => { ... }

// Handle form submission
const handleSubmit = async (e: React.FormEvent) => { ... }

// Auto-distribute weights evenly
const distributeEvenly = () => { ... }

// Normalize weights to 100%
const normalizeWeights = () => { ... }
```

---

## Examples

### Example 1: Conservative Portfolio

```
Portfolio Name: Conservative
Assets:
  BTC: 60%
  ETH: 40%
Total: 100% ✓

Rebalancing:
  Enabled: Yes
  Interval: Monthly
  Threshold: 15 EUR
  Max Orders: 5
```

### Example 2: Balanced Portfolio

```
Portfolio Name: Balanced Strategy
Assets:
  BTC: 40%
  ETH: 30%
  SOL: 20%
  ADA: 10%
Total: 100% ✓

Rebalancing:
  Enabled: Yes
  Interval: Weekly
  Threshold: 10 EUR
  Max Orders: 10
```

### Example 3: Aggressive Portfolio

```
Portfolio Name: High Risk High Reward
Assets:
  BTC: 25%
  ETH: 25%
  SOL: 25%
  ADA: 15%
  DOT: 10%
Total: 100% ✓

Rebalancing:
  Enabled: Yes
  Interval: Daily
  Threshold: 5 EUR
  Max Orders: 20
```

### Example 4: HODLer Portfolio

```
Portfolio Name: Long-term HODL
Assets:
  BTC: 80%
  ETH: 20%
Total: 100% ✓

Rebalancing:
  Enabled: No
  (Manual rebalancing only)
```

---

## Styling

### Design System

- **Framework**: TailwindCSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Color Scheme**: Consistent with dashboard

### Component Styling

```typescript
// Cards
<Card className="...">
  <CardHeader>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Form Inputs
<Input
  type="text"
  placeholder="..."
  value={...}
  onChange={...}
  className={errors.field ? 'border-destructive' : ''}
/>

// Buttons
<Button variant="outline" size="sm">...</Button>
<Button type="submit" disabled={isLoading}>...</Button>

// Badges
<Badge variant="outline">Valid</Badge>
<Badge variant="destructive">Must be 100%</Badge>
```

---

## Accessibility

- ✅ **Labels**: All inputs have proper labels
- ✅ **Required Fields**: Marked with asterisk (*)
- ✅ **Error Messages**: Associated with fields
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Focus Management**: Proper tab order
- ✅ **ARIA Labels**: Screen reader support
- ✅ **Color Contrast**: WCAG AA compliant

---

## Error Handling

### Client-side Validation

Errors are displayed in two places:

1. **Error Alert** (top of form)
   ```
   ⚠️ Validation Errors
   - Portfolio name is required
   - Total weight must be 100% (currently 95%)
   ```

2. **Inline Errors** (below fields)
   ```
   Portfolio Name: _____________
   ❌ Portfolio name is required
   ```

### Server-side Errors

Store errors are displayed in the error alert:
```typescript
if (storeError) {
  // Display error from Zustand store
  <p className="text-destructive">{storeError}</p>
}
```

### Network Errors

Handled by try-catch in submit handler:
```typescript
try {
  await createDBPortfolio(...);
} catch (err) {
  console.error('Failed to create portfolio:', err);
  // Error is set in store and displayed
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Portfolio name validation
- [ ] Asset symbol validation
- [ ] Weight validation (must be > 0)
- [ ] Total weight validation (must be 100%)
- [ ] Duplicate symbol detection
- [ ] Add asset functionality
- [ ] Remove asset functionality
- [ ] Distribute evenly button
- [ ] Normalize weights button
- [ ] Rebalance toggle
- [ ] Form submission
- [ ] Loading state
- [ ] Error display
- [ ] Cancel button (navigation)
- [ ] Success redirect

### Test Cases

**Test 1: Valid Form**
```
Input: Name="Test", Assets=[BTC:50, ETH:50], Enabled=true
Expected: Success, redirect to dashboard
```

**Test 2: Missing Name**
```
Input: Name="", Assets=[BTC:100]
Expected: Error "Portfolio name is required"
```

**Test 3: Invalid Total Weight**
```
Input: Name="Test", Assets=[BTC:40, ETH:40]
Expected: Error "Total weight must be 100% (currently 80%)"
```

**Test 4: Duplicate Symbols**
```
Input: Name="Test", Assets=[BTC:50, BTC:50]
Expected: Error "Duplicate asset symbols found"
```

**Test 5: Distribute Evenly**
```
Input: 4 assets with any weights
Action: Click "Distribute Evenly"
Expected: All assets have 25% weight
```

---

## Performance

### Optimizations

- ✅ Minimal re-renders (controlled inputs)
- ✅ Efficient state updates
- ✅ Debounced validation (on submit)
- ✅ Lazy loading of suggestions

### Load Time

- Initial render: < 100ms
- Form submission: < 1s (depends on network)

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Future Enhancements

### Planned Features
- [ ] Save as draft
- [ ] Load from template
- [ ] Import from JSON
- [ ] Export configuration
- [ ] Advanced validation rules
- [ ] Historical performance preview
- [ ] Risk assessment
- [ ] Backtesting simulation

### UI Improvements
- [ ] Drag-and-drop asset reordering
- [ ] Visual weight slider
- [ ] Asset search/filter
- [ ] Quick presets (Conservative, Balanced, Aggressive)
- [ ] Multi-step wizard
- [ ] Tooltips for all fields

---

## Troubleshooting

### Form not submitting?
- Check if total weight equals 100%
- Ensure portfolio name is not empty
- Verify all asset symbols are filled
- Check browser console for errors

### Weights not adding to 100%?
- Click "Normalize to 100%" button
- Or manually adjust weights
- Use decimals for precision (e.g., 33.33%)

### Can't remove last asset?
- At least one asset is required
- Add another asset first, then remove

### Page not redirecting?
- Check if portfolio was created (look in dashboard)
- Check browser console for errors
- Verify API endpoint is running

---

## Related Documentation

- [Dashboard Documentation](../DASHBOARD.md)
- [API Reference](../../api/API_REFERENCE.md)
- [Portfolio Store](../../../store/portfolio-store.ts)
- [Prisma Schema](../../../prisma/schema.prisma)

---

## Contact

For issues or questions:
- Check console for error messages
- Review validation errors in form
- Ensure database is running
- Verify API endpoints are accessible

---

**Happy Portfolio Creating! 🎯📈💼**

