#!/usr/bin/env node

// 🧹 Cloudflare NavigatorCore Cleanup Script - API Method
// Uses Cloudflare API to remove all NavigatorCore infrastructure

const https = require('https');

// Cloudflare Account Configuration
const ACCOUNT_ID = '41aae0afe4c761da12a0a1f16dbbcb73';
const API_BASE = 'api.cloudflare.com';

// Workers to delete
const WORKERS_TO_DELETE = [
  'sunny-stack-gateway',
  'sunny-stack-security',
  'sunny-stack-security-production',
  'sunny-stack-performance-worker'
];

// KV Namespaces to delete
const KV_NAMESPACES_TO_DELETE = [
  { id: '334cc46e91ec4d0299162122d20ddf4d', name: 'sunny-stack-cache' },
  { id: '3654b008d6d248a6a69382b1413bd9e7', name: 'sunny-stack-auth-cache' }
];

// Statistics tracking
let stats = {
  workersDeleted: 0,
  workersFailed: 0,
  kvDeleted: 0,
  kvFailed: 0
};

// Make API request helper
function makeRequest(method, path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
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

    req.end();
  });
}

// Delete a worker
async function deleteWorker(workerName, token) {
  console.log(`🔧 Deleting worker: ${workerName}`);
  
  try {
    const path = `/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${workerName}`;
    const result = await makeRequest('DELETE', path, token);
    
    if (result.success) {
      console.log(`✅ Successfully deleted worker: ${workerName}`);
      stats.workersDeleted++;
      return true;
    } else {
      const errorMsg = result.errors?.[0]?.message || 'Unknown error';
      
      // Check if worker doesn't exist
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        console.log(`⚠️  Worker not found (already deleted): ${workerName}`);
        return true;
      }
      
      console.log(`❌ Failed to delete worker ${workerName}: ${errorMsg}`);
      stats.workersFailed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Error deleting worker ${workerName}: ${error.message}`);
    stats.workersFailed++;
    return false;
  }
}

// Delete a KV namespace
async function deleteKVNamespace(namespace, token) {
  console.log(`💾 Deleting KV namespace: ${namespace.name} (${namespace.id})`);
  
  try {
    const path = `/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespace.id}`;
    const result = await makeRequest('DELETE', path, token);
    
    if (result.success) {
      console.log(`✅ Successfully deleted KV namespace: ${namespace.name}`);
      stats.kvDeleted++;
      return true;
    } else {
      const errorMsg = result.errors?.[0]?.message || 'Unknown error';
      
      // Check if namespace doesn't exist
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        console.log(`⚠️  KV namespace not found (already deleted): ${namespace.name}`);
        return true;
      }
      
      console.log(`❌ Failed to delete KV namespace ${namespace.name}: ${errorMsg}`);
      stats.kvFailed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Error deleting KV namespace ${namespace.name}: ${error.message}`);
    stats.kvFailed++;
    return false;
  }
}

// List current workers (for verification)
async function listWorkers(token) {
  try {
    const path = `/client/v4/accounts/${ACCOUNT_ID}/workers/scripts`;
    const result = await makeRequest('GET', path, token);
    
    if (result.success && result.result) {
      return result.result.map(w => w.id);
    }
    return [];
  } catch (error) {
    console.log(`⚠️  Could not list workers: ${error.message}`);
    return [];
  }
}

// List current KV namespaces (for verification)
async function listKVNamespaces(token) {
  try {
    const path = `/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces`;
    const result = await makeRequest('GET', path, token);
    
    if (result.success && result.result) {
      return result.result.map(kv => ({ id: kv.id, title: kv.title }));
    }
    return [];
  } catch (error) {
    console.log(`⚠️  Could not list KV namespaces: ${error.message}`);
    return [];
  }
}

// Main cleanup function
async function cleanupCloudflare() {
  console.log('🧹 Starting Cloudflare NavigatorCore cleanup via API...');
  console.log('🔍 This will remove all NavigatorCore contamination from your account');
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
    console.log('  2. Create a token with Workers Scripts:Edit and Account:KV Storage:Edit permissions');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Phase 1: Deleting Workers');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Delete workers
  for (const worker of WORKERS_TO_DELETE) {
    await deleteWorker(worker, cfToken);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 Phase 2: Deleting KV Namespaces');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Delete KV namespaces
  for (const namespace of KV_NAMESPACES_TO_DELETE) {
    await deleteKVNamespace(namespace, cfToken);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Cleanup Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔧 Workers processed: ${WORKERS_TO_DELETE.length}`);
  console.log(`✅ Workers deleted: ${stats.workersDeleted}`);
  console.log(`❌ Workers failed: ${stats.workersFailed}`);
  console.log(`💾 KV namespaces processed: ${KV_NAMESPACES_TO_DELETE.length}`);
  console.log(`✅ KV namespaces deleted: ${stats.kvDeleted}`);
  console.log(`❌ KV namespaces failed: ${stats.kvFailed}`);
  console.log('');

  // Verification
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Verification: Current Cloudflare State');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const remainingWorkers = await listWorkers(cfToken);
  const remainingKV = await listKVNamespaces(cfToken);

  console.log('📋 Remaining Workers:');
  if (remainingWorkers.length === 0) {
    console.log('  ✅ No workers found (clean state)');
  } else {
    remainingWorkers.forEach(w => console.log(`  - ${w}`));
  }
  
  console.log('');
  console.log('📋 Remaining KV Namespaces:');
  if (remainingKV.length === 0) {
    console.log('  ✅ No KV namespaces found (clean state)');
  } else {
    remainingKV.forEach(kv => console.log(`  - ${kv.title} (${kv.id})`));
  }

  console.log('');
  
  // Final status
  const totalOperations = WORKERS_TO_DELETE.length + KV_NAMESPACES_TO_DELETE.length;
  const successfulOperations = stats.workersDeleted + stats.kvDeleted;
  
  if (stats.workersFailed === 0 && stats.kvFailed === 0) {
    console.log('🎉 Cloudflare API cleanup completed successfully!');
  } else if (successfulOperations > 0) {
    console.log('⚠️  Cleanup completed with some items already deleted or not found');
  } else {
    console.log('❌ Cleanup encountered errors. Please check your API token permissions.');
  }
  
  console.log('💡 Next step: Run DNS update script if needed');
}

// Run cleanup
cleanupCloudflare().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});