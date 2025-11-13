/**
 * Database Seed Script
 * Populates the database with sample portfolios for testing
 * 
 * Usage:
 *   npm run db:seed
 */

import prisma from '../lib/prisma';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...');
  await prisma.rebalanceHistory.deleteMany();
  await prisma.portfolio.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create sample portfolios
  console.log('📊 Creating sample portfolios...\n');

  // Portfolio 1: Conservative Strategy
  const conservative = await prisma.portfolio.create({
    data: {
      name: 'Conservative Portfolio',
      userId: 'demo-user',
      targetWeights: {
        BTC: 60,
        ETH: 40,
      },
      rebalanceEnabled: true,
      rebalanceInterval: 'monthly',
      rebalanceThreshold: 10.0,
      maxOrdersPerRebalance: 10,
      lastRebalancedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      nextRebalanceAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
    },
  });
  console.log('✅ Created:', conservative.name);
  console.log(`   - Target: BTC 60%, ETH 40%`);
  console.log(`   - Interval: monthly`);
  console.log(`   - ID: ${conservative.id}\n`);

  // Portfolio 2: Balanced Strategy
  const balanced = await prisma.portfolio.create({
    data: {
      name: 'Balanced Portfolio',
      userId: 'demo-user',
      targetWeights: {
        BTC: 40,
        ETH: 30,
        SOL: 20,
        ADA: 10,
      },
      rebalanceEnabled: true,
      rebalanceInterval: 'weekly',
      rebalanceThreshold: 5.0,
      maxOrdersPerRebalance: 20,
      lastRebalancedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextRebalanceAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
  });
  console.log('✅ Created:', balanced.name);
  console.log(`   - Target: BTC 40%, ETH 30%, SOL 20%, ADA 10%`);
  console.log(`   - Interval: weekly`);
  console.log(`   - ID: ${balanced.id}\n`);

  // Portfolio 3: Aggressive Strategy
  const aggressive = await prisma.portfolio.create({
    data: {
      name: 'Aggressive Portfolio',
      userId: 'demo-user',
      targetWeights: {
        BTC: 25,
        ETH: 25,
        SOL: 25,
        ADA: 15,
        DOT: 10,
      },
      rebalanceEnabled: true,
      rebalanceInterval: 'daily',
      rebalanceThreshold: 3.0,
      maxOrdersPerRebalance: 30,
      lastRebalancedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      nextRebalanceAt: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
    },
  });
  console.log('✅ Created:', aggressive.name);
  console.log(`   - Target: BTC 25%, ETH 25%, SOL 25%, ADA 15%, DOT 10%`);
  console.log(`   - Interval: daily`);
  console.log(`   - ID: ${aggressive.id}\n`);

  // Portfolio 4: HODLer (manual only)
  const hodler = await prisma.portfolio.create({
    data: {
      name: 'HODLer Portfolio',
      userId: 'demo-user',
      targetWeights: {
        BTC: 80,
        ETH: 20,
      },
      rebalanceEnabled: false, // Manual rebalancing only
      rebalanceInterval: 'monthly',
      rebalanceThreshold: 15.0,
      maxOrdersPerRebalance: 5,
      lastRebalancedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      nextRebalanceAt: null, // No automatic rebalancing
    },
  });
  console.log('✅ Created:', hodler.name);
  console.log(`   - Target: BTC 80%, ETH 20%`);
  console.log(`   - Interval: manual only`);
  console.log(`   - ID: ${hodler.id}\n`);

  // Create sample rebalance history
  console.log('📜 Creating sample rebalance history...\n');

  // History 1: Successful rebalance for Balanced Portfolio
  await prisma.rebalanceHistory.create({
    data: {
      portfolioId: balanced.id,
      executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      success: true,
      dryRun: false,
      portfolioValue: 12500.00,
      ordersPlanned: 4,
      ordersExecuted: 4,
      ordersFailed: 0,
      totalValueTraded: 1250.50,
      orders: [
        { pair: 'XXBTZEUR', type: 'buy', volume: 0.025, price: 50000, status: 'executed' },
        { pair: 'XETHZEUR', type: 'sell', volume: 0.5, price: 3500, status: 'executed' },
        { pair: 'SOLEUR', type: 'buy', volume: 10, price: 150, status: 'executed' },
        { pair: 'ADAEUR', type: 'sell', volume: 200, price: 0.50, status: 'executed' },
      ],
      errors: undefined,
      triggeredBy: 'scheduler',
      duration: 3450, // 3.45 seconds
    },
  });
  console.log('✅ Created rebalance history for:', balanced.name);

  // History 2: Dry-run for Conservative Portfolio
  await prisma.rebalanceHistory.create({
    data: {
      portfolioId: conservative.id,
      executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      success: true,
      dryRun: true,
      portfolioValue: 25000.00,
      ordersPlanned: 2,
      ordersExecuted: 0, // Dry run - no actual execution
      ordersFailed: 0,
      totalValueTraded: 0,
      orders: [
        { pair: 'XXBTZEUR', type: 'buy', volume: 0.05, price: 50000, status: 'dry-run' },
        { pair: 'XETHZEUR', type: 'sell', volume: 1.0, price: 3500, status: 'dry-run' },
      ],
      errors: undefined,
      triggeredBy: 'manual',
      duration: 1250,
    },
  });
  console.log('✅ Created dry-run history for:', conservative.name);

  // History 3: Failed rebalance for Aggressive Portfolio
  await prisma.rebalanceHistory.create({
    data: {
      portfolioId: aggressive.id,
      executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      success: false,
      dryRun: false,
      portfolioValue: 8500.00,
      ordersPlanned: 5,
      ordersExecuted: 3,
      ordersFailed: 2,
      totalValueTraded: 750.00,
      orders: [
        { pair: 'XXBTZEUR', type: 'buy', volume: 0.015, price: 50000, status: 'executed' },
        { pair: 'XETHZEUR', type: 'sell', volume: 0.2, price: 3500, status: 'executed' },
        { pair: 'SOLEUR', type: 'buy', volume: 5, price: 150, status: 'executed' },
        { pair: 'ADAEUR', type: 'buy', volume: 100, price: 0.50, status: 'failed' },
        { pair: 'DOTEUR', type: 'sell', volume: 50, price: 15, status: 'failed' },
      ],
      errors: [
        'Insufficient balance for ADAEUR order',
        'Order volume below minimum for DOTEUR',
      ],
      triggeredBy: 'api',
      duration: 5670,
    },
  });
  console.log('✅ Created failed rebalance history for:', aggressive.name);

  console.log('\n🎉 Database seed completed successfully!\n');

  // Print summary
  const portfolioCount = await prisma.portfolio.count();
  const historyCount = await prisma.rebalanceHistory.count();

  console.log('📊 Summary:');
  console.log(`   - Portfolios created: ${portfolioCount}`);
  console.log(`   - History entries created: ${historyCount}\n`);

  console.log('🚀 Next steps:');
  console.log('   1. Start development server: npm run dev');
  console.log('   2. Open dashboard: http://localhost:3000/dashboard');
  console.log('   3. View portfolios in sidebar');
  console.log('   4. Configure Kraken API credentials to see live data\n');

  console.log('💡 Portfolio IDs for API testing:');
  console.log(`   Conservative: ${conservative.id}`);
  console.log(`   Balanced: ${balanced.id}`);
  console.log(`   Aggressive: ${aggressive.id}`);
  console.log(`   HODLer: ${hodler.id}\n`);

  console.log('🧪 Test commands:');
  console.log(`   # View portfolio`);
  console.log(`   curl http://localhost:3000/api/portfolios/manage?id=${balanced.id}\n`);
  console.log(`   # Trigger rebalance`);
  console.log(`   curl -X POST http://localhost:3000/api/scheduler/trigger \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"portfolioId": "${balanced.id}"}'\n`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

