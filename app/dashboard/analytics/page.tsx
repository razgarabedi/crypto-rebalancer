'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, Brain, Lightbulb, RefreshCw, Target, TrendingUp, TrendingDown, Activity, Users, Code2, AlertTriangle, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/hooks/use-i18n';

type PriceMap = Record<string, number>;

interface PortfolioSummary {
  totalValue: number;
  holdings: Array<{
    symbol: string;
    amount: number;
    value: number;
    percentage: number;
  }>;
}

interface DBPortfolio {
  id: string;
  name: string;
  targetWeights: Record<string, number>;
  schedulerEnabled?: boolean;
}

export default function SmartAnalyticsDashboard() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-6xl p-6">Loading analytics…</div>}>
      <SmartAnalyticsDashboardInner />
    </Suspense>
  );
}

function SmartAnalyticsDashboardInner() {
  const router = useRouter();
  const { language, t } = useI18n();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolios, setPortfolios] = useState<DBPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceMap>({});
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [sparklinePoints, setSparklinePoints] = useState<number[]>([]);
  const [pl, setPl] = useState<{ d1: number; w1: number; m1: number }>({ d1: 0, w1: 0, m1: 0 });
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [innovationInsights, setInnovationInsights] = useState<{
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
  } | null>(null);
  const [performanceRisk, setPerformanceRisk] = useState<{
    metrics: Array<{
      symbol: string;
      return7d: number;
      return30d: number;
      return90d: number;
      volatility: number;
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
  } | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [performanceLoadingProgress, setPerformanceLoadingProgress] = useState(0);
  const [performanceLoadingStatus, setPerformanceLoadingStatus] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsLoadingProgress, setInsightsLoadingProgress] = useState(0);
  const [insightsLoadingStatus, setInsightsLoadingStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pageLoadingProgress, setPageLoadingProgress] = useState(5); // Start at 5% so bar is visible immediately
  const [pageLoadingStatus, setPageLoadingStatus] = useState<string>('Initializing...');

  const fetchAll = async (forceRefresh: boolean = false, explicitPortfolioId?: string | null) => {
    setIsRefreshing(true);
    setIsLoading(true); // Ensure loading state is set
    setPageLoadingProgress(5);
    setPageLoadingStatus('Initializing...');
    
    try {
      // 1) Load portfolios (target allocations)
      setPageLoadingProgress(10);
      const pfRes = await fetch('/api/portfolios/manage');
      let list: DBPortfolio[] = portfolios;
      if (pfRes.ok) {
        const data = await pfRes.json();
        list = data.portfolios || [];
        setPortfolios(list);
      } else if (pfRes.status === 401) {
        list = [];
        setPortfolios([]);
      }
      setPageLoadingProgress(25);
      setPageLoadingStatus('Fetching balances...');

      // Determine active portfolio:
      // 1. Use explicitPortfolioId if provided (for portfolio changes)
      // 2. Otherwise use URL param
      // 3. Otherwise use current selectedPortfolioId state
      // 4. Otherwise use first portfolio
      const spParam = searchParams.get('portfolio');
      const portfolioIdToUse = explicitPortfolioId !== undefined 
        ? explicitPortfolioId 
        : (spParam && list.find(p => p.id === spParam) ? spParam : (selectedPortfolioId || list[0]?.id || null));
      
      // Update selectedPortfolioId state if it changed
      if (portfolioIdToUse !== selectedPortfolioId) {
        setSelectedPortfolioId(portfolioIdToUse);
      }

      const active = portfolioIdToUse ? list.find(p => p.id === portfolioIdToUse) : list[0];
      // Normalize portfolio target symbols to align with balance/prices (BTC, ETH, etc.)
      const normalizeSym = (asset: string): string => {
        const withoutSuffix = String(asset || '').replace(/\.(F|S|M|P)$/i, '');
        const mapping: Record<string, string> = { XBT: 'BTC', XXBT: 'BTC', XETH: 'ETH', ETH2: 'ETH', XETH2: 'ETH' };
        const mapped = mapping[withoutSuffix] || mapping[asset as string];
        if (mapped) return mapped;
        const stripped = withoutSuffix.replace(/^(X|Z)/, '');
        if (/^ETH\d+$/i.test(stripped)) return 'ETH';
        return stripped;
      };
      const rawTargets = active?.targetWeights || {};
      const normalizedTargets: Record<string, number> = {};
      Object.entries(rawTargets).forEach(([k, v]) => {
        const nk = normalizeSym(k);
        normalizedTargets[nk] = (normalizedTargets[nk] || 0) + (v || 0);
      });
      setTargets(normalizedTargets);
      const portfolioSymbols = Object.keys(normalizedTargets);
      // Only consider assets that are part of the selected portfolio
      const allSymbols = portfolioSymbols;

      // 2) Load raw Kraken balance and normalize symbols, then restrict to portfolio assets
      setPageLoadingProgress(35);
      let holdings: Array<{ symbol: string; amount: number }> = [];
      if (portfolioSymbols.length > 0) {
        try {
          const balanceRes = await fetch('/api/kraken/balance');
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            const map: Record<string, number> = {};
            // Normalize similar to server to ensure BTC (XBT/XXBT) and ETH variants map correctly
            const normalizeSymbol = (asset: string): string => {
              const withoutSuffix = asset.replace(/\.(F|S|M|P)$/i, '');
              const mapping: Record<string, string> = {
                XBT: 'BTC',
                XXBT: 'BTC',
                XETH: 'ETH',
                ETH2: 'ETH',
                XETH2: 'ETH',
              };
              const mapped = mapping[withoutSuffix] || mapping[asset];
              if (mapped) return mapped;
              // Strip leading X or Z if present (Kraken base assets often prefix with X/Z)
              const stripped = withoutSuffix.replace(/^(X|Z)/, '');
              // Collapse ETH staking variants like ETH2, ETH2.S
              if (/^ETH\d+$/i.test(stripped)) return 'ETH';
              return stripped;
            };
            balanceData.balance?.forEach((item: { asset: string; amount: number }) => {
              const symbol = normalizeSymbol(String(item.asset || ''));
              if (!map[symbol]) map[symbol] = 0;
              map[symbol] += Number(item.amount || 0);
            });
            holdings = portfolioSymbols.map(sym => ({ symbol: sym, amount: map[sym] || 0 }));
          }
        } catch {
          // Fallback: no balances available
          holdings = portfolioSymbols.map(sym => ({ symbol: sym, amount: 0 }));
        }
      }

      // 3) Fetch EUR prices (discover valid Kraken pairs first)
      setPageLoadingProgress(50);
      setPageLoadingStatus('Fetching prices...');
      const computedPrices: PriceMap = {};
      if (allSymbols.length > 0) {
        // Build pair map from Kraken with proper base normalization
        const pairsRes = await fetch('/api/kraken/pairs');
        const eurPairsByBase = new Map<string, string>();
        const normalizeBase = (base: string): string => {
          // Exact special cases first
          if (base === 'XXBT' || base === 'XBT') return 'BTC';
          if (base === 'XETH' || base === 'ETH') return 'ETH';
          // Strip a single leading X or Z if present
          const b = base.replace(/^(X|Z)/, '');
          return b;
        };
        if (pairsRes.ok) {
          const pairsData = await pairsRes.json();
          const pairs: Array<{ pair: string; base: string; quote: string }> = pairsData.pairs || [];
          for (const p of pairs) {
            const base = normalizeBase(p.base || '');
            const quote = p.quote || '';
            if (quote === 'ZEUR' || quote === 'EUR') {
              if (!eurPairsByBase.has(base)) eurPairsByBase.set(base, p.pair);
            }
          }
        }

        const validPairs = allSymbols
          .filter(s => s !== 'EUR')
          .map(s => eurPairsByBase.get(s) || null)
          .filter(Boolean) as string[];

        if (validPairs.length > 0) {
          const resp = await fetch(`/api/kraken/prices?symbols=${validPairs.join(',')}${forceRefresh ? '&force=true' : ''}`);
          if (resp.ok) {
            const data = await resp.json();
            data.tickers?.forEach((t: { symbol: string; price: number }) => {
              // Kraken pairs like XXBTZEUR → base XXBT, quote ZEUR
              const withoutQuote = t.symbol.replace(/(Z?EUR)$/i, '');
              const baseRaw = withoutQuote.replace(/Z$/i, '');
              const baseNorm = normalizeBase(baseRaw);
              computedPrices[baseNorm] = t.price;
            });
          }
        }

        // EUR base
        computedPrices['EUR'] = 1.0;
        setPrices(computedPrices);
      }

      // 4) Build portfolio summary using current prices state
      // Merge portfolio symbols with current holdings; keep only portfolio assets
      const holdingsMap = Object.fromEntries(holdings.map(h => [h.symbol, h.amount]));
      const holdingsWithValue = portfolioSymbols.map(sym => ({
        symbol: sym,
        amount: holdingsMap[sym] || 0,
        value: ((computedPrices[sym] ?? prices[sym] ?? 0) as number) * (holdingsMap[sym] || 0),
      }));
      const totalValue = holdingsWithValue.reduce((acc, h) => acc + h.value, 0);
      const withPct = holdingsWithValue
        .map(h => ({ ...h, percentage: totalValue > 0 ? (h.value / totalValue) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);

      setPageLoadingProgress(75);
      setPageLoadingStatus('Calculating portfolio summary...');
      
      setSummary({
        totalValue,
        holdings: withPct,
      });

      setPageLoadingProgress(90);
      setPageLoadingStatus('Finalizing...');
      
      // Don't set isLoading to false yet - keep it until we're ready to show content
      // This ensures the loading bar stays visible

      // 5) Sparkline & P/L: approximate portfolio history from top 4 assets using candles (hourly)
      // This runs in background - doesn't block page render
      const topAssets = withPct
        .filter(h => h.symbol !== 'EUR')
        .map(h => h.symbol)
        .slice(0, 4);
      if (topAssets.length > 0) {
        // Fetch last ~48 hours hourly candles for each top asset
        const series: Record<string, number[]> = {};
        for (const sym of topAssets) {
          try {
            // Reuse discovered EUR pair mapping if available
            let pairForCandles: string | undefined;
            {
              // Build a minimal local map again to avoid state threading
              const pairsRes2 = await fetch('/api/kraken/pairs');
              const map2 = new Map<string, string>();
              const normalizeBase2 = (base: string): string => {
                if (base === 'XXBT' || base === 'XBT') return 'BTC';
                if (base === 'XETH' || base === 'ETH') return 'ETH';
                return base.replace(/^(X|Z)/, '');
              };
              if (pairsRes2.ok) {
                const data2 = await pairsRes2.json();
                const allPairs: Array<{ pair: string; base: string; quote: string }> = data2.pairs || [];
                for (const p of allPairs) {
                  const q = p.quote || '';
                  if (q === 'ZEUR' || q === 'EUR') {
                    const b = normalizeBase2(p.base || '');
                    if (!map2.has(b)) map2.set(b, p.pair);
                  }
                }
              }
              pairForCandles = map2.get(sym) || undefined;
            }
            const r = await fetch(`/api/market/candles?symbol=${encodeURIComponent(pairForCandles || sym + 'EUR')}&interval=60`);
            if (r.ok) {
              const data: { candles?: Array<{ close: number }> } = await r.json();
              const closes: number[] = (data.candles || []).slice(-48).map((c) => c.close);
              if (closes.length > 0) series[sym] = closes;
            }
          } catch {}
        }

        // Normalize lengths and compute portfolio series using current percentage weights
        const len = Math.min(...Object.values(series).map(a => a.length));
        if (isFinite(len) && len > 5) {
          const weights: Record<string, number> = {};
          withPct.forEach(h => { weights[h.symbol] = h.percentage / 100; });

          const portfolioSeries: number[] = [];
          for (let i = 0; i < len; i++) {
            let v = 0;
            for (const sym of Object.keys(series)) {
              const w = weights[sym] || 0;
              v += (series[sym][series[sym].length - len + i] || 0) * w;
            }
            portfolioSeries.push(v);
          }
          setSparklinePoints(portfolioSeries);

          // P/L percentages from close changes: 24h (~24 points), 7d (~7*24), 30d (~30*24) if available
          const last = portfolioSeries[portfolioSeries.length - 1];
          const pct = (v: number) => (v ? ((last - v) / v) * 100 : 0);
          const d1Idx = portfolioSeries.length - 24 - 1;
          const w1Idx = portfolioSeries.length - 24 * 7 - 1;
          const m1Idx = portfolioSeries.length - 24 * 30 - 1;
          setPl({
            d1: d1Idx >= 0 ? pct(portfolioSeries[d1Idx]) : 0,
            w1: w1Idx >= 0 ? pct(portfolioSeries[w1Idx]) : 0,
            m1: m1Idx >= 0 ? pct(portfolioSeries[m1Idx]) : 0,
          });
        }
      }

      // Innovation Insights and Performance Analytics are now lazy-loaded when user opens those tabs
      // Don't fetch them here to avoid rate limiting on page load
      
      // Now mark as loaded - all essential data is ready
      setPageLoadingProgress(100);
      setPageLoadingStatus('Complete!');
      
      // Set loading to false after summary is ready
      setIsLoading(false);
      
      // Clear loading bar after a moment (longer delay to ensure user sees completion)
      setTimeout(() => {
        setPageLoadingProgress(0);
        setPageLoadingStatus('');
      }, 1000);
    } catch (error) {
      // On error, still mark as not loading
      setIsLoading(false);
      setPageLoadingProgress(0);
      setPageLoadingStatus('');
      console.error('Error loading analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Lazy-load innovation insights when user clicks load button
  const fetchInnovationInsights = async () => {
    if (innovationInsights || isLoadingInsights) return; // Already loaded or loading
    
    const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
    if (portfolioSymbols.length === 0) return;

    setIsLoadingInsights(true);
    setInsightsLoadingProgress(0);
    setInsightsLoadingStatus('Initializing...');

    try {
      const symbolsForInsights = portfolioSymbols.join(',');

      // Innovation insights uses CoinGecko with sequential fetching
      // Estimate: ~1.5s per symbol + overhead (optimized from 3.5s)
      const estimatedSeconds = (portfolioSymbols.length - 1) * 1.5 + 10; // ~1.5s per symbol + 10s overhead
      const updateInterval = 100; // Update progress every 100ms
      const progressPerUpdate = 100 / (estimatedSeconds * 1000 / updateInterval);
      
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress = Math.min(95, currentProgress + progressPerUpdate); // Cap at 95% until actual completion
        setInsightsLoadingProgress(currentProgress);
        
        const elapsedSeconds = Math.floor((currentProgress / 100) * estimatedSeconds);
        const remainingSeconds = Math.max(1, Math.ceil(estimatedSeconds - elapsedSeconds));
        setInsightsLoadingStatus(`Fetching innovation insights from CoinGecko... Estimated ${remainingSeconds}s remaining`);
      }, updateInterval);

      try {
        const insightsRes = await fetch(
          `/api/analytics/innovation-insights?symbols=${encodeURIComponent(symbolsForInsights)}`
        );
        
        clearInterval(progressTimer);
        setInsightsLoadingProgress(100);
        setInsightsLoadingStatus('Processing data...');
        
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          setInnovationInsights(insightsData);
          setInsightsLoadingStatus('Complete!');
          
          // Clear status after a moment
          setTimeout(() => {
            setInsightsLoadingStatus('');
            setInsightsLoadingProgress(0);
          }, 1000);
        } else {
          throw new Error('Failed to fetch innovation insights');
        }
      } catch (error) {
        clearInterval(progressTimer);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching innovation insights:', error);
      setInsightsLoadingStatus('Error loading data. Please try again.');
      setInsightsLoadingProgress(0);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Lazy-load performance analytics when tab is opened
  const fetchPerformanceAnalytics = async () => {
    if (performanceRisk || isLoadingPerformance) return; // Already loaded or loading
    
    const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
    if (portfolioSymbols.length === 0) return;

    setIsLoadingPerformance(true);
    setPerformanceLoadingProgress(0);
    setPerformanceLoadingStatus('Initializing...');

    try {
      const symbolsForRisk = portfolioSymbols.join(',');
      const normalizedTargets = targets;
      const weightsJson = JSON.stringify(normalizedTargets);

      // Calculate estimated time: (symbols.length - 1) * 3.5s delay + overhead
      const estimatedSeconds = (portfolioSymbols.length - 1) * 3.5 + 10; // ~3.5s per symbol + 10s overhead
      const updateInterval = 100; // Update progress every 100ms
      const progressPerUpdate = 100 / (estimatedSeconds * 1000 / updateInterval);
      
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress = Math.min(95, currentProgress + progressPerUpdate); // Cap at 95% until actual completion
        setPerformanceLoadingProgress(currentProgress);
        
        const elapsedSeconds = Math.floor((currentProgress / 100) * estimatedSeconds);
        const remainingSeconds = Math.max(1, Math.ceil(estimatedSeconds - elapsedSeconds));
        setPerformanceLoadingStatus(`Fetching data from CoinGecko... Estimated ${remainingSeconds}s remaining`);
      }, updateInterval);

      try {
        const riskRes = await fetch(
          `/api/analytics/performance-risk?symbols=${encodeURIComponent(symbolsForRisk)}&weights=${encodeURIComponent(weightsJson)}`
        );
        
        clearInterval(progressTimer);
        setPerformanceLoadingProgress(100);
        setPerformanceLoadingStatus('Processing data...');
        
        if (riskRes.ok) {
          const riskData = await riskRes.json();
          setPerformanceRisk(riskData);
          setPerformanceLoadingStatus('Complete!');
          
          // Clear status after a moment
          setTimeout(() => {
            setPerformanceLoadingStatus('');
            setPerformanceLoadingProgress(0);
          }, 1000);
        } else {
          throw new Error('Failed to fetch performance analytics');
        }
      } catch (error) {
        clearInterval(progressTimer);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching performance and risk analytics:', error);
      setPerformanceLoadingStatus('Error loading data. Please try again.');
      setPerformanceLoadingProgress(0);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    // Only fetch on initial mount - portfolio changes are handled by onSelectPortfolio
    fetchAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Insights
  const insights = useMemo(() => {
    if (!summary || portfolios.length === 0) return { items: [], drift: [], diversification: 0 };

    // Use normalized targets from state for drift comparisons
    const targetsMap = targets;
    const currentMap = Object.fromEntries(summary.holdings.map(h => [h.symbol, h.percentage]));

    // 1) Drift vs target
    const drift = Object.keys(targetsMap).map(symbol => {
      const target = targetsMap[symbol] || 0;
      const actual = currentMap[symbol] || 0;
      const diff = actual - target;
      return { symbol, target, actual, diff };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // 2) Diversification score (Herfindahl–Hirschman Index inverse)
    const hhi = summary.holdings.reduce((acc, h) => acc + Math.pow(h.percentage / 100, 2), 0);
    const diversification = Math.max(0, Math.min(100, (1 - hhi) * 100));

    // 3) Risk concentration: top asset share
    const top = summary.holdings[0];
    const topConcentration = top ? top.percentage : 0;

    // 4) Nudges
    const items: Array<{ title: string; detail: string; severity: 'info' | 'warn' | 'critical' }> = [];

    if (drift[0] && Math.abs(drift[0].diff) > 3) {
      const d = drift[0];
      items.push({
        title: `Rebalance opportunity: ${d.symbol}`,
        detail: `${d.symbol} is ${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)}% from target (${d.actual.toFixed(1)}% vs ${d.target.toFixed(1)}%).` ,
        severity: 'warn',
      });
    }

    if (diversification < 65) {
      items.push({
        title: 'Portfolio is under-diversified',
        detail: `Diversification score is ${diversification.toFixed(0)}. Consider adding non-correlated assets.`,
        severity: 'warn',
      });
    }

    if (topConcentration > 45) {
      items.push({
        title: 'High concentration risk',
        detail: `Top asset holds ${topConcentration.toFixed(1)}% of total value (${top?.symbol}).`,
        severity: 'critical',
      });
    }

    if (items.length === 0) {
      items.push({
        title: 'Looking good',
        detail: 'Allocations are close to targets and risk looks reasonable.',
        severity: 'info',
      });
    }

    return { items, drift, diversification };
  }, [summary, portfolios, targets]);

  // AI-Powered Insights: Generate natural-language recommendations
  const aiInsights = useMemo(() => {
    if (!summary || portfolios.length === 0 || Object.keys(targets).length === 0) {
      return [];
    }

    const recommendations: Array<{
      type: 'rebalance' | 'opportunity' | 'warning' | 'diversification' | 'performance' | 'optimization' | 'asset-swap';
      priority: 'high' | 'medium' | 'low';
      message: string;
      symbol?: string;
      symbols?: string[];
      action?: string;
    }> = [];

    // Current vs target allocations
    const currentMap = Object.fromEntries(summary.holdings.map(h => [h.symbol, h.percentage]));
    const totalValue = summary.totalValue;

    // Assets with staking yields (known staking coins)
    const stakingAssets: Record<string, { yield: number; description: string }> = {
      'ETH': { yield: 3.5, description: 'strong staking yield' },
      'SOL': { yield: 6.8, description: 'attractive staking rewards' },
      'ADA': { yield: 4.2, description: 'delegation rewards' },
      'DOT': { yield: 14.0, description: 'high staking yield' },
      'ATOM': { yield: 19.5, description: 'excellent staking yield' },
      'AVAX': { yield: 8.5, description: 'competitive staking rewards' },
    };

    // Analyze each target allocation
    Object.entries(targets).forEach(([symbol, targetPct]) => {
      if (symbol === 'EUR' || symbol === 'USDC' || symbol === 'USDT') return;
      
      const actualPct = currentMap[symbol] || 0;
      const drift = actualPct - targetPct;
      const driftAmount = (drift / 100) * totalValue;
      const stakingInfo = stakingAssets[symbol];

      // Under-target recommendations
      if (drift < -2) {
        const absDrift = Math.abs(drift);
        if (stakingInfo) {
          recommendations.push({
            type: 'opportunity',
            priority: absDrift > 5 ? 'high' : absDrift > 3 ? 'medium' : 'low',
            message: `Your ${symbol} allocation is under target by ${absDrift.toFixed(1)}%. Given ${symbol}'s ${stakingInfo.description} (~${stakingInfo.yield}% APY), topping up could improve long-term returns while rebalancing toward your target allocation.`,
            symbol,
            action: `Consider buying ~€${Math.abs(driftAmount).toFixed(0)} worth of ${symbol}`,
          });
        } else {
          recommendations.push({
            type: 'rebalance',
            priority: absDrift > 5 ? 'high' : absDrift > 3 ? 'medium' : 'low',
            message: `Your ${symbol} allocation is under target by ${absDrift.toFixed(1)}% (currently ${actualPct.toFixed(1)}% vs target ${targetPct.toFixed(1)}%). Consider rebalancing by adding ~€${Math.abs(driftAmount).toFixed(0)} to align with your strategy.`,
            symbol,
            action: `Rebalance: Add ~€${Math.abs(driftAmount).toFixed(0)} of ${symbol}`,
          });
        }
      }

      // Over-target recommendations
      if (drift > 2) {
        const absDrift = Math.abs(drift);
        recommendations.push({
          type: 'rebalance',
          priority: absDrift > 5 ? 'high' : absDrift > 3 ? 'medium' : 'low',
          message: `Your ${symbol} allocation is over target by ${absDrift.toFixed(1)}% (currently ${actualPct.toFixed(1)}% vs target ${targetPct.toFixed(1)}%). Consider taking profits or redistributing ~€${Math.abs(driftAmount).toFixed(0)} to other assets to reduce concentration risk.`,
          symbol,
          action: `Rebalance: Reduce ${symbol} by ~€${Math.abs(driftAmount).toFixed(0)}`,
        });
      }
    });

    // Diversification recommendations
    const insightsData = insights;
    if (insightsData.diversification < 65) {
      recommendations.push({
        type: 'diversification',
        priority: insightsData.diversification < 50 ? 'high' : 'medium',
        message: `Your portfolio diversification score is ${insightsData.diversification.toFixed(0)}%. Consider adding non-correlated assets to reduce risk. Diversifying across different sectors (DeFi, Layer 1s, AI tokens, etc.) can improve portfolio resilience.`,
        action: 'Explore adding assets from different blockchain ecosystems or sectors',
      });
    }

    // Concentration risk
    const topHolding = summary.holdings[0];
    if (topHolding && topHolding.percentage > 45) {
      recommendations.push({
        type: 'warning',
        priority: topHolding.percentage > 60 ? 'high' : 'medium',
        message: `High concentration risk: ${topHolding.symbol} represents ${topHolding.percentage.toFixed(1)}% of your portfolio. While this may be intentional, consider reducing exposure to avoid overexposure to a single asset's volatility.`,
        symbol: topHolding.symbol,
        action: `Consider reducing ${topHolding.symbol} allocation below 40%`,
      });
    }

    // Performance-based insights (if available)
    if (pl.m1 !== 0) {
      const isPositive = pl.m1 > 0;
      const performanceMsg = isPositive 
        ? `Your portfolio gained ${Math.abs(pl.m1).toFixed(1)}% over the past month. Strong performance! Consider taking some profits if you're significantly over target allocations.`
        : `Your portfolio lost ${Math.abs(pl.m1).toFixed(1)}% over the past month. This could be a good opportunity to rebalance and buy assets that are under target.`;
      
      recommendations.push({
        type: 'performance',
        priority: 'low',
        message: performanceMsg,
        action: isPositive ? 'Review profit-taking opportunities' : 'Consider rebalancing to buy undervalued positions',
      });
    }

    // Advanced Optimizations using Performance Analytics
    if (performanceRisk && performanceRisk.metrics.length > 0) {
      const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
      
      // Find underperforming assets in portfolio
      const portfolioMetrics = performanceRisk.metrics.filter(m => portfolioSymbols.includes(m.symbol));
      const underperformers = portfolioMetrics
        .filter(m => m.return30d < -15 || m.return90d < -20)
        .sort((a, b) => a.return30d - b.return30d);
      
      // Find well-performing assets NOT in portfolio
      const allMetrics = performanceRisk.metrics.filter(m => !portfolioSymbols.includes(m.symbol));
      const topPerformers = allMetrics
        .filter(m => m.return30d > 15 || m.return90d > 25)
        .sort((a, b) => b.return30d - a.return30d)
        .slice(0, 3);
      
      // Suggest replacing underperforming assets
      if (underperformers.length > 0 && topPerformers.length > 0) {
        const worst = underperformers[0];
        const best = topPerformers[0];
        
        recommendations.push({
          type: 'asset-swap',
          priority: worst.return30d < -25 ? 'high' : worst.return30d < -15 ? 'medium' : 'low',
          message: `${worst.symbol} has underperformed significantly (-${Math.abs(worst.return30d).toFixed(1)}% in 30d, -${Math.abs(worst.return90d).toFixed(1)}% in 90d). Meanwhile, ${best.symbol} has shown strong momentum (+${best.return30d.toFixed(1)}% in 30d). Consider replacing ${worst.symbol} with ${best.symbol} to improve portfolio returns.`,
          symbols: [worst.symbol, best.symbol],
          action: `Consider swapping ${worst.symbol} for ${best.symbol} - shift ~${(currentMap[worst.symbol] || 0).toFixed(1)}% allocation`,
        });
      }

      // High correlation risk - suggest diversification
      if (performanceRisk.correlationMatrix) {
        const portfolioPairs: Array<{ s1: string; s2: string; corr: number }> = [];
        portfolioSymbols.forEach(s1 => {
          portfolioSymbols.forEach(s2 => {
            if (s1 < s2 && portfolioSymbols.includes(s1) && portfolioSymbols.includes(s2)) {
              const corr = performanceRisk.correlationMatrix[s1]?.[s2] || 0;
              if (corr > 0.8) {
                portfolioPairs.push({ s1, s2, corr });
              }
            }
          });
        });
        
        if (portfolioPairs.length > 0) {
          const highCorrPair = portfolioPairs.sort((a, b) => b.corr - a.corr)[0];
          // Find a low-correlation alternative
          const alternative = allMetrics.find(m => {
            const corr1 = performanceRisk.correlationMatrix[m.symbol]?.[highCorrPair.s1] || 0;
            const corr2 = performanceRisk.correlationMatrix[m.symbol]?.[highCorrPair.s2] || 0;
            return Math.abs(corr1) < 0.5 && Math.abs(corr2) < 0.5;
          });
          
          if (alternative) {
            recommendations.push({
              type: 'optimization',
              priority: highCorrPair.corr > 0.9 ? 'high' : 'medium',
              message: `${highCorrPair.s1} and ${highCorrPair.s2} are highly correlated (${(highCorrPair.corr * 100).toFixed(0)}%), meaning they move together and provide limited diversification benefit. Consider adding ${alternative.symbol} which has low correlation with both, improving portfolio risk-adjusted returns.`,
              symbols: [highCorrPair.s1, highCorrPair.s2, alternative.symbol],
              action: `Diversify: Reduce exposure to ${highCorrPair.s1}/${highCorrPair.s2} and add ${alternative.symbol}`,
            });
          }
        }
      }

      // Volatility-based optimization
      const highVolAssets = portfolioMetrics
        .filter(m => m.volatility > 60)
        .sort((a, b) => b.volatility - a.volatility);
      
      if (highVolAssets.length > 0 && portfolioMetrics.length > 3) {
        const highVol = highVolAssets[0];
        const lowVolAlt = allMetrics
          .filter(m => m.volatility < 40 && m.return30d > -10)
          .sort((a, b) => b.return30d - a.return30d)[0];
        
        if (lowVolAlt) {
          recommendations.push({
            type: 'optimization',
            priority: highVol.volatility > 80 ? 'high' : 'medium',
            message: `${highVol.symbol} has high volatility (${highVol.volatility.toFixed(1)}%), increasing portfolio risk. ${lowVolAlt.symbol} offers similar exposure with lower volatility (${lowVolAlt.volatility.toFixed(1)}%) and better recent performance (+${lowVolAlt.return30d.toFixed(1)}% vs ${highVol.return30d.toFixed(1)}%). Consider reallocating some ${highVol.symbol} to ${lowVolAlt.symbol} for better risk-adjusted returns.`,
            symbols: [highVol.symbol, lowVolAlt.symbol],
            action: `Risk optimization: Shift ~${(currentMap[highVol.symbol] * 0.3 || 5).toFixed(1)}% from ${highVol.symbol} to ${lowVolAlt.symbol}`,
          });
        }
      }
    }

    // Innovation Signals-based recommendations
    if (innovationInsights && innovationInsights.signals.length > 0) {
      const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
      
      // Find bullish signals for assets NOT in portfolio
      const bullishNotInPortfolio = innovationInsights.signals
        .filter(s => s.signal === 'bullish' && !portfolioSymbols.includes(s.symbol))
        .reduce((acc, signal) => {
          if (!acc[signal.symbol]) {
            acc[signal.symbol] = [];
          }
          acc[signal.symbol].push(signal);
          return acc;
        }, {} as Record<string, typeof innovationInsights.signals>);
      
      // Find assets with multiple bullish signals
      const strongOpportunities = Object.entries(bullishNotInPortfolio)
        .filter(([, signals]) => signals.length >= 2)
        .map(([symbol, signals]) => ({
          symbol,
          signalCount: signals.length,
          signals,
        }))
        .sort((a, b) => b.signalCount - a.signalCount)
        .slice(0, 2);
      
      if (strongOpportunities.length > 0) {
        const opportunity = strongOpportunities[0];
        const signalTypes = opportunity.signals.map(s => s.type).join(', ');
        recommendations.push({
          type: 'opportunity',
          priority: opportunity.signalCount >= 3 ? 'high' : 'medium',
          message: `${opportunity.symbol} shows ${opportunity.signalCount} strong bullish signals (${signalTypes}), indicating growing developer activity and community engagement. This asset isn't currently in your portfolio - consider adding it to capture potential upside from these positive trends.`,
          symbol: opportunity.symbol,
          action: `Consider adding ${opportunity.symbol} to your portfolio (suggested allocation: 3-5%)`,
        });
      }

      // Find bearish signals for assets IN portfolio
      const bearishInPortfolio = innovationInsights.signals
        .filter(s => s.signal === 'bearish' && portfolioSymbols.includes(s.symbol))
        .reduce((acc, signal) => {
          if (!acc[signal.symbol]) {
            acc[signal.symbol] = [];
          }
          acc[signal.symbol].push(signal);
          return acc;
        }, {} as Record<string, typeof innovationInsights.signals>);
      
      const weakAssets = Object.entries(bearishInPortfolio)
        .filter(([, signals]) => signals.length >= 2)
        .map(([symbol]) => ({
          symbol,
          signalCount: bearishInPortfolio[symbol].length,
          allocation: currentMap[symbol] || 0,
        }))
        .filter(a => a.allocation > 0)
        .sort((a, b) => b.signalCount - a.signalCount);
      
      if (weakAssets.length > 0) {
        const weakAsset = weakAssets[0];
        recommendations.push({
          type: 'warning',
          priority: weakAsset.signalCount >= 3 && weakAsset.allocation > 10 ? 'high' : 'medium',
          message: `${weakAsset.symbol} shows ${weakAsset.signalCount} bearish trend signals (declining developer activity or community engagement), yet it represents ${weakAsset.allocation.toFixed(1)}% of your portfolio. Consider reducing exposure or monitoring closely for further deterioration.`,
          symbol: weakAsset.symbol,
          action: `Consider reducing ${weakAsset.symbol} allocation by 30-50% or monitoring closely`,
        });
      }
    }

    // Forward-looking notes integration
    if (innovationInsights && innovationInsights.notes && innovationInsights.notes.length > 0) {
      const highSeverityNotes = innovationInsights.notes
        .filter(n => n.severity === 'high' && n.type === 'opportunity')
        .slice(0, 2);
      
      highSeverityNotes.forEach(note => {
        const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
        const newSymbols = note.symbols.filter(s => !portfolioSymbols.includes(s));
        
        if (newSymbols.length > 0) {
          recommendations.push({
            type: 'opportunity',
            priority: 'medium',
            message: note.description,
            symbols: newSymbols,
            action: `Explore adding ${newSymbols.join(', ')} to your portfolio to capture this opportunity`,
          });
        }
      });
    }

    // Allocation optimization: Suggest rebalancing based on risk-return
    if (performanceRisk && performanceRisk.metrics.length > 0) {
      const portfolioSymbols = Object.keys(targets).filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
      const portfolioMetrics = performanceRisk.metrics.filter(m => portfolioSymbols.includes(m.symbol));
      
      if (portfolioMetrics.length >= 2) {
        // Calculate risk-adjusted returns (Sharpe-like: return / volatility)
        const riskAdjusted = portfolioMetrics.map(m => ({
          symbol: m.symbol,
          score: m.return30d / Math.max(m.volatility, 10), // Avoid division by zero
          return30d: m.return30d,
          volatility: m.volatility,
          currentAllocation: currentMap[m.symbol] || 0,
          targetAllocation: targets[m.symbol] || 0,
        })).sort((a, b) => b.score - a.score);
        
        // Find assets with good risk-adjusted returns but low allocation
        const underallocatedHighPerformer = riskAdjusted.find(
          a => a.score > 0.2 && a.currentAllocation < a.targetAllocation * 0.7 && a.targetAllocation > 5
        );
        
        // Find assets with poor risk-adjusted returns but high allocation
        const overallocatedLowPerformer = riskAdjusted.reverse().find(
          a => a.score < 0 && a.currentAllocation > a.targetAllocation * 1.2 && a.currentAllocation > 10
        );
        
        if (underallocatedHighPerformer && overallocatedLowPerformer) {
          const shiftAmount = Math.min(
            (overallocatedLowPerformer.currentAllocation - overallocatedLowPerformer.targetAllocation) * 0.5,
            (underallocatedHighPerformer.targetAllocation - underallocatedHighPerformer.currentAllocation) * 0.5
          );
          
          if (shiftAmount > 2) {
            recommendations.push({
              type: 'optimization',
              priority: shiftAmount > 5 ? 'high' : 'medium',
              message: `Optimization opportunity: ${underallocatedHighPerformer.symbol} shows strong risk-adjusted returns (+${underallocatedHighPerformer.return30d.toFixed(1)}% return with ${underallocatedHighPerformer.volatility.toFixed(1)}% volatility) but is under-allocated. Meanwhile, ${overallocatedLowPerformer.symbol} has negative returns with high volatility but is over-allocated. Shifting ${shiftAmount.toFixed(1)}% from ${overallocatedLowPerformer.symbol} to ${underallocatedHighPerformer.symbol} could improve portfolio efficiency.`,
              symbols: [overallocatedLowPerformer.symbol, underallocatedHighPerformer.symbol],
              action: `Rebalance: Shift ${shiftAmount.toFixed(1)}% from ${overallocatedLowPerformer.symbol} to ${underallocatedHighPerformer.symbol}`,
            });
          }
        }
      }
    }

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }, [summary, portfolios.length, targets, insights, pl, innovationInsights, performanceRisk]);

  const handleBack = () => router.push('/dashboard');
  const handleRefresh = () => fetchAll(true);
  const onSelectPortfolio = (id: string) => {
    if (id !== selectedPortfolioId) {
      // Portfolio changed - reload data and show loading
      setSummary(null); // Clear current summary to show loading state
      setInnovationInsights(null); // Clear insights when portfolio changes
      setPerformanceRisk(null); // Clear performance data when portfolio changes
      setIsLoading(true);
      
      // Update URL first, then fetch with explicit portfolio ID
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (id) params.set('portfolio', id); else params.delete('portfolio');
      router.push(`/dashboard/analytics?${params.toString()}`, { scroll: false });
      
      // Pass explicit portfolio ID to fetchAll so it uses the new one immediately
      fetchAll(true, id);
    }
  };

  // Show loading state with progress bar
  if (isLoading || !summary) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <Button variant="link" onClick={handleBack} className="mb-4 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Smart Analytics
          </h1>
          <p className="text-muted-foreground">Actionable insights for your portfolio</p>
        </div>

        {/* Loading Bar - Always show during initial load */}
        {(isLoading || isRefreshing || pageLoadingProgress > 0) && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50 shadow-sm">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-2 font-medium">
                <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                {pageLoadingStatus || (isRefreshing ? 'Refreshing data...' : isLoading ? 'Loading analytics...' : 'Processing...')}
              </span>
              <span className="font-semibold text-foreground">{Math.round(pageLoadingProgress || 5)}%</span>
            </div>
            <Progress value={pageLoadingProgress || 5} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-2">
              {isLoading ? 'Fetching portfolio data, balances, and prices from Kraken...' : 'Processing your request...'}
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {[1,2,3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      {/* Page Loading Bar - Show when loading or refreshing */}
      {(isLoading || isRefreshing || pageLoadingProgress > 0) && (
          <div className="mb-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-2 truncate">
                <RefreshCw className={`h-4 w-4 flex-shrink-0 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                <span className="truncate">{pageLoadingStatus || (isRefreshing ? t.analytics.refresh : isLoading ? t.analytics.title : t.analytics.processing)}</span>
              </span>
              <span className="font-semibold whitespace-nowrap">{Math.round(pageLoadingProgress || 0)}%</span>
            </div>
            <Progress value={pageLoadingProgress || 5} className="h-2" />
            {isLoading && (
              <p className="text-xs text-muted-foreground mt-2 break-words">
                {t.analytics.fetchingData}
              </p>
            )}
          </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button variant="link" onClick={handleBack} className="mb-2 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.analytics.backToDashboard}
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" /> {t.analytics.title}
            </h1>
            <p className="text-muted-foreground">{t.analytics.subtitle}</p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.analytics.refresh}
          </Button>
        </div>
      </div>

      {/* Portfolio selector */}
      {portfolios.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm text-muted-foreground mr-2 whitespace-nowrap">{t.analytics.portfolio}</label>
          <select
            className="flex-1 sm:max-w-xs border rounded px-2 py-1 bg-background text-sm"
            value={selectedPortfolioId || portfolios[0]?.id || ''}
            onChange={(e) => onSelectPortfolio(e.target.value)}
          >
            {portfolios.map(p => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => handleRefresh()} disabled={isRefreshing} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {t.analytics.update}
          </Button>
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="dashboard" className="w-full" onValueChange={(value) => {
        setActiveTab(value);
        // Don't auto-load - user must click the button to start loading
      }}>
        <div className="w-full overflow-x-auto no-scrollbar mb-4">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:grid sm:grid-cols-4 gap-1.5 sm:gap-1 h-auto sm:h-10">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-3 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap flex-shrink-0">
              {t.analytics.tabs.dashboard}
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm px-3 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap flex-shrink-0">
              {t.analytics.tabs.innovationInsights}
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm px-3 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap flex-shrink-0">
              {t.analytics.tabs.performanceAnalytics}
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="text-xs sm:text-sm px-3 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap flex-shrink-0">
              {t.analytics.tabs.aiInsights}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {summary && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Allocation: Current vs Target */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.analytics.dashboard.allocationCurrentVsTarget}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.allocationCurrentVsTargetDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonutAllocation
                      current={summary.holdings.map(h => ({ label: h.symbol, value: h.percentage }))}
                      target={targets}
                    />
                  </CardContent>
                </Card>

                {/* Portfolio Value & P/L */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.analytics.dashboard.portfolioValuePL}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.portfolioValuePLDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      €{summary.totalValue.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm">
                      <PLBadge label="24h" value={pl.d1} />
                      <PLBadge label="7d" value={pl.w1} />
                      <PLBadge label="30d" value={pl.m1} />
                    </div>
                    <div className="mt-4 h-8 sm:h-10">
                      <Sparkline points={sparklinePoints} />
                    </div>
                  </CardContent>
                </Card>

                {/* Biggest Drift */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.analytics.dashboard.biggestDrift}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.biggestDriftDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(insights.drift.slice(0,3)).map(d => (
                      <div key={d.symbol} className="flex items-center justify-between py-1 gap-2">
                        <div className="font-medium text-sm sm:text-base truncate">{d.symbol}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{d.actual.toFixed(1)}% vs {d.target.toFixed(1)}%</div>
                        <Badge variant={Math.abs(d.diff) > 3 ? 'destructive' : 'outline'} className="text-xs whitespace-nowrap">
                          {d.diff > 0 ? '+' : ''}{d.diff.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Portfolio Value */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5" /> {t.analytics.dashboard.portfolioValue}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.portfolioValueDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold break-words">
                      €{summary.totalValue.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">{t.analytics.dashboard.topHolding}: {summary.holdings[0]?.symbol} ({summary.holdings[0]?.percentage.toFixed(1)}%)</p>
                    <div className="mt-4 space-y-1">
                      {summary.holdings.slice(0,4).map(h => (
                        <div key={h.symbol} className="text-xs sm:text-sm text-muted-foreground break-words">
                          {h.symbol}: {h.amount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 8 })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Diversification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5" /> {t.analytics.dashboard.diversification}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.diversificationDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div className="text-2xl sm:text-3xl font-bold">{insights.diversification.toFixed(0)}%</div>
                      <Badge variant={insights.diversification >= 75 ? 'secondary' : 'outline'} className="text-xs sm:text-sm">
                        {insights.diversification >= 75 ? t.analytics.dashboard.healthy : insights.diversification >= 60 ? t.analytics.dashboard.okay : t.analytics.dashboard.low}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">{t.analytics.dashboard.higherIsBetter}</p>
                  </CardContent>
                </Card>

                {/* Allocation Drift */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5" /> {t.analytics.dashboard.allocationDrift}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.allocationDriftDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(insights.drift.slice(0,3)).map(d => (
                      <div key={d.symbol} className="flex items-center justify-between py-1 gap-2">
                        <div className="font-medium text-sm sm:text-base truncate">{d.symbol}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{d.actual.toFixed(1)}% vs {d.target.toFixed(1)}%</div>
                        <Badge variant={Math.abs(d.diff) > 3 ? 'destructive' : 'outline'} className="text-xs whitespace-nowrap">
                          {d.diff > 0 ? '+' : ''}{d.diff.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Actionable Nudges */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-5 w-5" /> {t.analytics.dashboard.actionableNudges}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.actionableNudgesDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.items.map((nudge, idx) => (
                        <div key={idx} className="p-2 sm:p-3 border rounded-md">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="font-semibold text-sm sm:text-base break-words flex-1 min-w-0">{nudge.title}</div>
                            <Badge variant={nudge.severity === 'critical' ? 'destructive' : nudge.severity === 'warn' ? 'outline' : 'secondary'} className="text-xs whitespace-nowrap">
                              {nudge.severity === 'critical' ? t.analytics.dashboard.severity.critical : nudge.severity === 'warn' ? t.analytics.dashboard.severity.warn : t.analytics.dashboard.severity.info}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{nudge.detail}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Allocation Snapshot */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5" /> {t.analytics.dashboard.allocationSnapshot}</CardTitle>
                    <CardDescription>{t.analytics.dashboard.allocationSnapshotDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.holdings.slice(0,6).map(h => {
                        const target = targets[h.symbol] || 0;
                        return (
                          <div key={h.symbol}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium text-sm sm:text-base truncate">{h.symbol}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{h.percentage.toFixed(1)}% / {target.toFixed(1)}%</div>
                            </div>
                            <div className="h-2 bg-muted rounded mt-1">
                              <div
                                className="h-2 bg-primary rounded"
                                style={{ width: `${Math.min(100, h.percentage)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Innovation Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Loading State - Show progress bar when loading */}
          {isLoadingInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  {t.analytics.innovationInsights.loadingTitle}
                </CardTitle>
                <CardDescription>
                  {t.analytics.innovationInsights.loadingDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{insightsLoadingStatus || t.analytics.innovationInsights.initializing}</span>
                    <span className="font-semibold">{Math.round(insightsLoadingProgress)}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(5, insightsLoadingProgress)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This process may take a minute due to CoinGecko rate limits. Data is fetched sequentially to ensure reliability.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Prompt to Load - Show when tab is opened but not loading and no data */}
          {!isLoadingInsights && !innovationInsights && activeTab === 'insights' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t.analytics.innovationInsights.promptTitle}
                </CardTitle>
                <CardDescription>
                  {t.analytics.innovationInsights.promptDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <Button onClick={fetchInnovationInsights} variant="default" size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.analytics.innovationInsights.loadButton}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.analytics.innovationInsights.loadNote}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {!isLoadingInsights && insightsLoadingStatus.includes('Error') && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="font-semibold mb-2">{t.analytics.innovationInsights.errorTitle}</p>
                  <p className="text-sm mb-4">{insightsLoadingStatus}</p>
                  <Button onClick={fetchInnovationInsights} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.analytics.innovationInsights.tryAgain}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loaded State - Only show when data is actually loaded */}
          {!isLoadingInsights && innovationInsights && (innovationInsights.signals.length > 0 || (innovationInsights.notes && innovationInsights.notes.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t.analytics.innovationInsights.panelTitle}
                </CardTitle>
                <CardDescription>
                  {t.analytics.innovationInsights.panelDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Forward-Looking Notes */}
                  {innovationInsights.notes && innovationInsights.notes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        {t.analytics.innovationInsights.forwardLookingTitle}
                      </h4>
                      <div className="space-y-3">
                        {innovationInsights.notes.map((note, idx) => {
                          const iconMap = {
                            trend: TrendingUp,
                            signal: Activity,
                            warning: AlertTriangle,
                            opportunity: Target,
                          };
                          const Icon = iconMap[note.type] || Lightbulb;
                          
                          const severityColors = {
                            high: note.type === 'warning' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900' : 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900',
                            medium: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900',
                            low: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900',
                          };
                          
                          return (
                            <div
                              key={idx}
                              className={`p-3 sm:p-4 rounded-lg border ${severityColors[note.severity]}`}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                  note.type === 'warning' ? 'text-red-600 dark:text-red-400' :
                                  note.type === 'opportunity' ? 'text-green-600 dark:text-green-400' :
                                  'text-yellow-600 dark:text-yellow-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold mb-1 text-sm sm:text-base break-words">{note.title}</div>
                                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{note.description}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {note.symbols.map(symbol => (
                                      <Badge key={symbol} variant="outline" className="text-xs whitespace-nowrap">
                                        {symbol}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Trend Signals */}
                  {innovationInsights.signals.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {t.analytics.innovationInsights.trendSignalsTitle}
                      </h4>
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {innovationInsights.signals.map((signal, idx) => {
                          const iconMap = {
                            developer: Code2,
                            social: Users,
                            tvl: Activity,
                            community: Users,
                          };
                          const Icon = iconMap[signal.type] || Activity;
                          
                          const signalColors = {
                            bullish: 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900',
                            bearish: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900',
                            neutral: 'border-gray-200 bg-gray-50 dark:bg-gray-950/20 dark:border-gray-900',
                          };
                          
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${signalColors[signal.signal]}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-sm">{signal.symbol}</span>
                                </div>
                                {signal.signal === 'bullish' ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : signal.signal === 'bearish' ? (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : null}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">{signal.metric}</div>
                              <div className="font-bold text-lg">{signal.value.toLocaleString()}</div>
                              {signal.note && (
                                <div className="text-xs text-muted-foreground mt-1">{signal.note}</div>
                              )}
                              <Badge
                                variant={
                                  signal.signal === 'bullish' ? 'default' :
                                  signal.signal === 'bearish' ? 'destructive' : 'outline'
                                }
                                className="mt-2 text-xs"
                              >
                                {signal.signal === 'bullish' ? t.analytics.innovationInsights.bullish : signal.signal === 'bearish' ? t.analytics.innovationInsights.bearish : t.analytics.innovationInsights.neutral}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Loading State - Show progress bar when loading */}
          {isLoadingPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  {t.analytics.performanceAnalytics.loadingTitle}
                </CardTitle>
                <CardDescription>
                  {t.analytics.performanceAnalytics.loadingDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{performanceLoadingStatus || t.analytics.performanceAnalytics.initializing}</span>
                    <span className="font-semibold">{Math.round(performanceLoadingProgress)}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(5, performanceLoadingProgress)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This process may take a minute due to CoinGecko rate limits. Data is fetched sequentially to ensure reliability.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Prompt to Load - Show when tab is opened but not loading and no data */}
          {!isLoadingPerformance && !performanceRisk && activeTab === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.analytics.performanceAnalytics.promptTitle}
                </CardTitle>
                <CardDescription>
                  {t.analytics.performanceAnalytics.promptDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <Button onClick={fetchPerformanceAnalytics} variant="default" size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.analytics.performanceAnalytics.loadButton}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.analytics.performanceAnalytics.loadNote}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {!isLoadingPerformance && performanceLoadingStatus.includes('Error') && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="font-semibold mb-2">{t.analytics.performanceAnalytics.errorTitle}</p>
                  <p className="text-sm mb-4">{performanceLoadingStatus}</p>
                  <Button onClick={fetchPerformanceAnalytics} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.analytics.performanceAnalytics.tryAgain}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loaded State - Only show when data is actually loaded */}
          {!isLoadingPerformance && performanceRisk && performanceRisk.metrics.length > 0 && (
            <div className="space-y-6">
              {/* Top Movers Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t.analytics.performanceAnalytics.topMoversTitle}
                  </CardTitle>
                  <CardDescription>{t.analytics.performanceAnalytics.topMoversDesc}</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-6">
                {/* 7 Day Movers */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">{t.analytics.performanceAnalytics.days7}</h4>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">{t.analytics.performanceAnalytics.bestPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.best7d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="default" className="bg-green-600 text-xs whitespace-nowrap">
                              {mover.return7d >= 0 ? '+' : ''}{mover.return7d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">{t.analytics.performanceAnalytics.worstPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.worst7d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="destructive" className="text-xs whitespace-nowrap">
                              {mover.return7d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 30 Day Movers */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">{t.analytics.performanceAnalytics.days30}</h4>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">{t.analytics.performanceAnalytics.bestPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.best30d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="default" className="bg-green-600 text-xs whitespace-nowrap">
                              {mover.return30d >= 0 ? '+' : ''}{mover.return30d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">{t.analytics.performanceAnalytics.worstPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.worst30d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="destructive" className="text-xs whitespace-nowrap">
                              {mover.return30d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 90 Day Movers */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">{t.analytics.performanceAnalytics.days90}</h4>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">{t.analytics.performanceAnalytics.bestPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.best90d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="default" className="bg-green-600 text-xs whitespace-nowrap">
                              {mover.return90d >= 0 ? '+' : ''}{mover.return90d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">{t.analytics.performanceAnalytics.worstPerformers}</div>
                      <div className="space-y-2">
                        {performanceRisk.topMovers.worst90d.slice(0, 3).map((mover, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{mover.symbol}</span>
                            <Badge variant="destructive" className="text-xs whitespace-nowrap">
                              {mover.return90d.toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </CardContent>
              </Card>

              {/* Volatility Meter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t.analytics.performanceAnalytics.volatilityAnalysisTitle}
                  </CardTitle>
                  <CardDescription>{t.analytics.performanceAnalytics.volatilityAnalysisDesc}</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                {/* Portfolio Volatility */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{t.analytics.performanceAnalytics.portfolioVolatility}</span>
                    <Badge variant={performanceRisk.portfolioVolatility > 50 ? 'destructive' : performanceRisk.portfolioVolatility > 30 ? 'secondary' : 'default'}>
                      {performanceRisk.portfolioVolatility.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        performanceRisk.portfolioVolatility > 50 ? 'bg-red-500' :
                        performanceRisk.portfolioVolatility > 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (performanceRisk.portfolioVolatility / 100) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {performanceRisk.portfolioVolatility > 50 ? t.analytics.performanceAnalytics.highRisk :
                     performanceRisk.portfolioVolatility > 30 ? t.analytics.performanceAnalytics.moderateRisk : t.analytics.performanceAnalytics.lowRisk} {t.analytics.performanceAnalytics.portfolio}
                  </p>
                </div>

                {/* Individual Coin Volatility */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">{t.analytics.performanceAnalytics.individualAssets}</h4>
                  <div className="space-y-2">
                    {performanceRisk.metrics
                      .sort((a, b) => b.volatility - a.volatility)
                      .map((metric) => (
                        <div key={metric.symbol} className="p-2 sm:p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">{metric.symbol}</span>
                            <Badge variant={metric.volatility > 80 ? 'destructive' : metric.volatility > 50 ? 'secondary' : 'outline'} className="text-xs whitespace-nowrap">
                              {metric.volatility.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                metric.volatility > 80 ? 'bg-red-500' :
                                metric.volatility > 50 ? 'bg-yellow-500' :
                                metric.volatility > 30 ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (metric.volatility / 100) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
                </CardContent>
              </Card>

              {/* Correlation Heatmap */}
              {performanceRisk.correlationMatrix && Object.keys(performanceRisk.correlationMatrix).length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {t.analytics.performanceAnalytics.correlationHeatmapTitle}
                    </CardTitle>
                    <CardDescription>{t.analytics.performanceAnalytics.correlationHeatmapDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-1 sm:p-2 text-xs font-semibold border-b sticky left-0 bg-background z-10"></th>
                          {Object.keys(performanceRisk.correlationMatrix).map(symbol => (
                            <th key={symbol} className="text-center p-1 sm:p-2 text-xs font-semibold border-b min-w-[50px] sm:min-w-[60px]">
                              <span className="hidden sm:inline">{symbol}</span>
                              <span className="sm:hidden">{symbol.substring(0, 3)}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(performanceRisk.correlationMatrix).map(symbol1 => (
                          <tr key={symbol1}>
                            <td className="text-left p-1 sm:p-2 text-xs font-semibold border-r sticky left-0 bg-background z-10">
                              <span className="hidden sm:inline">{symbol1}</span>
                              <span className="sm:hidden">{symbol1.substring(0, 3)}</span>
                            </td>
                            {Object.keys(performanceRisk.correlationMatrix).map(symbol2 => {
                            const correlation = performanceRisk.correlationMatrix[symbol1]?.[symbol2] || 0;
                            // Color intensity based on correlation (red for high positive, blue for negative)
                            const intensity = Math.abs(correlation);
                            const isPositive = correlation >= 0;
                            const bgColor = symbol1 === symbol2
                              ? 'bg-gray-200 dark:bg-gray-800'
                              : isPositive
                                ? `rgba(239, 68, 68, ${intensity})` // Red for positive correlation
                                : `rgba(59, 130, 246, ${intensity})`; // Blue for negative correlation
                            
                            return (
                              <td
                                key={symbol2}
                                className="text-center p-1 sm:p-2 text-xs border"
                                style={{
                                  backgroundColor: symbol1 === symbol2 ? undefined : bgColor,
                                }}
                              >
                                {symbol1 === symbol2 ? '1.00' : correlation.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                    <span>{t.analytics.performanceAnalytics.positive}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                    <span>{t.analytics.performanceAnalytics.negative}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <span>{t.analytics.performanceAnalytics.noCorrelation}</span>
                  </div>
                </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI-Powered Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t.analytics.aiInsights.title}
              </CardTitle>
              <CardDescription>
                {t.analytics.aiInsights.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiInsights && aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight, idx) => {
                    const typeColors = {
                      rebalance: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900',
                      opportunity: 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900',
                      warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900',
                      diversification: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900',
                      performance: 'border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900',
                      optimization: 'border-cyan-200 bg-cyan-50 dark:bg-cyan-950/20 dark:border-cyan-900',
                      'asset-swap': 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900',
                    };

                    const priorityIcons = {
                      high: AlertTriangle,
                      medium: Target,
                      low: Lightbulb,
                    };

                    const PriorityIcon = priorityIcons[insight.priority];

                    const typeIcons = {
                      rebalance: Target,
                      opportunity: TrendingUp,
                      warning: AlertTriangle,
                      diversification: BarChart3,
                      performance: Activity,
                      optimization: Sparkles,
                      'asset-swap': RefreshCw,
                    };

                    const TypeIcon = typeIcons[insight.type];

                    return (
                      <div
                        key={idx}
                        className={`p-3 sm:p-4 rounded-lg border ${typeColors[insight.type]}`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`mt-0.5 flex-shrink-0 ${
                            insight.type === 'opportunity' ? 'text-green-600 dark:text-green-400' :
                            insight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                            insight.type === 'diversification' ? 'text-purple-600 dark:text-purple-400' :
                            insight.type === 'performance' ? 'text-indigo-600 dark:text-indigo-400' :
                            insight.type === 'optimization' ? 'text-cyan-600 dark:text-cyan-400' :
                            insight.type === 'asset-swap' ? 'text-orange-600 dark:text-orange-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <PriorityIcon className={`h-4 w-4 ${
                                insight.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                insight.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-blue-600 dark:text-blue-400'
                              }`} />
                              <Badge
                                variant={
                                  insight.priority === 'high' ? 'destructive' :
                                  insight.priority === 'medium' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {insight.priority === 'high' ? t.analytics.aiInsights.priority.high : insight.priority === 'medium' ? t.analytics.aiInsights.priority.medium : t.analytics.aiInsights.priority.low}
                              </Badge>
                              {insight.symbol && (
                                <Badge variant="outline" className="text-xs">
                                  {insight.symbol}
                                </Badge>
                              )}
                              {insight.symbols && insight.symbols.length > 0 && (
                                <>
                                  {insight.symbols.map((sym, symIdx) => (
                                    <Badge key={symIdx} variant="outline" className="text-xs">
                                      {sym}
                                    </Badge>
                                  ))}
                                </>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">{insight.message}</p>
                            {insight.action && (
                              <div className="mt-2 pt-2 border-t border-muted">
                                <p className="text-xs font-semibold text-muted-foreground">{t.analytics.aiInsights.suggestedAction}</p>
                                <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t.analytics.aiInsights.noInsightsAvailable}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Lightweight components
function PLBadge({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className={`px-2 py-1 rounded border ${positive ? 'text-green-600 border-green-200 dark:border-green-900' : 'text-red-600 border-red-200 dark:border-red-900'}`}>
      <span className="mr-1 text-muted-foreground">{label}</span>
      {positive ? '+' : ''}{value.toFixed(2)}%
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length < 2) return <div className="h-full w-full bg-muted/40 rounded" />;
  const width = 240;
  const height = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
  const step = width / (points.length - 1);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${norm(v)}`).join(' ');
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />
    </svg>
  );
}

function DonutAllocation({ current, target }: { current: Array<{ label: string; value: number }>; target: Record<string, number> }) {
  // Merge keys and build arcs
  const data = current.filter(s => s.value > 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let offset = 0;
  const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

  return (
    <div className="flex items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="translate(80,80)">
          <circle r={radius} fill="none" stroke="#E5E7EB" strokeWidth="18" />
          {data.map((s, idx) => {
            const frac = s.value / total;
            const len = circumference * frac;
            const el = (
              <circle key={s.label}
                r={radius}
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="18"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="space-y-2 text-sm">
        {data.map((s, idx) => {
          const tgt = target[s.label] ?? 0;
          const diff = s.value - tgt;
          const color = colors[idx % colors.length];
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{ background: color }} />
              <span className="font-medium w-12">{s.label}</span>
              <span className="text-muted-foreground">{s.value.toFixed(1)}% / {tgt.toFixed(1)}%</span>
              <Badge variant={Math.abs(diff) > 3 ? 'destructive' : 'outline'}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}


