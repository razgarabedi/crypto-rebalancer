# Crypto Portfolio Rebalancer

A modern crypto portfolio rebalancing dashboard built with Next.js 14, TypeScript, TailwindCSS, and shadcn/ui. Monitor and rebalance your cryptocurrency portfolio using crypto asset APIs.

## 🆕 What's New (October 2025)

- 🔐 **Multi-User Authentication** - Secure user accounts with registration, login, and session management
- 📊 **TradingView Charts** - Professional-grade charts with TradingView's official widget
- 🔍 **Universal Pair Search** - Search and chart ANY cryptocurrency pair on crypto exchanges (100+ pairs)
- 🕯️ **Advanced Analysis** - Full TradingView features: indicators, drawing tools, and timeframes
- 📈 **Live Market Data** - Real-time price tickers with 24h change indicators
- 🚀 **Production Ready** - Complete nginx deployment documentation for Ubuntu

**See [doc/features/TRADINGVIEW_INTEGRATION.md](./doc/features/TRADINGVIEW_INTEGRATION.md) for chart features and [doc/features/UPDATES_SUMMARY.md](./doc/features/UPDATES_SUMMARY.md) for all updates.**

## Features

- 🔐 **User Authentication** - Secure multi-user support with JWT sessions
- 🔑 **License Activation** - Freemium license system with trial, subscription, and lifetime options
- 👤 **User Profiles** - Manage account, update profile, and change password
- 📊 **Portfolio Visualization** - Interactive charts showing current and target allocations
- 🔄 **Smart Rebalancing** - Get automated recommendations for buying and selling
- 💰 **Real-time Prices** - Live cryptocurrency prices from crypto asset APIs
- 📈 **TradingView Charts** - Professional-grade charts with 100+ indicators and drawing tools
- 🔍 **Universal Search** - Find and chart ANY trading pair available on crypto exchanges
- 🕯️ **Advanced Analysis** - Candlesticks, volume, technical indicators, and more
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🎨 **Modern Stack** - Built with Next.js 14 App Router, TypeScript, and TailwindCSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts, TradingView Official Widget
- **State Management**: Zustand
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **API Integration**: Axios
- **Date Formatting**: date-fns

## Project Structure

```
kraken-rebalancer/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints (NEW)
│   │   ├── market/       # Market data endpoints (NEW)
│   │   ├── portfolios/   # Portfolio CRUD endpoints
│   │   ├── rebalance/    # Rebalancing logic
│   │   └── kraken/       # Kraken API integration
│   ├── auth/             # Auth pages (login, register) (NEW)
│   ├── market/           # Market page with charts (NEW)
│   ├── dashboard/        # Dashboard page
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── portfolio/        # Portfolio-specific components
│   ├── charts/           # Chart components
│   ├── auth-guard.tsx    # Authentication guard (NEW)
│   ├── user-nav.tsx      # User navigation (NEW)
│   └── candlestick-chart.tsx # Candlestick charts (NEW)
├── lib/
│   ├── auth.ts           # Authentication helpers (NEW)
│   ├── kraken.ts         # Kraken REST API client
│   ├── portfolio.ts      # Portfolio calculation helpers
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema (UPDATED)
├── store/
│   └── portfolio-store.ts # Zustand store
└── types/
    ├── portfolio.ts      # Portfolio types
    └── kraken.ts         # Kraken API types
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm, yarn, or pnpm
- PostgreSQL 12+ (for authentication and data persistence)

### Quick Start

For detailed setup instructions, see [doc/setup/SETUP_GUIDE.md](./doc/setup/SETUP_GUIDE.md)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kraken-rebalancer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional):
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

The following environment variables are required:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `LICENSE_SECRET` - Secret key for license signing (REQUIRED for production)

Optional environment variables:

- `NEXT_PUBLIC_APP_URL` - Application URL (default: http://localhost:3000)

## Usage

1. Navigate to the dashboard at `/dashboard`
2. View your portfolio allocation and metrics
3. See rebalancing recommendations based on your target allocation
4. Monitor real-time cryptocurrency prices

## Kraken API Client

The project includes a fully-featured Kraken REST API client in `/lib/kraken.ts`.

### Available Functions

```typescript
import krakenClient from '@/lib/kraken';

// Get account balance
const balance = await krakenClient.getAccountBalance();

// Get ticker prices for multiple symbols
const tickers = await krakenClient.getTickerPrices(['XXBTZUSD', 'XETHZUSD', 'SOLUSD']);

// Place a limit order
const limitOrder = await krakenClient.placeOrder('XXBTZUSD', 'buy', 0.001, 50000);

// Place a market order
const marketOrder = await krakenClient.placeOrder('XETHZUSD', 'sell', 0.5);

// Check if authenticated
const isAuth = krakenClient.isAuthenticated();
```

### Authentication

The client automatically uses environment variables:
- `KRAKEN_API_KEY` - Your Kraken API key
- `KRAKEN_API_SECRET` - Your Kraken API secret

Alternatively, create a custom instance:

```typescript
import { KrakenClient } from '@/lib/kraken';

const client = new KrakenClient({
  apiKey: 'your-key',
  apiSecret: 'your-secret',
});
```

### API Endpoints Supported

- **Public Endpoints** (no auth required):
  - `getTickerPrices()` - Get current prices and market data

- **Private Endpoints** (requires auth):
  - `getAccountBalance()` - Get your account balances
  - `placeOrder()` - Place market or limit orders

See `/lib/kraken.example.ts` for more usage examples.

## Portfolio Helper Functions

The project includes comprehensive portfolio calculation utilities in `/lib/portfolio.ts`.

### Core Functions

```typescript
import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrders,
} from '@/lib/portfolio';

// 1. Calculate portfolio value in EUR
const balances = { BTC: 0.5, ETH: 2.0, SOL: 20 };
const prices = { BTC: 40000, ETH: 2500, SOL: 100 };
const portfolio = calculatePortfolioValue(balances, prices);
// Result: { totalValue: 27000, holdings: [...], currency: 'EUR' }

// 2. Calculate target holdings
const targetWeights = { BTC: 40, ETH: 30, SOL: 30 };
const targetHoldings = calculateTargetHoldings(
  targetWeights,
  portfolio.totalValue,
  prices
);

// 3. Generate rebalance orders
const orders = generateRebalanceOrders(
  portfolio.holdings,
  targetHoldings,
  10 // 10 EUR threshold
);
// Result: [{ symbol: 'BTC', side: 'sell', volume: 0.23, ... }]
```

### Features

- ✅ **EUR-Based Calculations** - All values in EUR
- ✅ **Smart Rebalancing** - Threshold-based order generation
- ✅ **Target Allocation** - Compare current vs. target weights
- ✅ **Buy/Sell Recommendations** - Detailed order instructions
- ✅ **Validation** - Target weight validation
- ✅ **Statistics** - Rebalance summary stats

### API Endpoint

**POST** `/api/portfolio/calculate` - Calculate portfolio and generate orders

```bash
curl -X POST http://localhost:3000/api/portfolio/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
    "rebalanceThreshold": 10
  }'
```

See [doc/features/PORTFOLIO.md](./doc/features/PORTFOLIO.md) for complete documentation.

## Rebalancing Orchestrator

The project includes an automated rebalancing orchestrator in `/lib/rebalance.ts`.

### Main Function

```typescript
import { rebalancePortfolio } from '@/lib/rebalance';

// Execute rebalancing
const result = await rebalancePortfolio('1', {
  targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
  rebalanceThreshold: 10,
  dryRun: false,  // Set to true for preview only
});

// Result includes:
// - portfolio: Current portfolio value and holdings
// - ordersPlanned: What needs to be done
// - ordersExecuted: What was actually executed
// - summary: Statistics (successful, failed, value traded)
```

### Process Flow

1. **Fetch Holdings** - Get current balances from Kraken
2. **Get Prices** - Fetch current EUR prices
3. **Calculate Value** - Compute total portfolio value
4. **Generate Orders** - Compare current vs target allocation
5. **Execute Trades** - Place market orders on Kraken
6. **Log Results** - Comprehensive logging throughout

### Helper Functions

```typescript
// Preview rebalancing (no execution)
const preview = await getRebalancePreview('1');

// Check if rebalancing is needed
const check = await needsRebalancing('1', 50);
if (check.needed) {
  console.log(`${check.orders.length} orders required`);
}
```

### API Endpoints

**POST** `/api/rebalance/execute` - Execute rebalancing
```bash
curl -X POST http://localhost:3000/api/rebalance/execute \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "1",
    "dryRun": true
  }'
```

**GET** `/api/rebalance/check?portfolioId=1` - Check if rebalancing needed

### Features

- ✅ **Automated Execution** - End-to-end orchestration
- ✅ **Dry Run Mode** - Preview before executing
- ✅ **Error Handling** - Comprehensive error recovery
- ✅ **Logging** - Detailed operation logs
- ✅ **Safety Features** - Validation, rate limiting, partial failure handling
- ✅ **Flexible Configuration** - Thresholds, limits, custom targets

See [doc/features/REBALANCE.md](./doc/features/REBALANCE.md) for complete documentation.

## Automated Scheduler

Background job system with cron-based scheduling and PostgreSQL database.

### Setup

```bash
# 1. Install dependencies (already done if you ran npm install)
npm install node-cron prisma @prisma/client

# 2. Configure database in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/kraken_rebalancer"

# 3. Initialize database
npx prisma generate
npx prisma migrate dev --name init

# 4. Configure scheduler
SCHEDULER_ENABLED=true
SCHEDULER_CHECK_INTERVAL="0 * * * *"  # Every hour
SCHEDULER_DRY_RUN=false
```

### Features

```typescript
// Create portfolio with scheduling
const portfolio = await prisma.portfolio.create({
  data: {
    name: "My Portfolio",
    targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
    rebalanceEnabled: true,
    rebalanceInterval: "weekly",  // daily, weekly, monthly
    rebalanceThreshold: 10.0,
  }
});

// Scheduler automatically rebalances based on interval
// History saved to database
```

### Scheduler Control

**GET** `/api/scheduler` - Get status and schedule
```bash
curl http://localhost:3000/api/scheduler
```

**POST** `/api/scheduler` - Control scheduler
```bash
# Start/stop
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

**POST** `/api/scheduler/trigger` - Manual trigger
```bash
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId": "portfolio_id"}'
```

### Portfolio Management

**GET** `/api/portfolios/manage` - List all portfolios  
**POST** `/api/portfolios/manage` - Create portfolio  
**PUT** `/api/portfolios/manage` - Update portfolio  
**DELETE** `/api/portfolios/manage` - Delete portfolio  

### Database Schema

**Portfolio**
- Target weights (JSON)
- Rebalance settings (enabled, interval, threshold)
- Last/next rebalance timestamps
- Rebalance history relation

**RebalanceHistory**
- Execution details (success, orders, value traded)
- Portfolio state at time of rebalance
- Full order details and errors
- Triggered by (scheduler/manual/api)

### Features

- ✅ **Automated Scheduling** - Cron-based job system
- ✅ **Flexible Intervals** - Daily, weekly, monthly
- ✅ **Database Persistence** - PostgreSQL with Prisma
- ✅ **History Tracking** - Complete rebalance history
- ✅ **Manual Triggers** - Override automatic schedule
- ✅ **Dry-Run Mode** - Test without executing
- ✅ **Per-Portfolio Control** - Enable/disable individually

See [doc/implementation/SCHEDULER.md](./doc/implementation/SCHEDULER.md) for complete documentation.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Authentication

The application includes a complete multi-user authentication system.

**Default credentials:**
```
Email: admin@example.com
Password: admin123
```

⚠️ **Change this password immediately in production!**

For complete authentication documentation, see [doc/setup/AUTHENTICATION_GUIDE.md](./doc/setup/AUTHENTICATION_GUIDE.md)

## License Activation System

The software includes a freemium license activation system for commercial distribution.

### For End Users

On first start, you'll be prompted to enter a license key. Get your license key from your software provider.

### For Software Publishers

Generate license keys using the built-in generator:

```bash
# Generate a 30-day trial
npm run license:generate -- --type trial --days 30

# Generate a 1-year subscription
npm run license:generate -- --type subscription --days 365

# Generate a lifetime license
npm run license:generate -- --type lifetime
```

**Important:** Set `LICENSE_SECRET` in your environment variables to a strong random string:

```bash
LICENSE_SECRET=$(openssl rand -base64 32)
```

For complete license system documentation, see [doc/features/LICENSE_SYSTEM.md](./doc/features/LICENSE_SYSTEM.md)

## Deployment

Ready to deploy to production? We've got you covered!

**Complete deployment guide for Ubuntu + Nginx:**
- [doc/deployment/DEPLOYMENT_GUIDE.md](./doc/deployment/DEPLOYMENT_GUIDE.md)

Includes:
- Server setup and configuration
- PostgreSQL installation
- Nginx reverse proxy with HTTP/2
- SSL/TLS with Let's Encrypt
- PM2 process management
- Automated backups
- Security best practices
- Troubleshooting guide

## Completed Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript throughout
- ✅ TailwindCSS + shadcn/ui
- ✅ **Multi-User Authentication** (JWT + bcrypt)
- ✅ **License Activation System** (Freemium with trial/subscription/lifetime)
- ✅ **Real-time Candlestick Charts**
- ✅ **Market Analysis Page**
- ✅ Kraken API integration (REST)
- ✅ Portfolio calculation engine
- ✅ Automated rebalancing orchestrator
- ✅ **Database integration with Prisma + PostgreSQL**
- ✅ **Automated scheduler with cron**
- ✅ **Historical rebalance tracking**
- ✅ **Multiple portfolio support**

## Future Enhancements

- [ ] WebSocket support (real-time prices)
- [ ] Email/webhook notifications
- [ ] Performance analytics dashboard
- [ ] Custom rebalancing strategies
- [ ] Fee optimization
- [ ] Slippage protection
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] More technical indicators on charts
- [ ] Price alerts and notifications
- [ ] API rate limiting
- [ ] Admin panel for user management

## Documentation

All documentation has been organized into the `doc/` folder for better structure:

### 📁 Documentation Structure

```
doc/
├── setup/                    # Setup and environment guides
├── features/                 # Feature documentation and guides  
├── api/                      # API documentation
├── implementation/           # Implementation summaries and details
├── fixes/                    # Bug fixes and improvements
├── testing/                  # Testing guides and checklists
├── deployment/               # Deployment guides
└── user-guides/              # User-facing documentation
```

### 🔧 Setup & Configuration
- **[doc/setup/SETUP_GUIDE.md](./doc/setup/SETUP_GUIDE.md)** - Development environment setup
- **[doc/setup/SETUP_ENVIRONMENT.md](./doc/setup/SETUP_ENVIRONMENT.md)** - Environment configuration
- **[doc/setup/PRISMA_QUICKSTART.md](./doc/setup/PRISMA_QUICKSTART.md)** - Database setup guide
- **[doc/setup/AUTHENTICATION_GUIDE.md](./doc/setup/AUTHENTICATION_GUIDE.md)** - Authentication setup
- **[doc/setup/USER_CREDENTIALS_GUIDE.md](./doc/setup/USER_CREDENTIALS_GUIDE.md)** - User credentials guide

### 🚀 Features & Usage
- **[doc/features/LICENSE_SYSTEM.md](./doc/features/LICENSE_SYSTEM.md)** - License activation and key generation
- **[doc/features/PORTFOLIO.md](./doc/features/PORTFOLIO.md)** - Portfolio calculations
- **[doc/features/REBALANCE.md](./doc/features/REBALANCE.md)** - Rebalancing logic
- **[doc/features/TRADINGVIEW_INTEGRATION.md](./doc/features/TRADINGVIEW_INTEGRATION.md)** - TradingView charts
- **[doc/features/SMART_ROUTING_SUMMARY.md](./doc/features/SMART_ROUTING_SUMMARY.md)** - Smart routing features
- **[doc/features/MOBILE_RESPONSIVE_SUMMARY.md](./doc/features/MOBILE_RESPONSIVE_SUMMARY.md)** - Mobile features

### 🔌 API Documentation
- **[doc/api/KRAKEN_API.md](./doc/api/KRAKEN_API.md)** - Kraken API integration
- **[doc/api/API_REFERENCE.md](./doc/api/API_REFERENCE.md)** - API reference
- **[doc/api/API_IMPLEMENTATION_SUMMARY.md](./doc/api/API_IMPLEMENTATION_SUMMARY.md)** - API implementation
- **[doc/api/RATE_LIMITING_IMPLEMENTATION.md](./doc/api/RATE_LIMITING_IMPLEMENTATION.md)** - Rate limiting

### 🏗️ Implementation Details
- **[doc/implementation/SCHEDULER.md](./doc/implementation/SCHEDULER.md)** - Automated scheduler
- **[doc/implementation/REBALANCE_IMPLEMENTATION.md](./doc/implementation/REBALANCE_IMPLEMENTATION.md)** - Rebalancing implementation
- **[doc/implementation/SMART_ROUTING_IMPLEMENTATION.md](./doc/implementation/SMART_ROUTING_IMPLEMENTATION.md)** - Smart routing implementation
- **[doc/implementation/DASHBOARD_IMPLEMENTATION_SUMMARY.md](./doc/implementation/DASHBOARD_IMPLEMENTATION_SUMMARY.md)** - Dashboard implementation

### 🐛 Bug Fixes & Improvements
- **[doc/fixes/THRESHOLD_REBALANCING_FIX.md](./doc/fixes/THRESHOLD_REBALANCING_FIX.md)** - Threshold rebalancing fixes
- **[doc/fixes/ERROR_HANDLING_IMPROVEMENTS.md](./doc/fixes/ERROR_HANDLING_IMPROVEMENTS.md)** - Error handling improvements
- **[doc/fixes/PERFORMANCE_SNAPSHOT_FIX.md](./doc/fixes/PERFORMANCE_SNAPSHOT_FIX.md)** - Performance fixes

### 🧪 Testing
- **[doc/testing/MOBILE_TESTING_CHECKLIST.md](./doc/testing/MOBILE_TESTING_CHECKLIST.md)** - Mobile testing guide
- **[doc/testing/REBALANCE_TESTING_GUIDE.md](./doc/testing/REBALANCE_TESTING_GUIDE.md)** - Rebalancing testing

### 🚀 Deployment
- **[doc/deployment/DEPLOYMENT_GUIDE.md](./doc/deployment/DEPLOYMENT_GUIDE.md)** - Production deployment with Ubuntu + Nginx

### 👥 User Guides
- **[doc/user-guides/DASHBOARD.md](./doc/user-guides/DASHBOARD.md)** - Dashboard features
- **[doc/user-guides/QUICKSTART.md](./doc/user-guides/QUICKSTART.md)** - Quick start guide
- **[doc/user-guides/USER_PROFILE_GUIDE.md](./doc/user-guides/USER_PROFILE_GUIDE.md)** - User profile management
- **[doc/user-guides/QUICK_FEATURE_GUIDE.md](./doc/user-guides/QUICK_FEATURE_GUIDE.md)** - Feature overview

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
