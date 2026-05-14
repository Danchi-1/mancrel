import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiClient } from '@/lib/apiClient'

import { Logo } from '@/components/Logo'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

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
      </div>
    </div>
  )
}
