import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // For now, return mock response
    return NextResponse.json({
      status: 'completed',
      summary: {
        duration: body.duration || '00:00:00',
        metrics: body.metrics || {},
        productivity_score: 95
      }
    })
    
  } catch (error) {
    console.error('Session end error:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}