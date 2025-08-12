import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔧 [AUTH_API] Login request received for:', body.email)
    
    // Forward login request to backend
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Debug the raw response first
    const responseText = await response.text()
    console.log('🔧 [JSON_DEBUG] Raw response text:', responseText)
    console.log('📊 [JSON_DEBUG] Response length:', responseText.length)
    console.log('🎯 [JSON_DEBUG] First 200 chars:', responseText.substring(0, 200))
    console.log('📋 [JSON_DEBUG] Last 100 chars:', responseText.substring(responseText.length - 100))
    
    // Try to parse JSON
    let data
    try {
      data = JSON.parse(responseText)
      console.log('✅ [JSON_DEBUG] Successfully parsed JSON:', data)
    } catch (parseError: any) {
      console.error('❌ [JSON_DEBUG] JSON Parse Error:', parseError.message)
      console.error('🔍 [JSON_DEBUG] Error position:', parseError.toString())
      
      // Return a proper error response
      return NextResponse.json(
        { error: 'Invalid response from authentication server', detail: parseError.message },
        { status: 500 }
      )
    }
    console.log('📊 [AUTH_API] Backend response:', { 
      status: response.status, 
      hasUser: !!data.user,
      userEmail: data.user?.email,
      userRole: data.user?.role,
      isMaster: data.user?.is_master 
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Login failed' },
        { status: response.status }
      )
    }

    // If MFA is required, return without setting cookies
    if (data.requires_mfa) {
      console.log('🔐 [AUTH_API] MFA required for user')
      return NextResponse.json(data)
    }

    // Validate user data exists
    if (!data.user) {
      console.error('🚨 [AUTH_API] No user object in backend response')
      return NextResponse.json(
        { error: 'Invalid authentication response' },
        { status: 500 }
      )
    }

    console.log('✅ [AUTH_API] Login successful for:', data.user.email, 'Role:', data.user.role, 'Is Master:', data.user.is_master)

    // Create response with full user data from backend
    const nextResponse = NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
      user: data.user, // Include the full user object from backend
      message: 'Login successful'
    })

    // Set secure HTTP-only cookie for access token
    nextResponse.cookies.set({
      name: 'access_token',
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    // Also set a non-httpOnly cookie with user info for client-side access
    nextResponse.cookies.set({
      name: 'user_info',
      value: JSON.stringify({
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        is_master: data.user.is_master,
        isAuthenticated: true
      }),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return nextResponse
  } catch (error: any) {
    console.error('❌ [AUTH_API] Login route error:', error)
    console.error('🔍 [AUTH_API] Error stack:', error.stack)
    
    // Return a detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error',
        detail: error.message || 'Unknown error occurred',
        type: error.name || 'Error'
      },
      { status: 500 }
    )
  }
}