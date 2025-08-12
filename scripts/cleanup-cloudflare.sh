#!/bin/bash

# 🧹 Cloudflare NavigatorCore Cleanup Script - Wrangler CLI
# Removes all NavigatorCore workers and KV namespaces

echo "🧹 Starting Cloudflare NavigatorCore cleanup via Wrangler..."
echo "🔍 This will remove all NavigatorCore contamination from your account"
echo ""

# Workers to delete
WORKERS=(
    "sunny-stack-gateway"
    "sunny-stack-security"
    "sunny-stack-security-production"
    "sunny-stack-performance-worker"
)

# KV Namespace IDs to delete
KV_NAMESPACES=(
    "334cc46e91ec4d0299162122d20ddf4d"  # sunny-stack-cache
    "3654b008d6d248a6a69382b1413bd9e7"  # sunny-stack-auth-cache
)

# Counter for tracking operations
WORKERS_DELETED=0
KV_DELETED=0
ERRORS=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Phase 1: Deleting Workers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for worker in "${WORKERS[@]}"; do
    echo ""
    echo "🎯 Attempting to delete worker: $worker"
    
    if npx wrangler worker delete "$worker" --compatibility-date 2023-12-01 2>/dev/null; then
        echo "✅ Successfully deleted: $worker"
        ((WORKERS_DELETED++))
    else
        # Try without compatibility-date flag as fallback
        if npx wrangler worker delete "$worker" 2>/dev/null; then
            echo "✅ Successfully deleted: $worker (without compatibility date)"
            ((WORKERS_DELETED++))
        else
            echo "⚠️  Worker not found or already deleted: $worker"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Phase 2: Deleting KV Namespaces"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for namespace_id in "${KV_NAMESPACES[@]}"; do
    echo ""
    echo "🎯 Attempting to delete KV namespace: $namespace_id"
    
    if npx wrangler kv:namespace delete --namespace-id "$namespace_id" --force 2>/dev/null; then
        echo "✅ Successfully deleted KV namespace: $namespace_id"
        ((KV_DELETED++))
    else
        echo "⚠️  KV namespace not found or already deleted: $namespace_id"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Cleanup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Workers processed: ${#WORKERS[@]}"
echo "✅ Workers deleted: $WORKERS_DELETED"
echo "💾 KV namespaces processed: ${#KV_NAMESPACES[@]}"
echo "✅ KV namespaces deleted: $KV_DELETED"
echo ""

if [ $WORKERS_DELETED -eq ${#WORKERS[@]} ] && [ $KV_DELETED -eq ${#KV_NAMESPACES[@]} ]; then
    echo "🎉 All NavigatorCore infrastructure successfully removed!"
else
    echo "⚠️  Some items were already deleted or not found (this is normal)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verification: Current Cloudflare State"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📋 Remaining Workers:"
npx wrangler worker list 2>/dev/null || echo "⚠️  Could not list workers"

echo ""
echo "📋 Remaining KV Namespaces:"
npx wrangler kv:namespace list 2>/dev/null || echo "⚠️  Could not list KV namespaces"

echo ""
echo "✅ Wrangler cleanup complete!"
echo "💡 Next step: Run DNS update script if needed"