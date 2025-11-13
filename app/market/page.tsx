'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingViewChart } from '@/components/tradingview-chart';
import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ResponsiveSidebar } from '@/components/responsive-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { TrendingUp, TrendingDown, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

interface TradingPair {
  pair: string;
  wsname: string;
  base: string;
  quote: string;
  display: string;
  altname: string;
}

const POPULAR_PAIRS = [
  { symbol: 'XXBTZEUR', name: 'Bitcoin', display: 'BTCEUR', tvSymbol: 'BTCEUR' },
  { symbol: 'XETHZEUR', name: 'Ethereum', display: 'ETHEUR', tvSymbol: 'ETHEUR' },
  { symbol: 'SOLEUR', name: 'Solana', display: 'SOLEUR', tvSymbol: 'SOLEUR' },
  { symbol: 'ADAEUR', name: 'Cardano', display: 'ADAEUR', tvSymbol: 'ADAEUR' },
  { symbol: 'XRPEUR', name: 'Ripple', display: 'XRPEUR', tvSymbol: 'XRPEUR' },
  { symbol: 'DOTEUR', name: 'Polkadot', display: 'DOTEUR', tvSymbol: 'DOTEUR' },
];

export default function MarketPage() {
  const { theme = 'dark' } = useTheme();
  const [selectedPair, setSelectedPair] = useState(POPULAR_PAIRS[0]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPairs, setAllPairs] = useState<TradingPair[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPairs, setFilteredPairs] = useState<TradingPair[]>([]);
  const [customSymbol, setCustomSymbol] = useState('');

  useEffect(() => {
    fetchTickers();
    fetchAllPairs();
    const tickerInterval = window.setInterval(fetchTickers, 30000); // Update every 30 seconds
    return () => window.clearInterval(tickerInterval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPairs([]);
    } else {
      const filtered = allPairs.filter(pair =>
        pair.display.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.quote.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredPairs(filtered);
    }
  }, [searchQuery, allPairs]);

  const fetchTickers = async () => {
    try {
      const symbols = POPULAR_PAIRS.map(p => p.symbol).join(',');
      const response = await fetch(`/api/kraken/prices?symbols=${symbols}`);
      const data = await response.json();

      if (data.tickers) {
        const tickersData = data.tickers.map((ticker: Record<string, unknown>) => {
          const pair = POPULAR_PAIRS.find(p => p.symbol === ticker.symbol);
          return {
            symbol: ticker.symbol,
            name: pair?.name || ticker.symbol,
            price: ticker.price,
            change24h: ticker.change24h || 0,
          };
        });
        setTickers(tickersData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickers:', error);
      setLoading(false);
    }
  };

  const fetchAllPairs = async () => {
    try {
      const response = await fetch('/api/kraken/pairs');
      const data = await response.json();
      if (data.success) {
        setAllPairs(data.pairs);
      }
    } catch (error) {
      console.error('Error fetching pairs:', error);
    }
  };

  const handlePairSelect = (pair: TradingPair) => {
    const displaySymbol = pair.display.replace('/', '');
    setCustomSymbol(displaySymbol);
    setSearchQuery('');
    setFilteredPairs([]);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Responsive Sidebar */}
        <ResponsiveSidebar />

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold hidden sm:block">Crypto Market</h1>
              </div>
              <div className="flex items-center gap-4">
                <UserNav />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-6">
            {/* Market Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-6 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                tickers.map((ticker) => (
                  <Card
                    key={ticker.symbol}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPair.symbol === ticker.symbol ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      const pair = POPULAR_PAIRS.find(p => p.symbol === ticker.symbol);
                      if (pair) setSelectedPair(pair);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{ticker.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">€{ticker.price.toLocaleString()}</div>
                      <div className={`flex items-center text-sm ${
                        ticker.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {ticker.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(ticker.change24h).toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Chart Controls */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      {customSymbol || selectedPair.display}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPair.name} • TradingView Chart
                    </p>
                  </div>
                  
                  {/* Search for Trading Pairs */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search trading pairs (e.g., BTC, ETH, SOL)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {customSymbol && (
                        <Button
                          variant="outline"
                          onClick={() => setCustomSymbol('')}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {filteredPairs.length > 0 && (
                      <Card className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto">
                        <CardContent className="p-2">
                          {filteredPairs.map((pair) => (
                            <button
                              key={pair.pair}
                              onClick={() => handlePairSelect(pair)}
                              className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                            >
                              <div className="font-medium">{pair.display}</div>
                              <div className="text-xs text-muted-foreground">
                                {pair.altname}
                              </div>
                            </button>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {allPairs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {allPairs.length} trading pairs available on Kraken
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <TradingViewChart
                  symbol={customSymbol || selectedPair.tvSymbol}
                  interval="60"
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  height={600}
                />
              </CardContent>
            </Card>

            {/* Market Info */}
            <Card>
              <CardHeader>
                <CardTitle>About TradingView Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Professional trading charts powered by TradingView with real-time data from Kraken exchange.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Search and view any trading pair available on Kraken</li>
                    <li>Change timeframes directly in the chart (1m to 1M)</li>
                    <li>100+ technical indicators and drawing tools</li>
                    <li>Volume indicators and advanced analysis</li>
                    <li>Interactive candlestick charts with zoom and pan</li>
                    <li>Professional-grade charting interface</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Tip:</strong> Use the search bar above to find any cryptocurrency pair, and use TradingView&apos;s built-in controls to change timeframes and add indicators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

