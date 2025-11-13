#!/bin/bash

# API Testing Script
# Tests all three new API endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Testing Kraken Rebalancer APIs"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: GET /api/prices
echo "📊 Test 1: GET /api/prices"
echo "------------------------"
curl -s "${BASE_URL}/api/prices?symbols=BTC,ETH,SOL" | jq '.'
echo ""
echo ""

# Test 2: GET /api/prices with USD
echo "💵 Test 2: GET /api/prices (USD)"
echo "------------------------"
curl -s "${BASE_URL}/api/prices?symbols=BTC,ETH&quoteCurrency=USD" | jq '.'
echo ""
echo ""

# Test 3: GET /api/holdings
echo "💼 Test 3: GET /api/holdings"
echo "------------------------"
curl -s "${BASE_URL}/api/holdings" | jq '.'
echo ""
echo ""

# Test 4: GET /api/holdings filtered
echo "🔍 Test 4: GET /api/holdings (filtered)"
echo "------------------------"
curl -s "${BASE_URL}/api/holdings?symbols=BTC,ETH" | jq '.'
echo ""
echo ""

# Test 5: GET /api/rebalance (check)
echo "⚖️  Test 5: GET /api/rebalance (check)"
echo "------------------------"
curl -s "${BASE_URL}/api/rebalance?portfolioId=test-portfolio&action=check" | jq '.'
echo ""
echo ""

# Test 6: GET /api/rebalance (preview)
echo "👁️  Test 6: GET /api/rebalance (preview)"
echo "------------------------"
curl -s "${BASE_URL}/api/rebalance?portfolioId=test-portfolio&action=preview&threshold=5" | jq '.'
echo ""
echo ""

# Test 7: POST /api/rebalance (dry run)
echo "🏃 Test 7: POST /api/rebalance (dry run)"
echo "------------------------"
curl -s -X POST "${BASE_URL}/api/rebalance" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "test-portfolio",
    "targetWeights": {
      "BTC": 50,
      "ETH": 30,
      "SOL": 15,
      "ADA": 5
    },
    "dryRun": true,
    "rebalanceThreshold": 10
  }' | jq '.'
echo ""
echo ""

# Test 8: Error handling - missing parameters
echo "❌ Test 8: Error handling (missing portfolioId)"
echo "------------------------"
curl -s -X POST "${BASE_URL}/api/rebalance" \
  -H "Content-Type: application/json" \
  -d '{
    "targetWeights": {"BTC": 50, "ETH": 50},
    "dryRun": true
  }' | jq '.'
echo ""
echo ""

# Test 9: Error handling - invalid quote currency
echo "❌ Test 9: Error handling (invalid currency)"
echo "------------------------"
curl -s "${BASE_URL}/api/prices?quoteCurrency=JPY" | jq '.'
echo ""
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "Note: Some tests may fail if Kraken API credentials are not configured."
echo "To configure credentials, add to .env.local:"
echo "  KRAKEN_API_KEY=your_api_key"
echo "  KRAKEN_API_SECRET=your_api_secret"

