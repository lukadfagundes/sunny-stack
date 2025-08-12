'use client'
import { useState, useEffect } from 'react'

export default function TestPage() {
  const [backendStatus, setBackendStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkBackend()
  }, [])

  const checkBackend = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/health')
      if (response.ok) {
        const data = await response.json()
        setBackendStatus(data)
      } else {
        setError(`Backend returned status: ${response.status}`)
      }
    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sunny Stack - Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Frontend Status</h2>
          <div className="space-y-2">
            <p><strong>Port:</strong> 3000 ✅</p>
            <p><strong>Next.js:</strong> Running ✅</p>
            <p><strong>Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
          {loading ? (
            <p>Checking backend connection...</p>
          ) : error ? (
            <div className="text-red-600">
              <p><strong>Error:</strong> {error}</p>
              <p className="mt-2 text-sm">Make sure the backend is running on port 8000</p>
            </div>
          ) : backendStatus ? (
            <div className="space-y-2 text-green-600">
              <p><strong>Status:</strong> {backendStatus.status} ✅</p>
              <p><strong>Service:</strong> {backendStatus.service || 'Authentication'}</p>
            </div>
          ) : (
            <p>No response from backend</p>
          )}
          
          <button
            onClick={checkBackend}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">→ Landing Page</a>
            <a href="/login" className="block text-blue-600 hover:underline">→ Login Page</a>
            <a href="/hud" className="block text-blue-600 hover:underline">→ Cola Records HUD</a>
            <a href="/admin" className="block text-blue-600 hover:underline">→ Admin Panel</a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If the backend connection fails, make sure to restart the Next.js server after updating next.config.js
          </p>
        </div>
      </div>
    </div>
  )
}