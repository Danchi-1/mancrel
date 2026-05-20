import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { apiClient } from '@/lib/apiClient'
import { Logo } from '@/components/Logo'

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
      const data = await apiClient.post('/auth/signup', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        business_name: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        industry_sector: formData.industrySector,
        business_type: formData.businessType,
        password: formData.password,
        marketing_consent: formData.marketingConsent,
        terms_accepted: formData.termsAccepted,
      }, false);
      
      setMessage({ type: 'success', text: 'Account created! Please sign in.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sign up failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-bg py-12 px-4">
      <div className="max-w-lg w-full p-8 bg-white rounded-xl shadow-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold mb-4 text-center">Create an account</h1>
        <p className="text-sm text-neutral-600 mb-6 text-center">Start your free trial — no credit card required.</p>

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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => alert("Google login requires OAuth credentials. Let's set that up next.")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
