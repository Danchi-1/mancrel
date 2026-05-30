"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Phone, ArrowRight, CheckCircle2, Copy, ExternalLink, ShieldCheck, ArrowDown, Image as ImageIcon } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

export default function WhatsAppConnect({ onConnect }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    account_sid: "",
    auth_token: "",
    phone_number: "",
    personal_phone: ""
  })
  const [otpCode, setOtpCode] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await apiClient.get('/auth/me')
        setUser(userData)
        if (userData.phone) {
          setFormData(prev => ({ ...prev, personal_phone: userData.phone }))
        }
      } catch (e) {
        console.error("Failed to fetch user")
      }
    }
    fetchUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSendOtp = async () => {
    if (!formData.account_sid || !formData.auth_token || !formData.phone_number || !formData.personal_phone) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      await apiClient.post('/auth/twilio/send-otp', formData)
      setStep(3) // Move to OTP step
    } catch (err) {
      setError(err.message || "Failed to send verification code. Are your keys correct?")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    setLoading(true)
    setError("")
    try {
      const updatedUser = await apiClient.post('/auth/twilio/verify-otp', {
        ...formData,
        code: otpCode
      })
      
      const host = window.location.hostname === 'localhost' 
        ? 'https://mancrel.onrender.com' 
        : 'https://mancrel.onrender.com'
      
      setWebhookUrl(`${host}/api/v1/messaging/twilio-webhook/${updatedUser.id}`)
      setStep(4) // Move to Webhook step
    } catch (err) {
      setError(err.message || "Invalid verification code")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-5xl mx-auto h-[800px] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col relative">
      
      {/* Top Header / Progress Indicator */}
      <div className="flex-none p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4F46E5]/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Twilio Connection</h2>
            <p className="text-xs text-gray-500">Step {step} of 4</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`w-12 h-1.5 rounded-full transition-colors duration-500 ${step >= i ? 'bg-[#4F46E5]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Vertical Carousel Track */}
      <div className="flex-1 relative overflow-hidden bg-gray-50/30">
        <div 
          className="absolute inset-0 flex flex-col transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${(step - 1) * 100}%)` }}
        >
          
          {/* STEP 1: Introduction */}
          <div className="h-full w-full flex-none flex flex-col md:flex-row items-center justify-center p-8 gap-12">
            <div className="flex-1 max-w-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connect Your WhatsApp
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We use the Twilio Sandbox to securely power your AI assistant for free. Follow these simple steps.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center font-bold shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-gray-900">Create a Free Account & Join Sandbox</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Go to <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline inline-flex items-center gap-1">twilio.com <ExternalLink className="w-3 h-3"/></a> and sign up. Then, follow their instructions to <b>send the Sandbox join code</b> from your personal WhatsApp.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold shrink-0">2</span>
                  <p className="font-semibold text-gray-400">Copy your API Keys</p>
                </div>
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold shrink-0">3</span>
                  <p className="font-semibold text-gray-400">Configure Webhook</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20 transition-all hover:translate-y-1"
              >
                I have a Twilio Account
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
            
            {/* Visual Screenshot Placeholder */}
            <div className="flex-1 w-full max-w-md aspect-video md:aspect-[4/3] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative group">
              {/* Replace the img src below with your actual screenshot from the public folder later */}
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium">Twilio Dashboard Screenshot</p>
                <p className="text-xs mt-1">(Replace with /images/twilio/step1.png)</p>
              </div>
            </div>
          </div>


          {/* STEP 2: Enter Credentials */}
          <div className="h-full w-full flex-none flex flex-col md:flex-row items-center justify-center p-8 gap-12">
            <div className="flex-1 max-w-md">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1 transition-colors">
                ↑ Back
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter your Twilio Keys</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Find your Account SID and Auth Token on the homepage of your Twilio Console.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Account SID</label>
                  <input 
                    type="text"
                    name="account_sid"
                    value={formData.account_sid}
                    onChange={handleChange}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Auth Token</label>
                  <input 
                    type="password"
                    name="auth_token"
                    value={formData.auth_token}
                    onChange={handleChange}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Twilio WhatsApp Number</label>
                  <input 
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="whatsapp:+14155238886"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Your Personal Phone Number</label>
                  <input 
                    type="text"
                    name="personal_phone"
                    value={formData.personal_phone}
                    onChange={handleChange}
                    placeholder="whatsapp:+1234567890"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">We will send the verification code here.</p>
                </div>

                <button 
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full mt-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Send Verification Code"}
                  {!loading && <ArrowDown className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  We will send an OTP to this number
                </div>
              </div>
            </div>

            {/* Visual Screenshot Placeholder */}
            <div className="flex-1 w-full max-w-md aspect-video md:aspect-[4/3] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium text-center px-4">Screenshot highlighting exactly where to find the SID & Token</p>
                <p className="text-xs mt-1">(Replace with /images/twilio/step2.png)</p>
              </div>
            </div>
          </div>


          {/* STEP 3: Verify OTP */}
          <div className="h-full w-full flex-none flex flex-col md:flex-row items-center justify-center p-8 gap-12">
            <div className="flex-1 max-w-md">
              <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1 transition-colors">
                ↑ Back
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your WhatsApp</h2>
              <p className="text-gray-600 mb-6 text-sm">
                We just sent a 6-digit verification code to your personal phone number. Please enter it below to confirm ownership.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">6-Digit Code</label>
                  <input 
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <button 
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Confirm & Save Credentials"}
                  {!loading && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Visual Screenshot Placeholder */}
            <div className="flex-1 w-full max-w-md aspect-video md:aspect-[4/3] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium text-center px-4">Illustration of checking phone for SMS/WhatsApp</p>
              </div>
            </div>
          </div>


          {/* STEP 4: Configure Webhook */}
          <div className="h-full w-full flex-none flex flex-col md:flex-row items-center justify-center p-8 gap-12">
            <div className="flex-1 max-w-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Step!</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Tell Twilio to route incoming WhatsApp messages to your new Mancrel AI bot.
              </p>

              <div className="bg-white rounded-2xl border p-5 shadow-sm mb-8 relative">
                <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                  Your Webhook URL
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={webhookUrl}
                    className="w-full px-2 py-2 bg-transparent text-gray-600 text-sm font-mono outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shrink-0 flex items-center gap-2"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-8 text-sm text-gray-600">
                <p>1. Go to your Twilio WhatsApp Sandbox settings.</p>
                <p>2. Paste this URL into the <strong>"WHEN A MESSAGE COMES IN"</strong> field.</p>
                <p>3. Ensure the HTTP method is set to <strong>POST</strong>.</p>
              </div>

              <button 
                onClick={onConnect}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all"
              >
                I've Added the Webhook
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Screenshot Placeholder */}
            <div className="flex-1 w-full max-w-md aspect-video md:aspect-[4/3] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium text-center px-4">Screenshot highlighting the 'When a message comes in' field</p>
                <p className="text-xs mt-1">(Replace with /images/twilio/step3.png)</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  )
}
