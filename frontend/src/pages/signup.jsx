import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    industrySector: '',
    businessType: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
    termsAccepted: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const businessTypeOptions = ['B2C', 'B2B2C', 'Startup']
  const industrySectorOptions = [
    'Technology',
    'Finance',
    'Healthcare',
    'Retail',
    'Manufacturing',
    'Education',
    'Real Estate',
    'Hospitality',
    'Other',
  ]

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    // Validate terms accepted
    if (!formData.termsAccepted) {
      setMessage({ type: 'error', text: 'You must accept the terms and conditions' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          industrySector: formData.industrySector,
          businessType: formData.businessType,
          password: formData.password,
          marketingConsent: formData.marketingConsent,
          termsAccepted: formData.termsAccepted,
        }),
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-bg py-12 px-4">
      <div className="max-w-lg w-full p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-display font-bold mb-4">Create an account</h1>
        <p className="text-sm text-neutral-600 mb-6">Start your free trial — no credit card required.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">First name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field w-full"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Last name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input-field w-full"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Business name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Your business name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Industry Sector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Industry sector</label>
            <select
              name="industrySector"
              value={formData.industrySector}
              onChange={handleChange}
              required
              className="input-field w-full"
            >
              <option value="">Select an industry</option>
              {industrySectorOptions.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Business type</label>
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              required
              className="input-field w-full"
            >
              <option value="">Select business type</option>
              {businessTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Create a password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Confirm your password"
            />
          </div>

          {/* Marketing Consent */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="marketingConsent"
              id="marketingConsent"
              checked={formData.marketingConsent}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="marketingConsent" className="text-sm text-neutral-600">
              Send me updates and marketing emails
            </label>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              name="termsAccepted"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
              className="rounded mt-1"
            />
            <label htmlFor="termsAccepted" className="text-sm text-neutral-600">
              I agree to the{' '}
              <a href="#" className="text-accent hover:underline">
                terms and conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-accent hover:underline">
                privacy policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm">
              <Link href="/signin" className="text-neutral-600">
                Already have an account?
              </Link>
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
