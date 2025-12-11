"use client"

import { useState } from "react"
import { ArrowLeft, EyeOff, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sample customer data
const customerInfo = {
  1: { name: "Frank Omah", whatsapp: "+2349068944845" },
  2: { name: "Aimuan Godwin", whatsapp: "+2348064384227" },
  3: { name: "Dorothy Bassey", whatsapp: "+2348033234243" },
  4: { name: "Unknown Customer", whatsapp: "Undefined" },
  5: { name: "Emmanuel Ademola", whatsapp: "+2348142151880" },
}

// Sample products data
const productsData = [
  { id: 1, product: "Premium Subscription Plan", date: "02/12/2025", status: "paid" },
  { id: 2, product: "Enterprise Software License", date: "28/11/2025", status: "deal_closed_not_paid" },
  { id: 3, product: "Consulting Services Package", date: "25/11/2025", status: "still_contemplating" },
  { id: 4, product: "Hardware Bundle", date: "20/11/2025", status: "not_active" },
  { id: 5, product: "Annual Support Contract", date: "15/11/2025", status: "paid" },
]

// Sample escalations for this customer
const customerEscalations = [
  {
    id: 1,
    issueType: "User made a payment of 10,000 nai...",
    channel: "email",
    assignedTo: "Jennifer Ifemedebe",
    status: "Resolved",
    date: "02/12/2025 06:44 PM",
  },
  {
    id: 2,
    issueType: "Prepaid meter recharge issue after ...",
    channel: "email",
    assignedTo: "Jennifer Ifemedebe",
    status: "Resolved",
    date: "02/12/2025 07:21 PM",
  },
  {
    id: 3,
    issueType: "User requested to speak to a huma...",
    channel: "api",
    assignedTo: "Jennifer Ifemedebe",
    status: "Open",
    date: "17/11/2025 03:23 PM",
  },
]

const statusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  deal_closed_not_paid: { label: "Deal Closed (Not Paid)", color: "bg-blue-100 text-blue-700" },
  still_contemplating: { label: "Still Contemplating", color: "bg-yellow-100 text-yellow-700" },
  not_active: { label: "Not Active", color: "bg-gray-100 text-gray-600" },
}

const channelColors = {
  email: "bg-purple-100 text-purple-700",
  api: "bg-blue-100 text-blue-700",
  phone: "bg-green-100 text-green-700",
}

export function CustomerDetailsContent({ customerId, onBack }) {
  const [activeTab, setActiveTab] = useState("products")
  const [showBasicInfo, setShowBasicInfo] = useState(true)

  const customer = customerInfo[customerId] || { name: "Unknown", whatsapp: "N/A" }

  return (
    <div className="p-6">
      {/* Back Navigation and Actions */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Customers</span>
        </button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[#4F46E5] bg-transparent"
            onClick={() => setShowBasicInfo(!showBasicInfo)}
          >
            <EyeOff className="w-4 h-4" />
            {showBasicInfo ? "Hide" : "Show"} Basic Info
          </Button>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Basic Info Card */}
      {showBasicInfo && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Basic Info</h2>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Pencil className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#4F46E5] font-medium mb-1">Name</p>
              <p className="text-sm text-gray-600">{customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-[#4F46E5] font-medium mb-1">WhatsApp Number</p>
              <p className="text-sm text-gray-600">{customer.whatsapp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "products"
                  ? "border-[#4F46E5] text-[#4F46E5]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("escalations")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "escalations"
                  ? "border-[#4F46E5] text-[#4F46E5]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Escalations
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "products" && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-[#4F46E5]">{product.product}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{product.date}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[product.status].color}`}
                          >
                            {statusConfig[product.status].label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-[#4F46E5] text-sm hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "escalations" && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Escalations for {customer.name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Issue Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Channel</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Assigned to</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#4F46E5]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerEscalations.map((escalation) => (
                      <tr key={escalation.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-[#4F46E5]">{escalation.issueType}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${channelColors[escalation.channel]}`}
                          >
                            {escalation.channel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{escalation.assignedTo}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              escalation.status === "Resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {escalation.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">{escalation.date}</td>
                        <td className="py-4 px-4">
                          <button className="text-[#4F46E5] text-sm hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}