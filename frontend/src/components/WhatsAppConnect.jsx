"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Phone, ArrowRight, CheckCircle2, Copy, ExternalLink, ShieldCheck } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

export default function WhatsAppConnect({ onConnect }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    account_sid: "",
    auth_token: "",
    phone_number: ""
  })
  const [webhookUrl, setWebhookUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Fetch user info to get user_id for the webhook
    async function fetchUser() {
      try {
        const userData = await apiClient.get('/auth/me')
        setUser(userData)
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

  const handleSaveCredentials = async () => {
    if (!formData.account_sid || !formData.auth_token || !formData.phone_number) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      await apiClient.patch('/auth/twilio/connect', formData)
      
      // Generate Webhook URL
      const host = window.location.hostname === 'localhost' 
        ? 'https://mancrel-api.onrender.com' // Fallback for local testing
        : 'https://mancrel.onrender.com'     // Production API
      
      setWebhookUrl(`${host}/api/v1/messaging/twilio-webhook/${user?.id}`)
      setStep(3)
    } catch (err) {
      setError(err.message || "Failed to save credentials")
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-2xl mx-auto">
      
      {/* STEP 1: Introduction */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 bg-[#4F46E5]/10 rounded-full flex items-center justify-center mb-8 mx-auto relative">
            <MessageSquare className="w-12 h-12 text-[#4F46E5]" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-gray-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">
            Connect Your WhatsApp
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            To power your AI assistant for free, Mancrel securely connects directly to your Twilio Sandbox account.
          </p>

          <div className="w-full bg-white rounded-2xl border p-8 shadow-sm text-left mb-10">
            <h3 className="font-semibold text-gray-900 mb-6 text-lg">How it works</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <p className="font-medium text-gray-900">Create a Free Twilio Account</p>
                  <p className="text-sm text-gray-500">Sign up at twilio.com and navigate to the WhatsApp Sandbox.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <p className="font-medium text-gray-900">Copy your API Keys</p>
                  <p className="text-sm text-gray-500">Find your Account SID and Auth Token on your Twilio console.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <p className="font-medium text-gray-900">Paste & Connect</p>
                  <p className="text-sm text-gray-500">Provide the keys here, and Mancrel handles the rest.</p>
                </div>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => setStep(2)}
            className="mx-auto bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20 transition-all hover:scale-105"
          >
            I'm Ready, Let's Connect
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 2: Enter Credentials */}
      {step === 2 && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500 text-left">
          <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1">
            ← Back
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Twilio Keys</h2>
          <p className="text-gray-600 mb-8">
            You can find these on the homepage of your Twilio Console.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
              <input 
                type="text"
                name="account_sid"
                value={formData.account_sid}
                onChange={handleChange}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
              <input 
                type="password"
                name="auth_token"
                value={formData.auth_token}
                onChange={handleChange}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twilio WhatsApp Number</label>
              <p className="text-xs text-gray-500 mb-2">Must start with 'whatsapp:'</p>
              <input 
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="whatsapp:+14155238886"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none"
              />
            </div>

            <button 
              onClick={handleSaveCredentials}
              disabled={loading}
              className="w-full mt-6 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Credentials"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Your keys are encrypted and stored securely.
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Webhook */}
      {step === 3 && (
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost Done!</h2>
          <p className="text-gray-600 mb-8">
            Your credentials are saved. Now, tell Twilio to send incoming messages to your new Mancrel AI bot.
          </p>

          <div className="bg-white rounded-2xl border p-6 text-left shadow-sm mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">1. Copy your Webhook URL</h3>
            <div className="flex items-center gap-2 mt-3 mb-6">
              <input 
                type="text" 
                readOnly 
                value={webhookUrl}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm font-mono"
              />
              <button 
                onClick={copyToClipboard}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors shrink-0 flex items-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
              </button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">2. Paste it in Twilio</h3>
            <p className="text-sm text-gray-600 mb-3">
              Go to your Twilio WhatsApp Sandbox settings and paste this URL into the <strong>"WHEN A MESSAGE COMES IN"</strong> field. Make sure the dropdown says <strong>HTTP POST</strong>.
            </p>
            <a 
              href="https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox" 
              target="_blank"
              rel="noreferrer"
              className="text-[#4F46E5] text-sm font-medium hover:underline flex items-center gap-1"
            >
              Open Twilio Sandbox Settings <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button 
            onClick={onConnect}
            className="mx-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all"
          >
            I've Added the Webhook
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      )}
      
    </div>
  )
}
