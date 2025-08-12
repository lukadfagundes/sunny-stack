import { NextRequest, NextResponse } from 'next/server';

// 🔧 DEBUG: MCP Route Handler
console.log('🔧 MCP ROUTE: Handler loaded and ready');

export async function GET(request: NextRequest) {
  console.log('🌐 MCP GET REQUEST: Received at', new Date().toISOString());
  console.log('📋 MCP HEADERS:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Forward to backend with debugging
    const backendUrl = 'http://localhost:8000/api/mcp';
    console.log('⚡ MCP FORWARD: Sending to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
        'User-Agent': request.headers.get('user-agent') || 'NextJS-MCP-Proxy'
      }
    });
    
    console.log('📤 MCP BACKEND RESPONSE:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📝 MCP DATA:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
      }
    });
    
  } catch (error: any) {
    console.error('❌ MCP ERROR:', error);
    return NextResponse.json(
      { error: 'MCP proxy failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🌐 MCP POST REQUEST: Received at', new Date().toISOString());
  console.log('📋 MCP HEADERS:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('📝 MCP REQUEST BODY:', JSON.stringify(body, null, 2));
    
    // Forward to backend with debugging
    const backendUrl = 'http://localhost:8000/api/mcp';
    console.log('⚡ MCP FORWARD: Sending to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': request.headers.get('X-API-Key') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
        'User-Agent': request.headers.get('user-agent') || 'NextJS-MCP-Proxy'
      },
      body: JSON.stringify(body)
    });
    
    console.log('📤 MCP BACKEND RESPONSE:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📝 MCP RESPONSE DATA:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
      }
    });
    
  } catch (error: any) {
    console.error('❌ MCP POST ERROR:', error);
    return NextResponse.json(
      { error: 'MCP proxy failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log('🌐 MCP OPTIONS REQUEST: CORS preflight');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
    }
  });
}