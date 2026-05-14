"use client"

import { MessageSquare, Phone, ArrowRight, CheckCircle2 } from "lucide-react"

export default function WhatsAppConnect({ onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-[#4F46E5]/10 rounded-full flex items-center justify-center mb-8 relative">
        <MessageSquare className="w-12 h-12 text-[#4F46E5]" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-gray-50 flex items-center justify-center">
          <Phone className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">
        Connect Your WhatsApp
      </h2>
      <p className="text-lg text-gray-600 mb-10 leading-relaxed">
        Your CRM is ready, but to unleash the full power of Mancrel AI, you need to connect your WhatsApp Business account. This enables real-time message syncing, automatic AI replies, and intelligent escalations.
      </p>

      <div className="w-full bg-white rounded-2xl border p-8 shadow-sm text-left mb-10">
        <h3 className="font-semibold text-gray-900 mb-6 text-lg">What happens when you connect?</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">AI-Powered Inbox</p>
              <p className="text-sm text-gray-500">Incoming messages are instantly analyzed for sentiment and intent.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Automated Pipeline</p>
              <p className="text-sm text-gray-500">Sales inquiries automatically create deals in your Kanban board.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Smart Escalations</p>
              <p className="text-sm text-gray-500">Complex issues bypass the AI and go straight to human agents.</p>
            </div>
          </li>
        </ul>
      </div>

      <button 
        onClick={onConnect}
        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20 transition-all hover:scale-105"
      >
        Connect WhatsApp Now
        <ArrowRight className="w-5 h-5" />
      </button>
      
      <p className="text-sm text-gray-400 mt-6">
        Powered by official WhatsApp Business API
      </p>
    </div>
  )
}
