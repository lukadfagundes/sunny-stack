// 🚫 MIDDLEWARE: COMPLETELY DISABLED FOR MCP DEVELOPMENT
// This file has been disabled to allow unrestricted access during MCP development
// To re-enable authentication, uncomment the code below

console.log('🚫 MIDDLEWARE: COMPLETELY DISABLED FOR MCP DEVELOPMENT');

/*
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/refresh', '/reset-password']

// Static assets and Next.js internals
const staticPaths = ['/_next', '/favicon.ico', '/images', '/fonts']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔧 DEBUG: Log all requests
  console.log('🛡️ MIDDLEWARE CHECK:', pathname)
  
  // Completely bypass MCP routes - log and skip
  if (pathname.startsWith('/api/mcp')) {
    console.log('⚡ MIDDLEWARE BYPASS: MCP route detected, skipping auth')
    return NextResponse.next()
  }

  // Allow static assets and Next.js internals
  if (staticPaths.some(path => pathname.startsWith(path))) {
    console.log('📁 MIDDLEWARE: Static path allowed')
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    console.log('✅ MIDDLEWARE: Public route allowed')
    // If user is already authenticated and tries to access login, redirect to dashboard
    const token = request.cookies.get('access_token')?.value
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }
  
  console.log('🔐 MIDDLEWARE: Checking authentication for:', pathname)

  // Check for authentication token
  const token = request.cookies.get('access_token')?.value

  if (!token) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token with backend (optional, can be done client-side)
  // For critical security, validate token on each request
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      
      // Clear invalid token
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }

    // Token is valid, allow request to proceed
    return NextResponse.next()
  } catch (error) {
    console.error('Token verification error:', error)
    // In case of network error, allow request but log the issue
    // In production, you might want to redirect to login
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all request paths except:
    // - api/auth (authentication endpoints)
    // - api/mcp (MCP endpoints - public access)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!api/auth|api/mcp|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
*/

// Export empty middleware that allows everything through
export function middleware() {
  console.log('🔓 SECURITY: Middleware disabled - full access mode');
  // No authentication checks - all requests allowed
}

// Empty matcher = no routes are protected
export const config = {
  matcher: []
}