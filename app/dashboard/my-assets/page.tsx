'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Wallet, TrendingUp, ArrowLeft, AlertCircle, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/hooks/use-i18n';

interface LiveBalance {
  [symbol: string]: number;
}

interface LivePrice {
  symbol: string;
  price: number;
  ask: number;
  bid: number;
  volume24h: number;
}

interface AssetHolding {
  symbol: string;
  balance: number;
  price: number;
  value: number;
  percentage: number;
}

export default function MyAssetsPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [, setLiveBalances] = useState<LiveBalance>({});
  const [, setLivePrices] = useState<Record<string, number>>({});
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [needsCredentials, setNeedsCredentials] = useState(false);

  const fetchLiveData = async (forceRefresh: boolean = false) => {
    try {
      setIsRefreshing(true);

      // Fetch balances first
      const balances: LiveBalance = {};
      try {
        const balanceRes = await fetch('/api/kraken/balance');
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setNeedsCredentials(false); // Clear the flag if successful
          balanceData.balance?.forEach((item: { asset: string; amount: number }) => {
            // Normalize like analytics and API: handle XBT/XXBT->BTC, ETH variants->ETH, strip leading X/Z
            const normalizeSymbol = (asset: string): string => {
              const withoutSuffix = String(asset || '').replace(/\.(F|S|M|P)$/i, '');
              const mapping: Record<string, string> = { XBT: 'BTC', XXBT: 'BTC', XETH: 'ETH', ETH2: 'ETH', XETH2: 'ETH' };
              const mapped = mapping[withoutSuffix] || mapping[asset as string];
              if (mapped) return mapped;
              const stripped = withoutSuffix.replace(/^(X|Z)/, '');
              if (/^ETH\d+$/i.test(stripped)) return 'ETH';
              return stripped;
            };
            const symbol = normalizeSymbol(item.asset);
            const current = balances[symbol] || 0;
            balances[symbol] = current + item.amount;
          });
        } else if (balanceRes.status === 400) {
          const errorData = await balanceRes.json();
          if (errorData.needsCredentials) {
            setNeedsCredentials(true);
            setIsLoading(false);
            return; // Skip further processing
          }
        }
      } catch {
        // Silent fail - will show "No assets found" UI
      }

      // Set balances state
      setLiveBalances(balances);

      // Fetch prices for assets with balances
      const assetsWithBalances = Object.keys(balances).filter(s => balances[s] > 0);
      
      if (assetsWithBalances.length > 0) {
        // Build pair maps dynamically from Kraken
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
        } catch {
          // continue with USD fallback if needed
        }

        // Choose EUR pairs when available
        const validPricePairs = assetsWithBalances
          .map(symbol => symbol === 'EUR' ? null : eurPairsByBase.get(symbol) || null)
          .filter(Boolean) as string[];
        
        // Set special prices for base currencies and handle USD conversion
        const prices: Record<string, number> = {};
        
        // EUR is the base currency, so its price is 1.00
        if (assetsWithBalances.includes('EUR')) {
          prices['EUR'] = 1.00;
        }
        
        // Get EUR/USD rate for conversions
        let eurUsdRate = 1.0;
        try {
          const eurUsdRes = await fetch(`/api/kraken/prices?symbols=EURUSD${forceRefresh ? '&force=true' : ''}`);
          if (eurUsdRes.ok) {
            const eurUsdData = await eurUsdRes.json();
            if (eurUsdData.tickers && eurUsdData.tickers.length > 0) {
              eurUsdRate = eurUsdData.tickers[0].price;
            }
          }
        } catch {
          // Use default rate of 1.0
        }
        
        // Handle assets that don't have EUR pairs by trying USD pairs
        const assetsNeedingUsdConversion = assetsWithBalances.filter(asset => {
          return asset !== 'EUR' && !prices[asset];
        });
        
        for (const asset of assetsNeedingUsdConversion) {
          try {
            const possibleUsdPairs = [
              usdPairsByBase.get(asset) || null,
              // Simple fallbacks if not found
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
            console.warn('Some prices could not be fetched:', priceError);
            // Continue with partial price data
          }
        }

        // External fallback for assets Kraken doesn't list (e.g., BNB)
        const missingPriceAssets = assetsWithBalances.filter(a => !prices[a]);
        for (const asset of missingPriceAssets) {
          try {
            if (asset === 'BNB') {
              const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=eur');
              if (r.ok) {
                const j = await r.json();
                const p = j?.binancecoin?.eur;
                if (typeof p === 'number' && isFinite(p)) {
                  prices['BNB'] = p;
                }
              }
            }
          } catch {
            // ignore
          }
        }
        
        setLivePrices(prices);
        
        // Also trigger holdings calculation immediately with the prices we just fetched
        const calculatedHoldings: AssetHolding[] = [];
        let total = 0;

        // Calculate holdings for all assets in wallet
        Object.entries(balances).forEach(([symbol, balance]) => {
          // Skip if balance is zero
          if (balance <= 0) return;
          
          // Try to get price for this asset
          const price = prices[symbol] || 0;
          const value = balance * price;
          
          calculatedHoldings.push({
            symbol,
            balance,
            price,
            value,
            percentage: 0, // Will calculate after total is known
          });
          
          // Only add to total if we have a valid price
          if (price > 0) {
            total += value;
          }
        });

        // Fallback: if ETH has a balance but no EUR price, fetch USD and convert
        if (assetsWithBalances.includes('ETH') && !prices['ETH']) {
          try {
            const eurUsdRes = await fetch(`/api/kraken/prices?symbols=EURUSD${forceRefresh ? '&force=true' : ''}`);
            let eurUsdRate = 1.0;
            if (eurUsdRes.ok) {
              const eurUsdData = await eurUsdRes.json();
              if (eurUsdData.tickers && eurUsdData.tickers.length > 0) {
                eurUsdRate = eurUsdData.tickers[0].price;
              }
            }
            const ethUsdRes = await fetch(`/api/kraken/prices?symbols=XETHZUSD${forceRefresh ? '&force=true' : ''}`);
            if (ethUsdRes.ok) {
              const ethUsdData = await ethUsdRes.json();
              if (ethUsdData.tickers && ethUsdData.tickers.length > 0) {
                prices['ETH'] = ethUsdData.tickers[0].price / eurUsdRate;
              }
            }
          } catch {
            // ignore
          }
        }

        // Calculate percentages
        calculatedHoldings.forEach(holding => {
          holding.percentage = total > 0 ? (holding.value / total) * 100 : 0;
        });

        // Sort by value (highest first)
        calculatedHoldings.sort((a, b) => b.value - a.value);
        
        setHoldings(calculatedHoldings);
        setTotalValue(total);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching live data:', err);
      toast.error('Failed to fetch live data', {
        description: err instanceof Error ? err.message : 'Please check your connection and try again'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Note: Holdings calculation is now done immediately in fetchLiveData function
  // to avoid timing issues with state updates

  // Initial data fetch
  useEffect(() => {
    fetchLiveData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchLiveData(true);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <Button variant="link" onClick={handleBackToDashboard} className="mb-4 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.myAssets.backToDashboard}
          </Button>
          <h1 className="text-3xl font-bold">{t.myAssets.title}</h1>
          <p className="text-muted-foreground">{t.myAssets.subtitle}</p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6">
        <Button variant="link" onClick={handleBackToDashboard} className="mb-4 pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.myAssets.backToDashboard}
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.myAssets.title}</h1>
            <p className="text-muted-foreground">{t.myAssets.subtitle}</p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.myAssets.refresh}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Portfolio Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              {t.myAssets.portfolioSummary}
            </CardTitle>
            <CardDescription>{t.myAssets.portfolioSummaryDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xl md:text-2xl font-bold">€{totalValue.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">{t.myAssets.totalPortfolioValue}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{holdings.length}</p>
                <p className="text-sm text-muted-foreground">{t.myAssets.assets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials Warning */}
        {needsCredentials && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    {t.myAssets.krakenCredentialsRequired}
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                    {t.myAssets.credentialsDescription}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild size="sm" variant="default">
                      <Link href="/profile">
                        <Key className="mr-2 h-4 w-4" />
                        {t.myAssets.addApiCredentials}
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="https://support.kraken.com/hc/en-us/articles/360000919966-How-to-generate-an-API-key-pair" target="_blank" rel="noopener noreferrer">
                        {t.myAssets.howToGetApiKeys}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              {t.myAssets.assetHoldings}
            </CardTitle>
            <CardDescription>{t.myAssets.assetHoldingsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {needsCredentials ? (
              <div className="text-center py-8">
                <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.myAssets.apiCredentialsRequired}</h3>
                <p className="text-muted-foreground mb-4">
                  {t.myAssets.addCredentialsDescription}
                </p>
                <Button asChild>
                  <Link href="/profile">
                    {t.myAssets.goToProfile}
                  </Link>
                </Button>
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.myAssets.noAssetsFound}</h3>
                <p className="text-muted-foreground">
                  {t.myAssets.noAssetsDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">{holding.symbol}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {holding.balance.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 8 })} {holding.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-semibold">
                          €{holding.value.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {holding.price > 0 && (
                          <Badge variant="secondary">
                            {holding.percentage.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      {holding.price > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          €{holding.price.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.myAssets.perAsset} {holding.symbol}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {holding.symbol === 'EUR' ? t.myAssets.baseCurrency : 
                           holding.symbol === 'BNB.F' ? t.myAssets.priceNotAvailableKraken : 
                           t.myAssets.priceNotAvailable}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
