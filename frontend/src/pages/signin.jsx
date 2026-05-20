import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiClient } from '@/lib/apiClient'

import { Logo } from '@/components/Logo'
import { GoogleLogin } from '@react-oauth/google'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true)
    setMessage(null)
    try {
      const data = await apiClient.post('/auth/google', { credential: credentialResponse.credential }, false)
      localStorage.setItem('token', data.access_token)
      setMessage({ type: 'success', text: 'Signed in with Google successfully' })
      router.push('/dashboard')
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Google sign in failed' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const data = await apiClient.post('/auth/signin', { email, password }, false);
      localStorage.setItem('token', data.access_token);
      setMessage({ type: 'success', text: 'Signed in successfully' })
      router.push('/dashboard')
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sign in failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-bg">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold mb-4 text-center">Sign In</h1>
        <p className="text-sm text-neutral-600 mb-6 text-center">Welcome back — sign in to your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field w-full"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/signup" className="text-accent font-medium">Create account</Link>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage({ type: 'error', text: 'Google Login Failed' })}
              size="large"
              width="300"
              theme="outline"
              text="continue_with"
              shape="rectangular"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
