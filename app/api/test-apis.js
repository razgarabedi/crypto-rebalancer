/**
 * API Testing Script (Node.js)
 * Tests all three new API endpoints
 * 
 * Usage:
 *   node app/api/test-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Helper function for colored console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(emoji, title, color = colors.reset) {
  console.log(`\n${color}${emoji} ${title}${colors.reset}`);
  console.log('─'.repeat(50));
}

async function testAPI(name, url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - Success`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ ${name} - Error (${response.status})`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ ${name} - Failed`);
    console.error(error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Testing Kraken Rebalancer APIs');
  console.log('═'.repeat(50));

  // Test 1: GET /api/prices
  log('📊', 'Test 1: GET /api/prices', colors.blue);
  await testAPI(
    'Prices API',
    `${BASE_URL}/api/prices?symbols=BTC,ETH,SOL`
  );

  // Test 2: GET /api/prices with USD
  log('💵', 'Test 2: GET /api/prices (USD)', colors.blue);
  await testAPI(
    'Prices API (USD)',
    `${BASE_URL}/api/prices?symbols=BTC,ETH&quoteCurrency=USD`
  );

  // Test 3: GET /api/holdings
  log('💼', 'Test 3: GET /api/holdings', colors.blue);
  await testAPI(
    'Holdings API',
    `${BASE_URL}/api/holdings`
  );

  // Test 4: GET /api/holdings filtered
  log('🔍', 'Test 4: GET /api/holdings (filtered)', colors.blue);
  await testAPI(
    'Holdings API (filtered)',
    `${BASE_URL}/api/holdings?symbols=BTC,ETH`
  );

  // Test 5: GET /api/rebalance (check)
  log('⚖️', 'Test 5: GET /api/rebalance (check)', colors.blue);
  await testAPI(
    'Rebalance Check',
    `${BASE_URL}/api/rebalance?portfolioId=test-portfolio&action=check`
  );

  // Test 6: GET /api/rebalance (preview)
  log('👁️', 'Test 6: GET /api/rebalance (preview)', colors.blue);
  await testAPI(
    'Rebalance Preview',
    `${BASE_URL}/api/rebalance?portfolioId=test-portfolio&action=preview&threshold=5`
  );

  // Test 7: POST /api/rebalance (dry run)
  log('🏃', 'Test 7: POST /api/rebalance (dry run)', colors.blue);
  await testAPI(
    'Rebalance Dry Run',
    `${BASE_URL}/api/rebalance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolioId: 'test-portfolio',
        targetWeights: {
          BTC: 50,
          ETH: 30,
          SOL: 15,
          ADA: 5,
        },
        dryRun: true,
        rebalanceThreshold: 10,
      }),
    }
  );

  // Test 8: Error handling - missing parameters
  log('❌', 'Test 8: Error handling (missing portfolioId)', colors.yellow);
  await testAPI(
    'Rebalance Error (missing param)',
    `${BASE_URL}/api/rebalance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWeights: { BTC: 50, ETH: 50 },
        dryRun: true,
      }),
    }
  );

  // Test 9: Error handling - invalid quote currency
  log('❌', 'Test 9: Error handling (invalid currency)', colors.yellow);
  await testAPI(
    'Prices Error (invalid currency)',
    `${BASE_URL}/api/prices?quoteCurrency=JPY`
  );

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`${colors.green}✅ API Testing Complete!${colors.reset}`);
  console.log('\nNote: Some tests may fail if Kraken API credentials are not configured.');
  console.log('To configure credentials, add to .env.local:');
  console.log('  KRAKEN_API_KEY=your_api_key');
  console.log('  KRAKEN_API_SECRET=your_api_secret\n');
}

// Run tests
runTests().catch(console.error);

