#!/usr/bin/env tsx
/**
 * Get Server ID Script
 * 
 * This script retrieves the Server ID for this installation.
 * Customers need to provide this ID to obtain their license key.
 */

import { getServerId } from '../lib/license';

async function main() {
  try {
    console.log('\n🔑 Crypto Rebalancer - Server ID');
    console.log('==========================================\n');
    
    const serverId = await getServerId();
    
    console.log('Your Server ID:');
    console.log('─────────────────────────────────────────────────');
    console.log(serverId);
    console.log('─────────────────────────────────────────────────\n');
    
    console.log('📋 Instructions:');
    console.log('  1. Copy the Server ID above');
    console.log('  2. Send it to your software provider');
    console.log('  3. They will generate a license key for this specific server');
    console.log('  4. Enter the license key when prompted in the application\n');
    
    console.log('⚠️  Important:');
    console.log('  • This ID is unique to THIS installation');
    console.log('  • Your license will ONLY work with this Server ID');
    console.log('  • Keep this ID secure and document it for support purposes\n');
  } catch (error) {
    console.error('❌ Error getting Server ID:', error);
    process.exit(1);
  }
}

main();

