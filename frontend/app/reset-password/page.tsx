'use client'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        setStep(2)
        alert('Reset code sent! Check your console/logs for the code.')
      } else {
        alert('Reset failed')
      }
    } catch (error) {
      alert('Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode }),
      })
      
      if (response.ok) {
        setStep(3)
      } else {
        alert('Invalid reset code')
      }
    } catch (error) {
      alert('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      })
      
      if (response.ok) {
        alert('Password reset successful! You can now login.')
        window.location.href = '/login'
      } else {
        alert('Password reset failed')
      }
    } catch (error) {
      alert('Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">🔑 Reset Sunny Password</h1>
        
        {step === 1 && (
          <form onSubmit={handleRequestReset}>
            <p className="text-gray-600 mb-4">Enter your admin email to receive a reset code</p>
            <input
              type="email"
              placeholder="Admin Email"
              className="w-full p-3 border rounded mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <p className="text-center mt-4">
              <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <p className="text-gray-600 mb-4">Enter the reset code from your logs/console</p>
            <input
              type="text"
              placeholder="Reset Code"
              className="w-full p-3 border rounded mb-4"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p className="text-gray-600 mb-4">Enter your new password</p>
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-3 border rounded mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}