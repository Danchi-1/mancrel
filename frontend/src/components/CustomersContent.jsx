"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, LayoutGrid, List, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerDetailsContent } from "@/components/CustomerDetailsContent"
import { apiClient } from "@/lib/apiClient"

export function CustomersContent() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await apiClient.get('/customers');
        setCustomers(data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [])

  // If a customer is selected, show the details view
  if (selectedCustomerId) {
    return <CustomerDetailsContent customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />
  }
  
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border">
        {/* Toolbar */}
        <div className="p-4 flex items-center gap-4 border-b">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for customers"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="outline" className="gap-2 bg-transparent">
            Default <ChevronDown className="w-4 h-4" />
          </Button>

          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 flex items-center gap-2 text-sm ${
                viewMode === "cards" ? "bg-gray-100" : "bg-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 flex items-center gap-2 text-sm border-l ${
                viewMode === "list" ? "bg-[#4F46E5] text-white" : "bg-white"
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>

          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] gap-2 ml-auto">
            <UserPlus className="w-4 h-4" /> Create
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">WhatsApp No.</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No customers found</td>
                </tr>
              ) : customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-blue-600`}>{customer.name.charAt(0).toUpperCase()}</span>
                      <span className="text-[#4F46E5] text-sm">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{customer.phone || customer.email}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedCustomerId(customer.id)} className="text-[#4F46E5] text-sm hover:underline">
                        View
                      </button>
                      <button className="text-[#4F46E5] text-sm hover:underline">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t">
          <span className="text-sm text-gray-500">Page 1 of 2009 - Showing 10043 customers (5 per page)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}