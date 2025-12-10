"use client"

import { useState } from 'react'
import Link from 'next/link'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        setMessage({ type: 'error', text: err.error || 'Sign up failed' })
      } else {
        const data = await res.json().catch(() => ({}))
        setMessage({ type: 'success', text: data.message || 'Account created. Check your email.' })
      }
    } catch (err) {
      // If backend isn't available, show a mock success so user can continue
      setMessage({ type: 'success', text: 'Account created (mock). No backend detected.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-bg">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-display font-bold mb-4">Create an account</h1>
        <p className="text-sm text-neutral-600 mb-6">Start your free trial — no credit card required.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field w-full"
              placeholder="Your name"
            />
          </div>

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
              placeholder="Create a password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/signin" className="text-neutral-600">Already have an account?</Link>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
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
