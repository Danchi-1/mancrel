"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, CheckCircle2 } from "lucide-react"

export function WelcomeSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#4F46E5]">Welcome back, Bella</h2>
        <p className="text-sm text-gray-500">Here&apos;s how your performance looks like</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Credit Balance Card */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400">Credit Balance</p>
              <p className="text-2xl font-bold text-white">
                14,404 <span className="text-xs font-normal text-gray-400">Total</span>
              </p>
            </div>
            <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs">
              Grow Plan
            </Button>
          </div>
          <div className="h-20 bg-gradient-to-r from-gray-800 to-gray-700">
            <svg viewBox="0 0 400 80" className="w-full h-full">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 70, 229, 0.3)" />
                  <stop offset="100%" stopColor="rgba(79, 70, 229, 0)" />
                </linearGradient>
              </defs>
              <path d="M0 60 Q50 40 100 50 T200 30 T300 45 T400 20 V80 H0 Z" fill="url(#areaGradient)" />
              <path d="M0 60 Q50 40 100 50 T200 30 T300 45 T400 20" fill="none" stroke="#4F46E5" strokeWidth="2" />
            </svg>
          </div>
        </Card>

        {/* Roadmap Card */}
        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Shape Our Roadmap</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Vote on features, join product calls, and get early beta access to shape our roadmap together.
            </p>
            <button className="flex items-center gap-1 text-[#4F46E5] font-medium text-sm hover:underline">
              <ArrowUpRight className="w-4 h-4" />
              Give Feedback
            </button>
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#4F46E5]" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
