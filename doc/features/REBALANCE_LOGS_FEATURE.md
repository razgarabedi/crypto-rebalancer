# Rebalance Logs Feature

## Overview
A comprehensive logs system for tracking and viewing all rebalancing activity with transaction details, pagination, and CSV export capabilities.

## Features Implemented

### 1. Logs API Endpoint
**File:** `app/api/rebalance/logs/route.ts`

- **Endpoint:** `GET /api/rebalance/logs`
- **Authentication:** Requires user authentication
- **Query Parameters:**
  - `page` (default: 1) - Current page number
  - `limit` (default: 10) - Number of logs per page
  - `portfolioId` (optional) - Filter by specific portfolio
- **Response:**
  - Paginated rebalance history logs
  - Portfolio details (id, name)
  - Pagination metadata (page, limit, total, totalPages)

### 2. Logs Page UI
**File:** `app/dashboard/logs/page.tsx`

#### Features:
- **Comprehensive Table Display:**
  - Date & Time (formatted)
  - Portfolio name
  - Status badges (Success/Failed, Dry Run)
  - Portfolio value in EUR
  - Orders executed/planned/failed
  - Total value traded
  - Total fees paid
  - Trigger type (manual, scheduler, threshold)
  
- **Expandable Row Details:**
  - Click "Show" to expand individual log entries
  - View all orders with:
    - Buy/Sell badges
    - Asset symbol and volume
    - Transaction IDs (TXID)
    - Individual order fees
    - Execution status
  - Display errors if any occurred
  - Show execution duration

- **Pagination:**
  - 10 logs per page
  - Previous/Next navigation buttons
  - Page count display
  - Disabled state handling

- **Filtering:**
  - Filter by portfolio using dropdown
  - "All Portfolios" option to view everything
  - Auto-refresh when filter changes

- **CSV Export:**
  - One-click export of current logs
  - Includes all key information:
    - Date, Portfolio, Status, Mode
    - Financial data (value, traded, fees)
    - Order details and TXIDs
  - Properly formatted CSV with escaping
  - Auto-download with timestamp in filename

### 3. Navigation Integration
**File:** `components/responsive-sidebar.tsx`

- Added "Rebalance Logs" link to sidebar navigation
- Icon: FileTextIcon
- Shows active state when on logs page
- Works in both expanded and collapsed sidebar modes
- Mobile-responsive

## Data Structure

### RebalanceLog Interface
```typescript
interface RebalanceLog {
  id: string;
  portfolioId: string;
  portfolio: {
    id: string;
    name: string;
  };
  executedAt: string;
  success: boolean;
  dryRun: boolean;
  portfolioValue: number;
  ordersPlanned: number;
  ordersExecuted: number;
  ordersFailed: number;
  totalValueTraded: number;
  totalFees: number;
  orders: Array<{
    symbol: string;
    side: string;
    volume: number;
    executed: boolean;
    txid?: string[];
    fee?: number;
    error?: string;
  }>;
  errors?: string[];
  triggeredBy: string;
  duration?: number;
}
```

## Usage

### Accessing Logs
1. Navigate to the logs page via the sidebar: **Dashboard → Rebalance Logs**
2. Or directly visit: `/dashboard/logs`

### Viewing Logs
1. Logs are displayed in reverse chronological order (newest first)
2. Use the dropdown to filter by portfolio
3. Click "Show" on any log to view detailed order information
4. Transaction IDs (TXIDs) are displayed for each executed order

### Exporting Logs
1. Click the "Export CSV" button in the top-right
2. CSV file is downloaded with timestamp
3. Open in Excel, Google Sheets, or any spreadsheet software

### Pagination
1. Use "Previous" and "Next" buttons to navigate
2. Current page and total pages displayed at the bottom
3. Buttons automatically disable when at first/last page

## CSV Export Format

The exported CSV includes the following columns:
1. Date - Full timestamp of execution
2. Portfolio - Portfolio name
3. Status - Success or Failed
4. Mode - Live or Dry Run
5. Portfolio Value (EUR) - Total portfolio value at time of rebalance
6. Orders Planned - Number of orders generated
7. Orders Executed - Number of successfully executed orders
8. Orders Failed - Number of failed orders
9. Total Traded (EUR) - Total value of all executed trades
10. Total Fees (EUR) - Sum of all trading fees
11. Triggered By - How the rebalance was initiated (manual, scheduler, threshold)
12. Duration (ms) - Execution time in milliseconds
13. Transaction IDs - All Kraken TXIDs separated by pipes (|)

## Database Schema

Uses the existing `RebalanceHistory` model from Prisma:
- Stores all rebalance attempts (successful and failed)
- Includes detailed order information as JSON
- Tracks fees per rebalance
- Records execution metadata

## Security

- User authentication required to access logs
- Users can only view logs for their own portfolios
- API endpoint validates user session
- No sensitive Kraken API keys exposed

## Mobile Responsive

- Responsive table design
- Horizontal scrolling on small screens
- Touch-friendly buttons
- Collapsible sidebar on mobile
- Optimized for tablets and phones

## Future Enhancements

Potential improvements:
1. Date range filtering
2. Search by TXID
3. Export individual log details
4. Real-time log updates
5. Log retention policies
6. Advanced filtering (by status, trigger type, etc.)
7. Charts/analytics based on logs
8. Email notifications for failed rebalances

## Testing

To test the logs feature:
1. Perform a rebalance (manual or automatic)
2. Navigate to the Rebalance Logs page
3. Verify log appears with correct information
4. Click "Show" to expand details
5. Verify TXIDs are displayed
6. Test pagination by creating 10+ rebalance attempts
7. Test CSV export
8. Test portfolio filtering

## Notes

- Logs are persisted in the database
- Each rebalance creates a new log entry
- Dry run rebalances are also logged (marked with "Dry Run" badge)
- Failed rebalances are logged with error details
- TXIDs are captured from Kraken API responses

