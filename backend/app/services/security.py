import os
import logging
from datetime import datetime
from fastapi import Header, HTTPException, Request

# 🔧 DEBUG: MCP Security logging
mcp_logger = logging.getLogger("mcp_security")
mcp_logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
mcp_logger.addHandler(handler)

MCP_API_KEY = os.getenv("MCP_API_KEY", "QIWmnmR50_jDNa_iKzdbz6bsCYvIZKDEkz0JLRKFDP0")

async def verify_mcp_api_key(
    request: Request,
    x_api_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    timestamp = datetime.now().isoformat()
    path = request.url.path
    method = request.method
    
    # 🔧 DEBUG: Log all MCP access attempts
    mcp_logger.info(f"🔒 MCP AUTH CHECK [{timestamp}] {method} {path}")
    mcp_logger.debug(f"    x-api-key: {'PROVIDED' if x_api_key else 'MISSING'}")
    mcp_logger.debug(f"    authorization: {'PROVIDED' if authorization else 'MISSING'}")
    
    if request.method == "OPTIONS":
        mcp_logger.info(f"✅ CORS PREFLIGHT ALLOWED [{timestamp}]")
        return True  # allow CORS preflight

    key = x_api_key
    if not key and authorization and authorization.lower().startswith("bearer "):
        key = authorization.split(" ", 1)[1]
        mcp_logger.debug(f"🔑 Extracted key from Authorization header")

    if not MCP_API_KEY:
        mcp_logger.warning(f"⚠️  MCP_API_KEY not set - allowing open access [{timestamp}]")
        return True  # open for local/dev if unset

    if key == MCP_API_KEY:
        mcp_logger.info(f"✅ MCP API KEY VALID [{timestamp}] - Access granted")
        return True
    
    # Allow without key for development
    if not key:
        mcp_logger.warning(f"⚠️  No API key provided - allowing for development [{timestamp}]")
        return True
    
    mcp_logger.error(f"❌ MCP API KEY INVALID [{timestamp}] - Access denied")
    mcp_logger.debug(f"    Expected key length: {len(MCP_API_KEY)}")
    mcp_logger.debug(f"    Provided key length: {len(key) if key else 0}")
    
    raise HTTPException(status_code=401, detail="Invalid MCP API key")