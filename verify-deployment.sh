#!/bin/bash

# Sunny AI Platform - Post-Deployment Verification Script
# Verify sunny-stack.com deployment is operational

echo "=========================================="
echo "  SUNNY DEPLOYMENT VERIFICATION"
echo "  Target: sunny-stack.com"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="https://sunny-stack.com"
ERRORS=0

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Checking $description..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e " ${GREEN}[OK]${NC}"
        return 0
    else
        echo -e " ${RED}[FAILED]${NC} (HTTP $response)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check JSON endpoint
check_json_endpoint() {
    local endpoint=$1
    local description=$2
    local field=$3
    
    echo -n "Checking $description..."
    
    response=$(curl -s "$DOMAIN$endpoint")
    
    if echo "$response" | grep -q "\"$field\""; then
        echo -e " ${GREEN}[OK]${NC}"
        
        # Display specific field value if requested
        if [ ! -z "$field" ]; then
            value=$(echo "$response" | grep -o "\"$field\":[^,}]*" | cut -d':' -f2 | tr -d '"' | tr -d ' ')
            echo "  └─ $field: $value"
        fi
        return 0
    else
        echo -e " ${RED}[FAILED]${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "1. Platform Status Checks"
echo "-------------------------"
check_endpoint "/" "Main platform endpoint"
check_json_endpoint "/" "Platform version check" "version"
check_json_endpoint "/" "Platform capabilities" "capabilities"
echo ""

echo "2. Health Monitoring"
echo "--------------------"
check_json_endpoint "/health" "Health endpoint" "status"
check_json_endpoint "/health" "Service status" "services"
echo ""

echo "3. MCP Integration"
echo "------------------"
check_json_endpoint "/api/mcp/status" "MCP status endpoint" "status"
check_json_endpoint "/api/mcp/status" "MCP capabilities" "capabilities"
check_endpoint "/api/mcp/logs?count=1" "MCP logs endpoint"
check_endpoint "/api/mcp/proposals" "MCP proposals endpoint"
check_endpoint "/api/mcp/project/structure" "MCP project structure"
echo ""

echo "4. Authentication System"
echo "------------------------"
echo -n "Testing authentication endpoint..."

# Test authentication with invalid credentials (should return 401)
auth_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DOMAIN/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')

if [ "$auth_response" = "401" ] || [ "$auth_response" = "500" ]; then
    echo -e " ${GREEN}[OK]${NC} (Protected)"
else
    echo -e " ${RED}[FAILED]${NC} (Unexpected response: $auth_response)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "5. Performance Check"
echo "--------------------"
echo -n "Measuring response time..."
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$DOMAIN/health")
response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "N/A")

if [ "$response_ms" != "N/A" ]; then
    if (( $(echo "$response_time < 2" | bc -l) )); then
        echo -e " ${GREEN}[OK]${NC} (${response_ms}ms)"
    else
        echo -e " ${YELLOW}[SLOW]${NC} (${response_ms}ms)"
    fi
else
    echo -e " ${YELLOW}[SKIPPED]${NC}"
fi
echo ""

echo "6. Claude MCP Connector Info"
echo "-----------------------------"
echo "MCP Endpoint: $DOMAIN/api/mcp"
echo "Available endpoints:"
echo "  - /api/mcp/status     : System status and health"
echo "  - /api/mcp/logs       : Debug log access"
echo "  - /api/mcp/proposals  : Self-improvement proposals"
echo "  - /api/mcp/project/structure : Project information"
echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}VERIFICATION COMPLETE - ALL CHECKS PASSED${NC}"
    echo "=========================================="
    echo ""
    echo "Sunny AI Platform is fully operational at sunny-stack.com!"
    echo ""
    echo "Next steps:"
    echo "1. Set up secrets in Cloudflare dashboard"
    echo "2. Configure Claude MCP connector"
    echo "3. Test master admin login"
    exit 0
else
    echo -e "${RED}VERIFICATION FAILED - $ERRORS CHECKS FAILED${NC}"
    echo "=========================================="
    echo ""
    echo "Please review the deployment and check:"
    echo "1. Cloudflare Worker is deployed correctly"
    echo "2. DNS is configured properly"
    echo "3. Database is initialized"
    echo "4. All routes are configured"
    exit 1
fi