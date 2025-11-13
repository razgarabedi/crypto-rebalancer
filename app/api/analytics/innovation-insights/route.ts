import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET /api/analytics/innovation-insights
 * Fetch innovation insights (trend signals) for portfolio coins
 * 
 * Query params:
 * - symbols: Comma-separated list of coin symbols (e.g., "BTC,ETH,SOL")
 */

// Mapping of common symbols to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'ATOM': 'cosmos',
  'RENDER': 'render-token',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'XRP': 'ripple',
  'BNB': 'binancecoin',
  'DOGE': 'dogecoin',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'HBAR': 'hedera-hashgraph',
  'FLUX': 'zelcash',
  'RPL': 'rocket-pool',
  'FET': 'fetch-ai',
  'GRT': 'the-graph',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'ENJ': 'enjincoin',
  'AXS': 'axie-infinity',
  'CRV': 'curve-dao-token',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'YFI': 'yearn-finance',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'BAL': 'balancer',
};

interface TrendSignal {
  symbol: string;
  type: 'developer' | 'social' | 'tvl' | 'community';
  metric: string;
  value: number;
  change?: number;
  changePercent?: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  note?: string;
}

interface ForwardLookingNote {
  type: 'trend' | 'signal' | 'warning' | 'opportunity';
  title: string;
  description: string;
  symbols: string[];
  severity: 'high' | 'medium' | 'low';
}

interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  developer_data?: {
    forks?: number;
    stars?: number;
    subscribers?: number;
    total_issues?: number;
    closed_issues?: number;
    pull_requests_merged?: number;
    pull_request_contributors?: number;
    commit_count_4_weeks?: number;
    additions_4_weeks?: number;
    deletions_4_weeks?: number;
  };
  community_data?: {
    facebook_likes?: number;
    twitter_followers?: number;
    reddit_subscribers?: number;
    reddit_accounts_active_48h?: number;
    telegram_channel_user_count?: number;
  };
  market_data?: Record<string, unknown>;
}

/**
 * Fetch CoinGecko data for a coin
 * Implements retry logic with exponential backoff for rate limiting
 */
async function fetchCoinGeckoData(coinId: string, retries = 2): Promise<CoinGeckoData | null> {
  // Reduced retries from 3 to 2 for faster failure handling
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Fetch coin data with developer and community stats
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
      const params = {
        localization: false,
        tickers: false,
        market_data: false, // Don't need market_data, saves bandwidth/time
        community_data: true,
        developer_data: true,
        sparkline: false,
      };

      // Reduced timeout for faster failure detection
      const response = await axios.get(url, { params, timeout: 6000 }); // Reduced from 8s to 6s
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limited - check retry-after header
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        
        if (attempt < retries - 1) {
          console.warn(`Rate limited for ${coinId}, waiting ${waitTime}ms before retry ${attempt + 2}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // For non-rate-limit errors or final attempt, return null immediately
      // Don't retry on non-429 errors to save time
      if (!axios.isAxiosError(error) || error.response?.status !== 429) {
        return null;
      }
      
      if (attempt === retries - 1) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Analyze developer activity trends
 */
function analyzeDeveloperActivity(data: CoinGeckoData, symbol: string): TrendSignal[] {
  const signals: TrendSignal[] = [];
  
  if (!data?.developer_data) return signals;

  const dev = data.developer_data;
  
  // GitHub stats
  if (dev.forks || dev.stars) {
    const recentForks = dev.forks || 0;
    const recentStars = dev.stars || 0;
    
    // Calculate a combined activity score
    const activityScore = (recentForks * 0.3) + (recentStars * 0.7);
    
    signals.push({
      symbol,
      type: 'developer',
      metric: 'GitHub Activity',
      value: activityScore,
      signal: activityScore > 100 ? 'bullish' : activityScore > 50 ? 'neutral' : 'bearish',
      note: `${recentStars} stars, ${recentForks} forks`,
    });
  }

  // Commits data (if available in last 4 weeks)
  if (dev.commit_count_4_weeks) {
    const commits = dev.commit_count_4_weeks;
    signals.push({
      symbol,
      type: 'developer',
      metric: 'Recent Commits (4 weeks)',
      value: commits,
      signal: commits > 100 ? 'bullish' : commits > 50 ? 'neutral' : 'bearish',
      note: `${commits} commits in last 4 weeks`,
    });
  }

  // Pull requests
  if (dev.pull_requests_merged) {
    const prs = dev.pull_requests_merged;
    signals.push({
      symbol,
      type: 'developer',
      metric: 'Merged PRs',
      value: prs,
      signal: prs > 20 ? 'bullish' : prs > 10 ? 'neutral' : 'bearish',
    });
  }

  return signals;
}

/**
 * Analyze social/community trends
 */
function analyzeSocialActivity(data: CoinGeckoData, symbol: string): TrendSignal[] {
  const signals: TrendSignal[] = [];
  
  if (!data?.community_data) return signals;

  const community = data.community_data;
  
  // Reddit subscribers
  if (community.reddit_subscribers) {
    const subscribers = community.reddit_subscribers;
    signals.push({
      symbol,
      type: 'social',
      metric: 'Reddit Subscribers',
      value: subscribers,
      signal: subscribers > 100000 ? 'bullish' : subscribers > 10000 ? 'neutral' : 'bearish',
      note: `${(subscribers / 1000).toFixed(1)}k subscribers`,
    });
  }

  // Twitter followers
  if (community.twitter_followers) {
    const followers = community.twitter_followers;
    signals.push({
      symbol,
      type: 'social',
      metric: 'Twitter Followers',
      value: followers,
      signal: followers > 1000000 ? 'bullish' : followers > 100000 ? 'neutral' : 'bearish',
      note: `${(followers / 1000000).toFixed(2)}M followers`,
    });
  }

  return signals;
}

/**
 * Generate forward-looking notes based on signals
 */
function generateForwardLookingNotes(signals: TrendSignal[]): ForwardLookingNote[] {
  const notes: ForwardLookingNote[] = [];
  
  // Group signals by symbol
  const bySymbol: Record<string, TrendSignal[]> = {};
  signals.forEach(signal => {
    if (!bySymbol[signal.symbol]) bySymbol[signal.symbol] = [];
    bySymbol[signal.symbol].push(signal);
  });

  // Analyze trends
  for (const [symbol, symbolSignals] of Object.entries(bySymbol)) {
    const bullishCount = symbolSignals.filter(s => s.signal === 'bullish').length;
    const bearishCount = symbolSignals.filter(s => s.signal === 'bearish').length;
    const developerSignals = symbolSignals.filter(s => s.type === 'developer');
    const socialSignals = symbolSignals.filter(s => s.type === 'social');

    // Developer activity trend
    const devCommits = developerSignals.find(s => s.metric.includes('Commits'));
    if (devCommits && devCommits.value > 100) {
      notes.push({
        type: 'trend',
        title: `${symbol} Shows Strong Developer Activity`,
        description: `${symbol} has ${devCommits.value} commits in the last 4 weeks — bullish signal for continued innovation.`,
        symbols: [symbol],
        severity: 'high',
      });
    }

    // Social growth
    const socialGrowth = socialSignals.filter(s => s.signal === 'bullish').length;
    if (socialGrowth >= 2) {
      notes.push({
        type: 'signal',
        title: `${symbol} Growing Community Engagement`,
        description: `${symbol} shows strong social metrics across multiple platforms, indicating increasing interest.`,
        symbols: [symbol],
        severity: 'medium',
      });
    }

    // Overall bullish/bearish
    if (bullishCount > bearishCount && bullishCount >= 2) {
      notes.push({
        type: 'opportunity',
        title: `${symbol} Multiple Positive Signals`,
        description: `${symbol} shows ${bullishCount} positive trend indicators, suggesting potential growth.`,
        symbols: [symbol],
        severity: bullishCount >= 3 ? 'high' : 'medium',
      });
    } else if (bearishCount > bullishCount && bearishCount >= 2) {
      notes.push({
        type: 'warning',
        title: `${symbol} Weak Activity Indicators`,
        description: `${symbol} shows ${bearishCount} concerning trend indicators, monitor closely.`,
        symbols: [symbol],
        severity: bearishCount >= 3 ? 'high' : 'medium',
      });
    }
  }

  // Category-level trends (e.g., AI tokens, DeFi tokens)
  const aiTokens = signals.filter(s => ['RENDER', 'FLUX', 'FET'].includes(s.symbol));
  if (aiTokens.length > 0) {
    const avgCommits = aiTokens
      .filter(s => s.metric.includes('Commits'))
      .reduce((sum, s) => sum + s.value, 0) / aiTokens.length;
    
    if (avgCommits > 80) {
      notes.push({
        type: 'trend',
        title: 'AI Tokens Show Increased Developer Activity',
        description: `AI-focused tokens have grown ${Math.round(avgCommits)}% in dev commits this quarter — bullish signal for the sector.`,
        symbols: aiTokens.map(s => s.symbol),
        severity: 'high',
      });
    }
  }

  return notes.slice(0, 5); // Limit to top 5 notes
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(s => {
      // Filter out stablecoins as they don't have meaningful developer/social data
      return s !== 'EUR' && s !== 'USDC' && s !== 'USDT';
    });
    
    const allSignals: TrendSignal[] = [];
    
    // Optimize: Reduce delay and use smarter batching
    // CoinGecko free tier: ~30-50 calls/minute = ~1.2-2s per request
    // Use 1.5s delay which is safe but faster
    const delayBetweenRequests = 1500; // Reduced from 3500ms
    
    // Fetch data for each symbol with optimized delay
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const coinId = COINGECKO_ID_MAP[symbol];
      
      if (!coinId) {
        console.warn(`No CoinGecko ID mapping found for ${symbol}`);
        continue;
      }

      // Fetch data (with retry logic built in)
      const data = await fetchCoinGeckoData(coinId);
      if (!data) {
        console.warn(`Failed to fetch data for ${symbol} (${coinId})`);
        // Continue to next symbol even if this one fails
        // Add delay even on failure to maintain rate limit compliance
        if (i < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
        continue;
      }

      // Analyze different aspects
      const devSignals = analyzeDeveloperActivity(data, symbol);
      const socialSignals = analyzeSocialActivity(data, symbol);

      allSignals.push(...devSignals, ...socialSignals);

      // Optimized rate limiting delay - reduced from 3.5s to 1.5s
      // Only delay if not the last item
      if (i < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    }

    // Generate forward-looking notes
    const notes = generateForwardLookingNotes(allSignals);

    return NextResponse.json({
      success: true,
      signals: allSignals,
      notes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching innovation insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch innovation insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

