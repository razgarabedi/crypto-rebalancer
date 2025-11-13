/**
 * Check if trading pairs exist on Kraken
 * Usage: npx tsx scripts/check-kraken-pairs.ts AKT FLUX ADA
 */

import { KrakenClient } from '../lib/kraken';

async function checkTradingPairs(symbols: string[]) {
  console.log('\n🔍 Checking Kraken trading pairs...\n');

  const client = new KrakenClient();

  for (const symbol of symbols) {
    console.log(`\n📊 Checking ${symbol}:`);
    
    // Try different pair formats
    const formats = [
      `${symbol}EUR`,
      `${symbol}ZEUR`,
      `X${symbol}ZEUR`,
      `${symbol}USD`,
      `${symbol}ZUSD`,
    ];

    for (const pair of formats) {
      try {
        const tickers = await client.getTickerPrices([pair]);
        if (tickers.length > 0) {
          console.log(`  ✅ ${pair} - FOUND`);
          console.log(`     Price: €${tickers[0].price.toFixed(4)}`);
          console.log(`     Volume: ${tickers[0].volume24h.toFixed(2)}`);
          break;
        }
      } catch (error: any) {
        if (error.message.includes('Unknown asset pair')) {
          console.log(`  ❌ ${pair} - Not found`);
        } else {
          console.log(`  ⚠️  ${pair} - Error: ${error.message}`);
        }
      }
    }
  }

  console.log('\n');
}

const symbols = process.argv.slice(2);

if (symbols.length === 0) {
  console.error('\n❌ Usage: npx tsx scripts/check-kraken-pairs.ts <SYMBOL1> <SYMBOL2> ...\n');
  console.log('Example: npx tsx scripts/check-kraken-pairs.ts AKT FLUX ADA\n');
  process.exit(1);
}

checkTradingPairs(symbols);

