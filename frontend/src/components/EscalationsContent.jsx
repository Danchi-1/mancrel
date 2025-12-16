"use client"

import { useState } from "react"
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
const escalationData = [
  {
    id: 1,
    customer: "Dr. B. A. Oyeneyin",
    issueType: "User made a payment of 10,000 nai...",
    channel: "email",
    assignedTo: "Jennifer Ifemedebe",
    status: "Resolved",
    date: "02/12/2025 06:44 PM",
  },
  {
    id: 2,
    customer: "Dr. B. A. Oyeneyin",
    issueType: "Prepaid meter recharge issue after ...",
    channel: "email",
    assignedTo:.
    "Jennifer Ifemedebe",
    status: "Resolved",
    date: "02/12/2025 07:21 PM",
  },
  {
    id: 3,
    customer: "Ugochukwu Okeke",
    issueType: "Wallet funded with 30,000 (transact...",
    channel: "api",
    assignedTo: "Abigail Oluwagbemiro",
    status: "Resolved",
    date: "02/12/2025 08:51 AM",
  },
  {
    id: 4,
    customer: "Uche Obed",
    issueType: "User requested to speak to a huma...",
    channel: "api",
    assignedTo: "Jennifer Ifemedebe",
    status: "Resolved",
    date: "17/11/2025 03:23 PM",
  },
  {
    id: 5,
    customer: "Petraxs Limited",
    issueType: "Direct pricing comparison and quot...",
    channel: "api",
    assignedTo: "Jennifer Ifemedebe",
    status: "Resolved",
    date: "16/11/2025 12:08 PM",
  },
  {
    id: 6,
    customer: "Lawal Ikimot Tunmise",
    issueType: "User sent 20,000 NGN to their Lime...",
    channel: "email",
    assignedTo: "Jennifer Ifemedebe",
    status: "Open",
    date: "30/11/2025 09:17 PM",
  },
  {
    id: 7,
    customer: "Lawal Ikimot Tunmise",
    issueType: "Wallet funding not reflecting, need...",
    channel: "email",
    assignedTo: "Jennifer Ifemedebe",
    status: "Open",
    date: "30/11/2025 09:17 PM",
  },
  {
    id: 8,
    customer: "Jacob",
    issueType: "Customer Jacob purchased an elect...",
    channel: "phone",
    assignedTo: "Jennifer Ifemedebe",
    status: "Open",
    date: "28/11/2025 09:44 AM",
  },
  {
    id: 9,
    customer: "Mavhetha",
    issueType: "User wants to be connected with th...",
    channel: "api",
    assignedTo: "Limestone",
    status: "Open",
    date: "26/11/2025 04:47 PM",
  },
]

const ChannelBadge = ({ channel }) => {
  const styles = {
    email: "bg-blue-100 text-blue-600",
    api: "bg-purple-100 text-purple-600",
    phone: "bg-indigo-100 text-indigo-600",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[channel] || "bg-gray-100 text-gray-600"}`}>
      {channel}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const styles = {
    Resolved: "bg-green-100 text-green-600 border border-green-200",
    Open: "bg-yellow-100 text-yellow-600 border border-yellow-200",
  }

  return (
    <span className={`px-3 py-1 rounded text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

export function EscalationsContent() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredData = escalationData.filter((item) => item.customer.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-6">
      <div className="border-b mb-6">
        <div className="flex gap-8">
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors border-[#4F46E5] text-gray-900`}
          >
            Escalated Issues
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Escalated Issues</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by customer name"
                className="pl-9 w-64 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Issue Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Channel</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assigned to</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-sm text-[#4F46E5] font-medium">{item.customer}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-[#4F46E5]">{item.issueType}</span>
                  </td>
                  <td className="py-4 px-4">
                    <ChannelBadge channel={item.channel} />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">{item.assignedTo}</span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-sm text-[#4F46E5] hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}