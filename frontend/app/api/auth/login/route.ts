import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward login request to backend
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Login failed' },
        { status: response.status }
      )
    }

    // If MFA is required, return without setting cookies
    if (data.requires_mfa) {
      return NextResponse.json(data)
    }

    // Create response with simplified data
    const nextResponse = NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
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

    // Also set a non-httpOnly cookie with basic user info for client-side access
    nextResponse.cookies.set({
      name: 'user_info',
      value: JSON.stringify({
        email: body.email,
        isAuthenticated: true
      }),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return nextResponse
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}