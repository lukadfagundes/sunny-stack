'use client'
import { useState, useEffect } from 'react'

export default function SimpleTest() {
  const [backendStatus, setBackendStatus] = useState<any>(null)
  const [frontendPort, setFrontendPort] = useState<number | null>(null)

  useEffect(() => {
    // Get the current port
    if (typeof window !== 'undefined') {
      const port = window.location.port || '80'
      setFrontendPort(parseInt(port))
    }

    // Test backend connection
    testBackend()
  }, [])

  const testBackend = async () => {
    try {
      const response = await fetch('/api/auth/health')
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        setBackendStatus({ success: true, data })
      } catch {
        setBackendStatus({ success: false, message: text })
      }
    } catch (error: any) {
      setBackendStatus({ success: false, message: error.message })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">🌟 Sunny Stack - System Check</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Frontend Status</h2>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium">Port:</span>
                <span className="text-green-600 font-mono">{frontendPort || 'Loading...'}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-green-600">✅ Running</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Framework:</span>
                <span className="text-gray-600">Next.js 14</span>
              </p>
            </div>
          </div>

          {/* Backend Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Backend Status</h2>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium">Port:</span>
                <span className="font-mono">8000</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">API:</span>
                <span className={backendStatus?.success ? 'text-green-600' : 'text-red-600'}>
                  {backendStatus?.success ? '✅ Connected' : '❌ Not Connected'}
                </span>
              </p>
              {backendStatus?.data && (
                <p className="flex justify-between">
                  <span className="font-medium">Service:</span>
                  <span className="text-gray-600">{backendStatus.data.service || 'Auth Service'}</span>
                </p>
              )}
            </div>
            <button
              onClick={testBackend}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/" className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all">
              🏠 Landing Page
            </a>
            <a href="/login" className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
              🔐 Login Page
            </a>
            <a href="/hud" className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all">
              🥤 Cola Records HUD
            </a>
            <a href="/test" className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all">
              🧪 Test Page
            </a>
          </div>
        </div>

        {/* Backend Info */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Backend Setup Required</h3>
          <p className="text-yellow-700 mb-4">
            If the backend is not connected, please restart it with:
          </p>
          <code className="block bg-gray-900 text-green-400 p-4 rounded font-mono">
            cd C:\Sunny\backend && .\venv\Scripts\python -m uvicorn app.main:asgi_app --reload --port 8000
          </code>
        </div>

        {/* Error Details */}
        {backendStatus && !backendStatus.success && (
          <div className="mt-8 bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
            <pre className="text-red-700 text-sm overflow-auto">
              {JSON.stringify(backendStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}