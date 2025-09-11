import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'Sunny Stack Test <test@sunny-stack.com>',
      to: ['luka@sunny-stack.com'],
      subject: 'Test Email - DNS Configuration',
      html: '<h1>Test Email</h1><p>If you receive this, your email is working!</p><p>Sent at: ' + new Date().toISOString() + '</p>',
    })
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error }, { status: 500 })
  }
}