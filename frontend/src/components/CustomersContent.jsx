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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter customers by search query
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const currentCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // If a customer is selected, show the details view
  if (selectedCustomerId) {
    return <CustomerDetailsContent customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />
  }
  
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="bg-white rounded-lg border w-full overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 border-b">
          <div className="relative w-full md:max-w-xs md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for customers"
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
            <Button variant="outline" className="gap-2 bg-transparent flex-1 md:flex-none">
              Default <ChevronDown className="w-4 h-4" />
            </Button>

            <div className="flex border rounded-lg overflow-hidden flex-1 md:flex-none">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex-1 md:flex-none justify-center px-3 py-2 flex items-center gap-2 text-sm ${
                  viewMode === "cards" ? "bg-gray-100" : "bg-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 md:flex-none justify-center px-3 py-2 flex items-center gap-2 text-sm border-l ${
                  viewMode === "list" ? "bg-[#4F46E5] text-white" : "bg-white"
                }`}
              >
                <List className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] gap-2 flex-1 md:flex-none">
              <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">WhatsApp No.</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-gray-500">No customers found</td>
                </tr>
              ) : currentCustomers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-blue-600">{customer.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-gray-900 font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{customer.phone || customer.email}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedCustomerId(customer.id)} className="text-[#4F46E5] font-medium text-sm hover:underline">
                        View
                      </button>
                      <button className="text-gray-500 text-sm hover:text-gray-700 font-medium">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t">
          <span className="text-sm text-gray-500 text-center sm:text-left">
            Page {currentPage} of {totalPages} - Showing {filteredCustomers.length} customers ({itemsPerPage} per page)
          </span>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}