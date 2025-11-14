'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolioStore } from '@/store';

// Import startup module to ensure scheduler starts (server-side only)
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/startup');
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PlusIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  WalletIcon,
  AlertCircleIcon,
  ActivityIcon,
  DollarSignIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { ResponsiveSidebar } from '@/components/responsive-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { ResponsiveTable } from '@/components/responsive-table';
import { ResponsivePieChart, ResponsiveBarChart, ResponsiveLineChart } from '@/components/responsive-charts';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
import { useI18n } from '@/lib/hooks/use-i18n';

interface LiveBalance {
  [asset: string]: number;
}

interface LivePrice {
  symbol: string;
  price: number;
}

interface PortfolioHolding {
  symbol: string;
  balance: number;
  price: number;
  value: number;
  percentage: number;
  targetPercentage: number;
  difference: number;
}

const COLORS = ['#0969da', '#1a7f37', '#9333ea', '#d97706', '#dc2626', '#db2777'];

export default function DashboardPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const {
    dbPortfolios,
    currentDBPortfolio,
    isLoading,
    error,
    fetchDBPortfolios,
    setCurrentDBPortfolio,
    triggerRebalance,
  } = usePortfolioStore();

  const [liveBalances, setLiveBalances] = useState<LiveBalance | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRebalanceDialog, setShowRebalanceDialog] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<Array<{ date: string; value: number }>>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nextCheckTime, setNextCheckTime] = useState<Date | null>(null);
  const [timeUntilNextCheck, setTimeUntilNextCheck] = useState<string>('');

  // Fetch portfolios from database
  useEffect(() => {
    fetchDBPortfolios(true);
  }, [fetchDBPortfolios]);

  // Set first portfolio as current if none selected
  useEffect(() => {
    if (dbPortfolios.length > 0 && !currentDBPortfolio) {
      setCurrentDBPortfolio(dbPortfolios[0]);
    }
  }, [dbPortfolios, currentDBPortfolio, setCurrentDBPortfolio]);

  // Fetch live balances and prices
  useEffect(() => {
    if (!currentDBPortfolio) return;

    const fetchLiveData = async (forceRefresh: boolean = false) => {
      setIsRefreshing(true);
      try {
        // Fetch balances (if API credentials configured)
        try {
          const balanceRes = await fetch('/api/kraken/balance');
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            const balances: LiveBalance = {};
            balanceData.balance?.forEach((item: { asset: string; amount: number }) => {
              // API already returns normalized symbols in `asset` (e.g., BTC, ETH, EUR)
              const symbol = item.asset;
              const current = balances[symbol] || 0;
              balances[symbol] = current + item.amount;
            });
            setLiveBalances(balances);
          }
        } catch {
          console.log('Balance fetch not available (API credentials may not be configured)');
        }

        // Fetch prices for assets in target weights (portfolio assets only)
        const targetSymbols = Object.keys(currentDBPortfolio.targetWeights as Record<string, number>);
        
        // Only fetch prices for portfolio assets, not wallet assets
        const allSymbols = targetSymbols;
        
        // Fetch Kraken pairs and build dynamic maps (EUR/USD)
        const eurPairsByBase = new Map<string, string>();
        const usdPairsByBase = new Map<string, string>();
        try {
          const pairsRes = await fetch('/api/kraken/pairs');
          if (pairsRes.ok) {
            const pairsData = await pairsRes.json();
            const pairs: Array<{ pair: string; base: string; quote: string }> = pairsData.pairs || [];
            for (const p of pairs) {
              const base = (p.base || '').replace(/^X+|^Z+/, '');
              const quote = p.quote || '';
              if (quote === 'ZEUR' || quote === 'EUR') {
                if (!eurPairsByBase.has(base)) eurPairsByBase.set(base, p.pair);
              } else if (quote === 'ZUSD' || quote === 'USD') {
                if (!usdPairsByBase.has(base)) usdPairsByBase.set(base, p.pair);
              }
            }
          }
        } catch {/* ignore */}

        // Build EUR price pairs for portfolio assets
        const validPricePairs = allSymbols
          .map(symbol => symbol === 'EUR' ? null : eurPairsByBase.get(symbol) || null)
          .filter(Boolean) as string[];
        
        // Set up prices object with EUR pairs
        const prices: Record<string, number> = {};
        
        // EUR is the base currency, so its price is always 1.00
        if (allSymbols.includes('EUR')) {
          prices['EUR'] = 1.00;
        }
        
        // Fetch EUR pairs first
        if (validPricePairs.length > 0) {
          try {
            const pricesRes = await fetch(`/api/kraken/prices?symbols=${validPricePairs.join(',')}${forceRefresh ? '&force=true' : ''}`);
            if (pricesRes.ok) {
              const pricesData = await pricesRes.json();
              pricesData.tickers?.forEach((ticker: LivePrice) => {
                // Map Kraken symbols back to our symbols
                let symbol = ticker.symbol.replace(/EUR$/, '').replace(/^X+/, '');
                // Handle special cases for Kraken naming conventions
                if (ticker.symbol === 'XXBTZEUR') symbol = 'BTC';
                if (ticker.symbol === 'XETHZEUR') symbol = 'ETH';
                // For other coins, the symbol should already be correct after removing EUR suffix
                prices[symbol] = ticker.price;
              });
            }
          } catch (priceError) {
            console.warn('Some EUR prices could not be fetched:', priceError);
          }
        }
        
        // Get EUR/USD rate for USD conversions
        let eurUsdRate = 1.0;
        try {
          const eurUsdRes = await fetch(`/api/kraken/prices?symbols=EURUSD${forceRefresh ? '&force=true' : ''}`);
          if (eurUsdRes.ok) {
            const eurUsdData = await eurUsdRes.json();
            if (eurUsdData.tickers && eurUsdData.tickers.length > 0) {
              eurUsdRate = eurUsdData.tickers[0].price;
            }
          }
        } catch (error) {
          console.log('Could not fetch EURUSD rate, using 1.0:', error);
        }
        
        // Handle stablecoins - set approximate EUR value if not found
        const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD'];
        for (const stablecoin of stablecoins) {
          if (allSymbols.includes(stablecoin) && !prices[stablecoin]) {
            // Stablecoins are pegged to USD, so convert to EUR using EUR/USD rate
            prices[stablecoin] = 1.0 / eurUsdRate;
          }
        }
        
        // Handle assets that don't have EUR pairs by trying USD pairs
        const assetsNeedingUsdConversion = allSymbols.filter(asset => {
          return asset !== 'EUR' && !prices[asset] && !stablecoins.includes(asset);
        });
        
        for (const asset of assetsNeedingUsdConversion) {
          try {
            const possibleUsdPairs = [
              usdPairsByBase.get(asset) || null,
              `${asset}USD`,
              `X${asset}ZUSD`,
              `XX${asset}ZUSD`
            ].filter(Boolean) as string[];
            
            for (const usdPair of possibleUsdPairs) {
              try {
            const usdRes = await fetch(`/api/kraken/prices?symbols=${usdPair}${forceRefresh ? '&force=true' : ''}`);
                
                if (usdRes.ok) {
                  const usdData = await usdRes.json();
                  
                  if (usdData.tickers && usdData.tickers.length > 0) {
                    const usdPrice = usdData.tickers[0].price;
                    const eurPrice = usdPrice / eurUsdRate;
                    prices[asset] = eurPrice;
                    break; // Found price, move to next asset
                  }
                }
              } catch {
                // Try next pair format
                continue;
              }
            }
          } catch {
            // Asset will show as "Price not available"
          }
        }
        
        // Fallback: if ETH is in portfolio but EUR price missing, try USD pair and convert
        if (allSymbols.includes('ETH') && !prices['ETH']) {
          try {
            const ethUsdRes = await fetch('/api/kraken/prices?symbols=XETHZUSD');
            if (ethUsdRes.ok) {
              const ethUsdData = await ethUsdRes.json();
              if (ethUsdData.tickers && ethUsdData.tickers.length > 0) {
                const ethUsd = ethUsdData.tickers[0].price;
                prices['ETH'] = ethUsd / eurUsdRate;
              }
            }
          } catch {
            // ignore
          }
        }

        setLivePrices(prices);
      } catch (err) {
        console.error('Error fetching live data:', err);
        toast.error('Failed to fetch live data', {
          description: err instanceof Error ? err.message : 'Please check your connection and try again'
        });
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchLiveData();
    // Manual refresh only - no automatic refresh
  }, [currentDBPortfolio]);

  // Fetch scheduler status
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/scheduler');
      if (response.ok) {
        const data = await response.json();
        
        // Find the current portfolio's next run time from scheduler data
        if (currentDBPortfolio && data.schedule) {
          const portfolioSchedule = data.schedule.find((p: { id: string; nextRebalanceAt: Date | null }) => p.id === currentDBPortfolio.id);
          if (portfolioSchedule && portfolioSchedule.nextRebalanceAt) {
            setNextCheckTime(new Date(portfolioSchedule.nextRebalanceAt));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  }, [currentDBPortfolio]);

  // Fetch scheduler status on component mount and when portfolio changes
  useEffect(() => {
    fetchSchedulerStatus();
  }, [fetchSchedulerStatus]);

  // Calculate holdings
  useEffect(() => {
    if (!currentDBPortfolio) {
      return;
    }


    const targetWeights = currentDBPortfolio.targetWeights as Record<string, number>;
    const calculatedHoldings: PortfolioHolding[] = [];
    let total = 0;
    
    // Check if we have prices for all non-EUR assets
    const allAssets = Object.keys(targetWeights);
    const nonEurAssets = allAssets.filter(symbol => symbol !== 'EUR');
    const hasPricesForAllAssets = nonEurAssets.every(symbol => {
      const price = livePrices[symbol];
      return price !== undefined && price > 0;
    });

    // First, calculate holdings for assets in target weights
    Object.entries(targetWeights).forEach(([symbol, targetPercentage]) => {
      const balance = liveBalances?.[symbol] || 0;
      let price = livePrices[symbol];
      
      // Special handling for EUR and stablecoins if price not found
      if (price === undefined || price === 0) {
        if (symbol === 'EUR') {
          price = 1.00;
        } else if (['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD'].includes(symbol)) {
          // Stablecoins approximate EUR value (around 0.90-0.95 EUR typically)
          price = 0.92; // Conservative estimate if EUR/USD rate not available
        } else {
          price = 0;
        }
      }
      
      const value = balance * price;
      total += value;

      calculatedHoldings.push({
        symbol,
        balance,
        price,
        value,
        percentage: 0, // Will calculate after total is known
        targetPercentage,
        difference: 0,
      });
    });

    // Note: Wallet assets are now displayed on the separate "My Assets" page
    // This dashboard only shows portfolio target allocation vs actual holdings

    // Calculate percentages and differences
    calculatedHoldings.forEach(holding => {
      holding.percentage = total > 0 ? (holding.value / total) * 100 : 0;
      holding.difference = holding.percentage - holding.targetPercentage;
    });

    setHoldings(calculatedHoldings);
    setTotalValue(total);

    // Only record performance history if we have prices for all assets
    // This prevents recording partial portfolio values (e.g., only EUR before crypto prices load)
    if (total > 0 && currentDBPortfolio && (allAssets.length === 0 || allAssets.every(s => s === 'EUR') || hasPricesForAllAssets)) {
      const recordPerformanceSnapshot = async () => {
        try {
          // Calculate asset values for current holdings
          const assetValues: Record<string, number> = {};
          calculatedHoldings.forEach(holding => {
            if (holding.value > 0) {
              assetValues[holding.symbol] = holding.value;
            }
          });

          const response = await fetch('/api/performance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              portfolioId: currentDBPortfolio.id,
              totalValue: total,
              assetValues,
            }),
          });

          if (!response.ok) {
            console.warn('Failed to record performance snapshot:', response.status);
          }
        } catch (error) {
          console.warn('Failed to record performance snapshot:', error);
        }
      };

      // Only record if this is a significant change (avoid recording every small fluctuation)
      recordPerformanceSnapshot();
    }
  }, [currentDBPortfolio, liveBalances, livePrices]);

  const handleRebalanceClick = () => {
    setShowRebalanceDialog(true);
  };

  const handleRebalanceConfirm = async () => {
    if (!currentDBPortfolio) return;
    
    setShowRebalanceDialog(false);
    const toastId = toast.loading('Rebalancing portfolio...');
    
    try {
      await triggerRebalance(currentDBPortfolio.id);
      toast.success('Portfolio rebalanced successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to rebalance portfolio', { 
        id: toastId,
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  // Fetch performance history from API
  useEffect(() => {
    if (!currentDBPortfolio) {
      setPerformanceHistory([]);
      return;
    }

    const fetchPerformanceHistory = async () => {
      try {
        const response = await fetch(`/api/performance?portfolioId=${currentDBPortfolio.id}&days=30`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.performanceHistory) {
            setPerformanceHistory(data.performanceHistory);
          } else {
            setPerformanceHistory([]);
          }
        } else {
          setPerformanceHistory([]);
        }
      } catch (error) {
        console.error('Error fetching performance history:', error);
        setPerformanceHistory([]);
      }
    };

    fetchPerformanceHistory();
  }, [currentDBPortfolio]);


  // Update countdown timer
  useEffect(() => {
    if (!nextCheckTime) {
      setTimeUntilNextCheck('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = nextCheckTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilNextCheck('Now');
        // Refresh scheduler status when countdown reaches zero
        fetchSchedulerStatus();
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeUntilNextCheck(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilNextCheck(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilNextCheck(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second for more accuracy
    
    return () => clearInterval(interval);
  }, [nextCheckTime, fetchSchedulerStatus]);

  // Refresh scheduler status periodically to get updated next run times
  useEffect(() => {
    const interval = setInterval(fetchSchedulerStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSchedulerStatus]);

  const rebalanceNeeded = holdings.some(h => Math.abs(h.difference) > 5);

  // Show skeleton loader while loading
  if (isLoading && dbPortfolios.length === 0) {
    return (
      <AuthGuard>
        <DashboardSkeleton />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Responsive Sidebar */}
        <ResponsiveSidebar />

        {/* Mobile Navigation */}
        <MobileNav
        currentPortfolio={currentDBPortfolio}
        onRefresh={() => window.location.reload()}
        onRebalance={handleRebalanceClick}
        onEdit={() => currentDBPortfolio && router.push(`/dashboard/${currentDBPortfolio.id}/edit`)}
        onDelete={() => setShowDeleteDialog(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 border-b bg-card z-10">
          <div className="flex items-center justify-between p-4 md:p-6 pr-16 lg:pr-6">
            <div className="min-w-0 flex-1 pl-12 lg:pl-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {currentDBPortfolio?.name || t.dashboard.title}
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {t.dashboard.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop Actions */}
              <div className="hidden lg:flex gap-2">
                <Button variant="outline" onClick={() => router.push('/dashboard/my-assets')}>
                  <WalletIcon className="mr-2 h-4 w-4" />
                  {t.dashboard.myAssets}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} disabled={isRefreshing}>
                  <RefreshCwIcon className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {t.dashboard.refresh}
                </Button>
                {currentDBPortfolio && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/${currentDBPortfolio.id}/edit`)}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      {t.dashboard.edit}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      {t.dashboard.delete}
                    </Button>
                  </>
                )}
                <Button onClick={handleRebalanceClick} disabled={!currentDBPortfolio || isLoading}>
                  <ActivityIcon className="mr-2 h-4 w-4" />
                  {t.dashboard.rebalanceNow}
                </Button>
              </div>
              
              {/* Mobile/Tablet Actions - Hidden on mobile, shown on tablet */}
              <div className="hidden md:flex lg:hidden gap-2">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/my-assets')}>
                  <WalletIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.location.reload()} disabled={isRefreshing}>
                  <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleRebalanceClick} disabled={!currentDBPortfolio || isLoading} size="sm">
                  <ActivityIcon className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Rebalance</span>
                </Button>
              </div>
              
              <div className="hidden md:flex items-center gap-4">
                <UserNav />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!currentDBPortfolio ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <WalletIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">{t.dashboard.noPortfolioSelected}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t.dashboard.createPortfolioDescription}
                </p>
                <Button onClick={() => router.push('/dashboard/new')}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {t.dashboard.createPortfolio}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.totalValue}</CardTitle>
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{totalValue.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.portfolioBalance}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.assets}</CardTitle>
                    <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{holdings.length}</div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.cryptocurrencies}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.rebalanceStatus}</CardTitle>
                    <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {rebalanceNeeded ? (
                        <Badge variant="destructive">{t.dashboard.needed}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          {t.dashboard.balanced}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rebalanceNeeded ? t.dashboard.actionRequired : t.dashboard.withinTarget}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.tradingFeesPaid}</CardTitle>
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{(currentDBPortfolio.totalFeesPaid || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentDBPortfolio.orderType === 'limit' ? t.dashboard.usingMakerOrders : t.dashboard.usingTakerOrders}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info Cards */}
              {/* Last Rebalanced and Order Type - 2 columns on mobile */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.lastRebalanced}</CardTitle>
                    <RefreshCwIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currentDBPortfolio.lastRebalancedAt
                        ? new Date(currentDBPortfolio.lastRebalancedAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
                        : t.dashboard.never}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentDBPortfolio.rebalanceEnabled || currentDBPortfolio.thresholdRebalanceEnabled 
                        ? (currentDBPortfolio.rebalanceEnabled ? `${t.dashboard.next}: ${currentDBPortfolio.rebalanceInterval}` : t.dashboard.thresholdBased) 
                        : t.dashboard.manualOnly}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.orderType}</CardTitle>
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currentDBPortfolio.orderType === 'limit' ? t.dashboard.limitMaker : t.dashboard.marketTaker}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentDBPortfolio.orderType === 'limit' 
                        ? t.dashboard.lowerFees
                        : t.dashboard.higherFees}
                    </p>
                  </CardContent>
                </Card>

                {/* Rebalancing Strategy Card - Full width on mobile, part of 3-column grid on larger screens */}
                <Card className="col-span-2 lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.rebalancingStrategy}</CardTitle>
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currentDBPortfolio.rebalanceEnabled && currentDBPortfolio.thresholdRebalanceEnabled 
                        ? t.dashboard.both
                        : currentDBPortfolio.rebalanceEnabled 
                          ? t.dashboard.timeBased
                          : currentDBPortfolio.thresholdRebalanceEnabled
                            ? t.dashboard.threshold
                            : t.dashboard.manual}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentDBPortfolio.rebalanceEnabled && (
                        <span>⏱️ {currentDBPortfolio.rebalanceInterval}</span>
                      )}
                      {currentDBPortfolio.rebalanceEnabled && currentDBPortfolio.thresholdRebalanceEnabled && <span> + </span>}
                      {currentDBPortfolio.thresholdRebalanceEnabled && (
                        <span>📊 {currentDBPortfolio.thresholdRebalancePercentage || 3}% {t.dashboard.deviation}</span>
                      )}
                      {!currentDBPortfolio.rebalanceEnabled && !currentDBPortfolio.thresholdRebalanceEnabled && (
                        <span>{t.dashboard.manualOnly}</span>
                      )}
                    </p>
                    {/* Monitoring Status Indicator */}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={currentDBPortfolio.schedulerEnabled !== false ? "default" : "secondary"} className="text-xs">
                        {currentDBPortfolio.schedulerEnabled !== false ? "🟢 Auto" : "⚪ Manual"}
                      </Badge>
                      {currentDBPortfolio.schedulerEnabled !== false && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {currentDBPortfolio.checkFrequency?.replace('_', ' ') || 'hourly'}
                        </span>
                      )}
                    </div>
                    {/* Countdown Timer */}
                    {timeUntilNextCheck && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        ⏰ Next check: {timeUntilNextCheck}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Current Allocation Pie Chart */}
                <ResponsivePieChart
                  title={t.dashboard.currentAllocation}
                  description={t.dashboard.currentAllocationDescription}
                  data={holdings.map(h => ({ name: h.symbol, value: h.percentage }))}
                  colors={COLORS}
                />

                {/* Target Allocation Pie Chart */}
                <ResponsivePieChart
                  title={t.dashboard.targetAllocation}
                  description={t.dashboard.targetAllocationDescription}
                  data={holdings.map(h => ({ name: h.symbol, value: h.targetPercentage }))}
                  colors={COLORS}
                />
              </div>

              {/* Comparison Chart */}
              <ResponsiveBarChart
                title={t.dashboard.currentVsTarget}
                description={t.dashboard.currentVsTargetDescription}
                data={holdings.map(h => ({ name: h.symbol, current: h.percentage, target: h.targetPercentage }))}
                dataKey="current"
                xAxisKey="name"
              />

              {/* Performance History Chart */}
              {performanceHistory.length > 0 && (
                <ResponsiveLineChart
                  title={t.dashboard.portfolioPerformance}
                  description={t.dashboard.portfolioPerformanceDescription}
                  data={performanceHistory}
                  dataKey="value"
                  xAxisKey="date"
                />
              )}

              {/* Holdings Table */}
              <ResponsiveTable
                title={t.dashboard.holdingsAndTarget}
                description={t.dashboard.holdingsAndTargetDescription}
                data={holdings}
                compactMobile={true}
                columns={[
                  { key: 'symbol', label: t.dashboard.asset, className: 'font-medium' },
                  { 
                    key: 'balance', 
                    label: t.dashboard.balance, 
                    className: 'text-right',
                    mobileHidden: true, // Hide on mobile for compactness
                    render: (value) => (value as number).toFixed(6)
                  },
                  { 
                    key: 'price', 
                    label: t.dashboard.price, 
                    className: 'text-right',
                    mobileHidden: true, // Hide on mobile for compactness
                    render: (value) => `€${(value as number).toFixed(2)}`
                  },
                  { 
                    key: 'value', 
                    label: t.dashboard.value, 
                    className: 'text-right',
                    render: (value) => `€${(value as number).toFixed(2)}`
                  },
                  { 
                    key: 'percentage', 
                    label: t.dashboard.currentPercent, 
                    className: 'text-right',
                    render: (value) => `${(value as number).toFixed(2)}%`
                  },
                  { 
                    key: 'targetPercentage', 
                    label: t.dashboard.targetPercent, 
                    className: 'text-right',
                    render: (value) => `${(value as number).toFixed(2)}%`
                  },
                  { 
                    key: 'difference', 
                    label: t.dashboard.difference, 
                    className: 'text-right',
                    render: (value) => {
                      const numValue = value as number;
                      return (
                        <span className={numValue > 0 ? 'text-green-600 dark:text-green-400' : numValue < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                          {numValue > 0 ? '+' : ''}{numValue.toFixed(2)}%
                        </span>
                      );
                    }
                  },
                  { 
                    key: 'difference', 
                    label: t.dashboard.status, 
                    className: 'text-right',
                    render: (value) => {
                      const numValue = value as number;
                      const diff = Math.abs(numValue);
                      if (diff > 5) {
                        return <Badge variant="destructive" className="text-xs">{t.dashboard.rebalance}</Badge>;
                      } else if (diff > 2) {
                        return <Badge variant="outline" className="text-yellow-600 dark:text-yellow-500 text-xs">{t.dashboard.watch}</Badge>;
                      } else {
                        return <Badge variant="outline" className="text-green-600 dark:text-green-400 text-xs">{t.dashboard.ok}</Badge>;
                      }
                    }
                  }
                ]}
              />
            </div>
          )}
        </div>
      </main>

      {/* Rebalance Confirmation Dialog */}
      <AlertDialog open={showRebalanceDialog} onOpenChange={setShowRebalanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dashboard.confirmRebalancing}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dashboard.confirmRebalancingDescription}
              <br /><br />
              <strong>{t.dashboard.portfolio}:</strong> {currentDBPortfolio?.name}
              <br />
              <strong>{t.dashboard.currentValue}:</strong> €{totalValue.toFixed(2)}
              <br />
              <strong>{t.dashboard.ordersNeeded}:</strong> {holdings.filter(h => Math.abs(h.difference) > 5).length}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dashboard.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRebalanceConfirm}>
              {t.dashboard.continueRebalancing}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Portfolio Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dashboard.deletePortfolio}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dashboard.deletePortfolioDescription}
              {currentDBPortfolio ? ` "${currentDBPortfolio.name}"` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dashboard.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!currentDBPortfolio) return;
                setShowDeleteDialog(false);
                const toastId = toast.loading(t.dashboard.deletingPortfolio);
                try {
                  // lazy import to avoid reordering store destructure
                  const { usePortfolioStore: useStore } = await import('@/store/portfolio-store');
                  const { deleteDBPortfolio, fetchDBPortfolios, setCurrentDBPortfolio } = useStore.getState();
                  await deleteDBPortfolio(currentDBPortfolio.id);
                  await fetchDBPortfolios(true);
                  // Select first portfolio if available
                  const state = useStore.getState();
                  if (state.dbPortfolios.length > 0) {
                    setCurrentDBPortfolio(state.dbPortfolios[0]);
                  } else {
                    setCurrentDBPortfolio(null);
                  }
                  toast.success(t.dashboard.portfolioDeleted, { id: toastId });
                } catch (err) {
                  toast.error(t.dashboard.failedToDeletePortfolio, {
                    id: toastId,
                    description: err instanceof Error ? err.message : 'Unknown error',
                  });
                }
              }}
            >
              {t.dashboard.deletePortfolio}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AuthGuard>
  );
}

