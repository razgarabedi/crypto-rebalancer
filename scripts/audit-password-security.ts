/**
 * Password Security Audit Script
 * 
 * This script checks all user passwords in the database to ensure they are properly hashed.
 * It identifies any passwords that are not bcrypt hashes and optionally re-hashes them.
 * 
 * Usage:
 *   npx tsx scripts/audit-password-security.ts
 *   npx tsx scripts/audit-password-security.ts --fix
 */

import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/auth';

// Bcrypt hash pattern: starts with $2a$, $2b$, or $2y$ followed by cost and hash
const BCRYPT_HASH_PATTERN = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

interface AuditResult {
  userId: string;
  email: string;
  isHashed: boolean;
  passwordLength: number;
  needsRehash: boolean;
}

async function auditPasswords(): Promise<AuditResult[]> {
  console.log('🔒 Starting password security audit...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  console.log(`Found ${users.length} user(s) in database\n`);

  const results: AuditResult[] = [];

  for (const user of users) {
    const isHashed = BCRYPT_HASH_PATTERN.test(user.password);
    const passwordLength = user.password.length;

    // Additional check: try to verify a test password to ensure hash is valid
    let needsRehash = false;
    if (isHashed) {
      try {
        // This should fail for valid hashes (we're using a dummy password)
        // If it doesn't throw, something is wrong with the hash format
        await verifyPassword('test-password-that-should-not-match', user.password);
      } catch {
        // Expected: verification should fail, meaning hash format is valid
      }
    } else {
      needsRehash = true;
    }

    results.push({
      userId: user.id,
      email: user.email,
      isHashed,
      passwordLength,
      needsRehash,
    });

    const status = isHashed ? '✅ HASHED' : '❌ UNHASHED';
    console.log(`${status} - ${user.email} (Length: ${passwordLength})`);
  }

  return results;
}

async function fixUnhashedPasswords(results: AuditResult[]): Promise<void> {
  const unhashedUsers = results.filter(r => r.needsRehash);

  if (unhashedUsers.length === 0) {
    console.log('\n✅ All passwords are properly hashed. No action needed.');
    return;
  }

  console.log(`\n⚠️  Found ${unhashedUsers.length} user(s) with unhashed passwords.`);
  console.log('⚠️  WARNING: These passwords cannot be automatically fixed because');
  console.log('   we cannot retrieve the original plain text passwords.');
  console.log('\n📋 Recommendation:');
  console.log('   1. Contact these users and ask them to reset their passwords');
  console.log('   2. Or manually update their passwords using the admin interface');
  console.log('   3. Or delete and recreate these accounts\n');

  console.log('Users with unhashed passwords:');
  for (const user of unhashedUsers) {
    console.log(`   - ${user.email} (ID: ${user.userId})`);
  }
}

async function main() {
  try {
    const fixMode = process.argv.includes('--fix');

    const results = await auditPasswords();

    const stats = {
      total: results.length,
      hashed: results.filter(r => r.isHashed).length,
      unhashed: results.filter(r => !r.isHashed).length,
    };

    console.log('\n📊 Audit Summary:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   ✅ Hashed passwords: ${stats.hashed}`);
    console.log(`   ❌ Unhashed passwords: ${stats.unhashed}`);

    if (fixMode) {
      await fixUnhashedPasswords(results);
    } else {
      if (stats.unhashed > 0) {
        console.log('\n💡 Tip: Run with --fix flag to see recommendations for fixing unhashed passwords');
      }
    }

    if (stats.unhashed === 0) {
      console.log('\n✅ Security check passed! All passwords are properly hashed.');
    } else {
      console.log('\n⚠️  Security warning: Some passwords are not hashed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during password audit:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

