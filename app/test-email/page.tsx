'use client'

import { useState } from 'react'

export default function TestEmail() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const sendTestEmail = async () => {
    setLoading(true)
    setStatus('Sending...')
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'GET',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus('✅ Test email sent! Check your inbox.')
        console.log('Success:', data)
      } else {
        setStatus('❌ Error sending email')
        console.error('Error:', data)
      }
    } catch (error) {
      setStatus('❌ Error: ' + error)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-sunny-darkRed mb-6">Email Test Page</h1>
            
            <p className="text-sunny-brown/80 mb-6">
              Click the button to send a test email to luka@sunny-stack.com
            </p>
            
            <button
              onClick={sendTestEmail}
              disabled={loading}
              className="bg-sunny-red hover:bg-sunny-darkRed disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
            
            {status && (
              <div className="mt-6 p-4 bg-sunny-gold/20 rounded-lg">
                <p className="text-sunny-brown">{status}</p>
              </div>
            )}
            
            <div className="mt-8 text-sm text-sunny-brown/60">
              <p>This will send an email to:</p>
              <p className="font-mono">luka@sunny-stack.com</p>
              <p className="font-mono">luka.fagundes93@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}