import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiClient } from '@/lib/apiClient'
import { Logo } from '@/components/Logo'

export default function OnboardingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    business_name: '',
    industry_sector: '',
    business_type: '',
    payment_details: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [hasExistingPhone, setHasExistingPhone] = useState(false)

  useEffect(() => {
    // Try to pre-fill from auth/me
    async function fetchUser() {
      try {
        const user = await apiClient.get('/auth/me')
        if (user.phone) {
          setHasExistingPhone(true)
        }
        setFormData(prev => ({
          ...prev,
          business_name: user.business_name?.endsWith("'s Business") ? '' : (user.business_name || ''),
          industry_sector: user.industry_sector === 'Other' ? '' : (user.industry_sector || ''),
          business_type: user.business_type === 'Startup' ? '' : (user.business_type || ''),
          payment_details: user.payment_details || '',
          phone: user.phone || '',
        }))
      } catch (err) {
        // Not logged in, redirect to sign in
        router.push('/signin')
      }
    }
    fetchUser()
  }, [router])

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
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await apiClient.patch('/auth/me', formData)
      router.push('/dashboard')
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900">
          Complete your profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about your business to get started.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {message && (
            <div className={`mb-4 p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <div className="mt-1">
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={hasExistingPhone}
                  className={`input-field ${hasExistingPhone ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  placeholder="+1 (555) 000-0000"
                />
                {hasExistingPhone && (
                  <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed to protect your WhatsApp connection.</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="industry_sector" className="block text-sm font-medium text-gray-700">
                Industry Sector
              </label>
              <div className="mt-1">
                <select
                  id="industry_sector"
                  name="industry_sector"
                  required
                  value={formData.industry_sector}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select industry</option>
                  {industrySectorOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
                Business Type
              </label>
              <div className="mt-1">
                <select
                  id="business_type"
                  name="business_type"
                  required
                  value={formData.business_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select business type</option>
                  {businessTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="payment_details" className="block text-sm font-medium text-gray-700">
                Payment Details (Bank Account for Customers)
              </label>
              <div className="mt-1">
                <textarea
                  id="payment_details"
                  name="payment_details"
                  rows={3}
                  value={formData.payment_details}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Bank: Zenith Bank, Acct Name: Acme Corp, Acct No: 1234567890"
                />
                <p className="mt-1 text-xs text-gray-500">The AI will share this with customers who are ready to pay.</p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
