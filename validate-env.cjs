// Quick environment validation script
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  // Database (1)
  'DATABASE_URL',

  // NextAuth (3)
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'ADMIN_EMAIL',

  // Admin Security (1)
  'ADMIN_ROUTE_HASH',

  // Google OAuth (4)
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_PROJECT_ID',

  // Discord Bot (4 + 13 channels = 17)
  'DISCORD_BOT_TOKEN',
  'DISCORD_APPLICATION_ID',
  'DISCORD_GUILD_ID',
  'DISCORD_ADMIN_USER_ID',
  'DISCORD_CHANNEL_ADMIN_LOGS',
  'DISCORD_CHANNEL_BOT_COMMANDS',
  'DISCORD_CHANNEL_ACTIVE_PROJECTS',
  'DISCORD_CHANNEL_PROPOSALS',
  'DISCORD_CHANNEL_TASKS',
  'DISCORD_CHANNEL_TIME_TRACKING',
  'DISCORD_CHANNEL_CLIENT_INQUIRIES',
  'DISCORD_CHANNEL_CLIENT_UPDATES',
  'DISCORD_CHANNEL_CALENDAR_SYNC',
  'DISCORD_CHANNEL_EMAIL_NOTIFICATIONS',
  'DISCORD_CHANNEL_ANALYTICS',
  'DISCORD_CHANNEL_INVOICES',
  'DISCORD_CHANNEL_PAYMENTS',

  // Bot API (2)
  'BOT_API_KEY',
  'BOT_API_URL',

  // Deployment & CI/CD APIs (2)
  'GITHUB_API_TOKEN',
  'VERCEL_API_TOKEN',

  // Infrastructure Monitoring APIs (5)
  'FLY_API_TOKEN',
  'FLY_ORG_SLUG',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'CRONJOB_API_KEY',
];

console.log('🔍 Validating environment configuration...\n');

let missingVars = [];
let emptyVars = [];
let totalVars = requiredVars.length;
let validVars = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];

  if (!value) {
    missingVars.push(varName);
  } else if (value.startsWith('your-') || value.includes('replace-this') || value === '""' || value === '') {
    emptyVars.push(varName);
  } else {
    validVars++;
  }
});

// Display results
console.log(`📊 Validation Results:\n`);
console.log(`✅ Valid variables: ${validVars}/${totalVars}`);

if (missingVars.length > 0) {
  console.log(`\n❌ Missing variables (${missingVars.length}):`);
  missingVars.forEach(v => console.log(`   - ${v}`));
}

if (emptyVars.length > 0) {
  console.log(`\n⚠️  Empty/placeholder variables (${emptyVars.length}):`);
  emptyVars.forEach(v => console.log(`   - ${v}`));
}

console.log('\n' + '='.repeat(60));

if (missingVars.length === 0 && emptyVars.length === 0) {
  console.log('\n🎉 SUCCESS! All environment variables are configured!\n');
  console.log('✅ Phase 0 Prerequisites: COMPLETE');
  console.log('✅ Ready to proceed with /trinity-orchestrate\n');
  process.exit(0);
} else {
  console.log('\n❌ Configuration incomplete. Please fix the issues above.\n');
  console.log('📖 Documentation:');
  console.log('   - Discord: docs/discord-bot-oauth-setup.md');
  console.log('   - Google: docs/google-api-setup.md');
  console.log('   - Database: docs/README.md#3-database-setup');
  console.log('   - Fly.io: docs/fly-io-setup.md');
  console.log('   - Cloudflare: docs/cloudflare-api-setup.md');
  console.log('   - cron-job.org: docs/cronjob-api-setup.md\n');
  process.exit(1);
}
