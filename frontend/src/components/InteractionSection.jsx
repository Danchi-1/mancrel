"use client"

import { Card } from "@/components/ui/card"
import { MessageCircle, Mail, Phone, ExternalLink } from "lucide-react"

const interactions = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: 648,
    change: "+0% vs yesterday",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: Mail,
    label: "Email",
    value: 94,
    change: "+0% vs yesterday",
    color: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },
  {
    icon: Phone,
    label: "Phone call",
    value: 16,
    change: "+12.57% vs yesterday",
    color: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },
]

export function InteractionSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-800">Active Interaction</h3>
        <button className="text-xs text-[#4F46E5] hover:underline">+ Add channel</button>
      </div>
      <div className="flex flex-wrap gap-4">
        {interactions.map((item) => (
          <Card key={item.label} className="p-4 flex items-center gap-4 min-w-[180px]">
            <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{item.label}</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
              <p className="text-xs text-green-500">{item.change}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
