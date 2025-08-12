#!/usr/bin/env node

// 🌐 DNS Record Update Script
// Updates DNS records to point from NavigatorCore tunnel to Trinity tunnel

const https = require('https');

// Configuration
const ZONE_NAME = 'sunny-stack.com';
const OLD_TUNNEL = '400b3203-a4b4-43fa-82ac-9b934431d157.cfargotunnel.com';  // NavigatorCore
const NEW_TUNNEL = '8e637a4c-7fe0-455e-a1c2-ff5366266a39.cfargotunnel.com';  // Trinity

// Statistics
let stats = {
  recordsFound: 0,
  recordsUpdated: 0,
  recordsFailed: 0
};

// Make API request helper
function makeRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({ success: false, errors: [{ message: 'Invalid JSON response' }] });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Get zone ID for domain
async function getZoneId(token) {
  console.log(`🔍 Looking up zone ID for ${ZONE_NAME}...`);
  
  try {
    const path = `/client/v4/zones?name=${ZONE_NAME}`;
    const result = await makeRequest('GET', path, token);
    
    if (result.success && result.result && result.result.length > 0) {
      const zoneId = result.result[0].id;
      console.log(`✅ Found zone ID: ${zoneId}`);
      return zoneId;
    } else {
      console.log(`❌ Zone not found for domain: ${ZONE_NAME}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error getting zone ID: ${error.message}`);
    return null;
  }
}

// Get all DNS records for the zone
async function getDNSRecords(zoneId, token) {
  console.log(`📋 Fetching DNS records for zone...`);
  
  try {
    const path = `/client/v4/zones/${zoneId}/dns_records?type=CNAME&per_page=100`;
    const result = await makeRequest('GET', path, token);
    
    if (result.success && result.result) {
      console.log(`✅ Found ${result.result.length} CNAME records`);
      return result.result;
    } else {
      console.log(`❌ Failed to fetch DNS records`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error fetching DNS records: ${error.message}`);
    return [];
  }
}

// Update a DNS record
async function updateDNSRecord(zoneId, record, token) {
  console.log(`🔧 Updating DNS record: ${record.name}`);
  console.log(`   From: ${OLD_TUNNEL}`);
  console.log(`   To: ${NEW_TUNNEL}`);
  
  try {
    const path = `/client/v4/zones/${zoneId}/dns_records/${record.id}`;
    const body = {
      type: 'CNAME',
      name: record.name,
      content: NEW_TUNNEL,
      ttl: record.ttl,
      proxied: record.proxied
    };
    
    const result = await makeRequest('PUT', path, token, body);
    
    if (result.success) {
      console.log(`✅ Successfully updated: ${record.name}`);
      stats.recordsUpdated++;
      return true;
    } else {
      const errorMsg = result.errors?.[0]?.message || 'Unknown error';
      console.log(`❌ Failed to update ${record.name}: ${errorMsg}`);
      stats.recordsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating ${record.name}: ${error.message}`);
    stats.recordsFailed++;
    return false;
  }
}

// Main DNS update function
async function updateDNS() {
  console.log('🌐 Starting DNS record update...');
  console.log('🔄 Switching from NavigatorCore tunnel to Trinity tunnel');
  console.log('');
  
  // Get API token from environment
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  
  if (!cfToken) {
    console.log('❌ ERROR: CLOUDFLARE_API_TOKEN environment variable not set!');
    console.log('');
    console.log('Please set your API token:');
    console.log('  Windows (PowerShell): $env:CLOUDFLARE_API_TOKEN="your_token_here"');
    console.log('  Windows (CMD): set CLOUDFLARE_API_TOKEN=your_token_here');
    console.log('  Linux/Mac: export CLOUDFLARE_API_TOKEN="your_token_here"');
    console.log('');
    console.log('To create an API token:');
    console.log('  1. Go to https://dash.cloudflare.com/profile/api-tokens');
    console.log('  2. Create a token with Zone:DNS:Edit permissions');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Phase 1: Zone Discovery');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Get zone ID
  const zoneId = await getZoneId(cfToken);
  if (!zoneId) {
    console.log('❌ Cannot proceed without zone ID');
    process.exit(1);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Phase 2: DNS Record Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Get all DNS records
  const records = await getDNSRecords(zoneId, cfToken);
  
  // Find records pointing to old tunnel
  const recordsToUpdate = records.filter(r => r.content === OLD_TUNNEL);
  
  if (recordsToUpdate.length === 0) {
    console.log('✅ No DNS records found pointing to NavigatorCore tunnel');
    console.log('   DNS is already clean or pointing elsewhere');
    
    // Show current CNAME records for reference
    console.log('');
    console.log('📋 Current CNAME records:');
    records.forEach(r => {
      console.log(`   - ${r.name} → ${r.content}`);
    });
  } else {
    stats.recordsFound = recordsToUpdate.length;
    console.log(`🎯 Found ${recordsToUpdate.length} record(s) pointing to NavigatorCore tunnel:`);
    recordsToUpdate.forEach(r => {
      console.log(`   - ${r.name}`);
    });
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Phase 3: Updating DNS Records');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Update each record
    for (const record of recordsToUpdate) {
      await updateDNSRecord(zoneId, record, cfToken);
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DNS Update Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 Records found: ${stats.recordsFound}`);
  console.log(`✅ Records updated: ${stats.recordsUpdated}`);
  console.log(`❌ Records failed: ${stats.recordsFailed}`);
  console.log('');

  // Verification
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Verification: Current DNS State');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Get updated records
  const updatedRecords = await getDNSRecords(zoneId, cfToken);
  const trinityRecords = updatedRecords.filter(r => r.content === NEW_TUNNEL);
  const navigatorRecords = updatedRecords.filter(r => r.content === OLD_TUNNEL);

  console.log('📋 Records pointing to Trinity tunnel:');
  if (trinityRecords.length > 0) {
    trinityRecords.forEach(r => {
      console.log(`   ✅ ${r.name} → Trinity`);
    });
  } else {
    console.log('   ⚠️  No records pointing to Trinity tunnel');
  }

  console.log('');
  console.log('📋 Records still pointing to NavigatorCore:');
  if (navigatorRecords.length > 0) {
    navigatorRecords.forEach(r => {
      console.log(`   ❌ ${r.name} → NavigatorCore (needs manual update)`);
    });
  } else {
    console.log('   ✅ No records pointing to NavigatorCore (clean!)');
  }

  console.log('');
  
  // Final status
  if (stats.recordsFailed === 0 && navigatorRecords.length === 0) {
    console.log('🎉 DNS update completed successfully!');
    console.log('✨ All records now point to Trinity tunnel');
  } else if (stats.recordsUpdated > 0) {
    console.log('⚠️  DNS update partially completed');
    console.log('   Some records may need manual attention');
  } else if (stats.recordsFound === 0) {
    console.log('✅ DNS already configured correctly');
  } else {
    console.log('❌ DNS update encountered errors');
  }
  
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Wait 1-2 minutes for DNS propagation');
  console.log('   2. Test with: curl https://sunny-stack.com');
  console.log('   3. Verify Trinity Dashboard appears');
}

// Run DNS update
updateDNS().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});