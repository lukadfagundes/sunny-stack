import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json({
    message: 'Logged out successfully'
  })

  // Clear all authentication cookies
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  response.cookies.delete('user_info')

  return response
}