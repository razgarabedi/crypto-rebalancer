# Portfolio Scheduler Fix

## Problem Summary

The original scheduler implementation had several critical issues:

1. **❌ Global Scheduler**: Used a single global scheduler that ran at the most frequent interval
2. **❌ Configuration Reset**: Scheduler settings would reset when portfolios were reloaded
3. **❌ No Individual Control**: All portfolios used the same check frequency regardless of their settings
4. **❌ Persistence Issues**: Scheduler would stop and need manual restart

## Root Causes

1. **Single Global Scheduler**: The old system used one scheduler for all portfolios
2. **Most Frequent Interval Logic**: It would find the most frequent check interval and use that for all portfolios
3. **No Per-Portfolio Tasks**: Individual portfolios couldn't have their own schedules
4. **Manual Start Required**: Scheduler required manual initialization

## Solution Implemented

### New Per-Portfolio Scheduler System

Created a completely new scheduler system (`lib/portfolio-scheduler.ts`) that:

#### ✅ Individual Portfolio Tasks
- Each portfolio gets its own scheduler task
- Tasks run based on the portfolio's individual `checkFrequency` setting
- No more global scheduler conflicts

#### ✅ Automatic Persistence
- Scheduler starts automatically when the application starts
- Global monitor checks for portfolio changes every minute
- Automatically creates/updates/removes tasks based on portfolio settings

#### ✅ Respects Individual Settings
- Portfolio with `checkFrequency: "hourly"` runs every hour
- Portfolio with `checkFrequency: "5_minutes"` runs every 5 minutes
- Portfolio with `checkFrequency: "daily"` runs daily at 9 AM
- Each portfolio operates independently

#### ✅ No More Resets
- Scheduler persists across server restarts
- Portfolio settings are read from database, not from global config
- No manual intervention required

## Technical Implementation

### Key Components

1. **PortfolioScheduler Class**: Main scheduler class that manages individual portfolio tasks
2. **Global Monitor**: Runs every minute to sync portfolio tasks with database settings
3. **Individual Tasks**: Each portfolio gets its own cron task based on its frequency
4. **Automatic Sync**: Tasks are automatically created/updated/removed based on portfolio changes

### API Updates

- Updated `/api/scheduler` to use the new portfolio scheduler
- Added support for manual portfolio triggers
- Improved status reporting with individual portfolio information

### Database Integration

- Reads portfolio settings directly from database
- No global configuration needed
- Automatic detection of portfolio changes

## Usage Examples

### Check Frequency Mappings

```typescript
'5_minutes'    → '*/5 * * * *'   // Every 5 minutes
'hourly'       → '0 * * * *'     // Every hour
'every_2_hours' → '0 */2 * * *'  // Every 2 hours
'every_4_hours' → '0 */4 * * *'  // Every 4 hours
'daily'        → '0 9 * * *'     // Daily at 9 AM
```

### API Endpoints

```bash
# Get scheduler status
GET /api/scheduler

# Stop scheduler
POST /api/scheduler
{
  "action": "stop"
}

# Trigger specific portfolio
POST /api/scheduler
{
  "action": "trigger-portfolio",
  "config": {
    "portfolioId": "portfolio-id"
  }
}
```

## Benefits

### ✅ Individual Control
- Each portfolio runs on its own schedule
- No interference between portfolios
- Respects individual portfolio settings

### ✅ Automatic Persistence
- No manual start required
- Survives server restarts
- Automatically syncs with database changes

### ✅ Flexible Scheduling
- Support for multiple check frequencies
- Easy to add new frequencies
- Per-portfolio customization

### ✅ Better Monitoring
- Individual portfolio task tracking
- Detailed status reporting
- Manual trigger support

## Testing

### Test Scripts Created

1. **`scripts/test-portfolio-scheduler.ts`**: Tests the new scheduler functionality
2. **`scripts/demo-portfolio-scheduler.ts`**: Demonstrates how the system works
3. **`scripts/monitor-scheduler.ts`**: Monitors scheduler status

### Verification

```bash
# Test the new scheduler
npx tsx scripts/test-portfolio-scheduler.ts

# Demo the system
npx tsx scripts/demo-portfolio-scheduler.ts

# Monitor status
npx tsx scripts/monitor-scheduler.ts
```

## Migration Notes

### Breaking Changes
- Old global scheduler is replaced with per-portfolio scheduler
- API responses now include individual portfolio information
- Configuration is now read from database, not environment variables

### Backward Compatibility
- All existing portfolio settings are preserved
- No database migration required
- Existing portfolios continue to work with their current settings

## Future Enhancements

1. **Advanced Scheduling**: Support for more complex schedules (e.g., business hours only)
2. **Priority Queues**: Different priority levels for different portfolios
3. **Load Balancing**: Distribute tasks across multiple workers
4. **Metrics**: Detailed performance metrics for each portfolio task

## Conclusion

The new per-portfolio scheduler system provides:

- ✅ **Individual Control**: Each portfolio runs on its own schedule
- ✅ **Automatic Persistence**: No manual intervention required
- ✅ **Flexible Scheduling**: Support for multiple check frequencies
- ✅ **Better Monitoring**: Detailed status and control options

This solves the original problems and provides a much more robust and flexible scheduling system.
