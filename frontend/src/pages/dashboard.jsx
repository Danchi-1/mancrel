import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Sidebar } from "@/components/Sidebar"
import { Menu, LogOut } from "@/components/Icons"

import { EscalationsContent } from "@/components/EscalationsContent"
import { CustomersContent } from "@/components/CustomersContent"

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  // Mock auth state for UI development
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState({name: "Dev User", email: "dev@example.com"})

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear auth and redirect
      setIsAuthenticated(false)
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} activeView={activeView} setActiveView={setActiveView} handleLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeView === "dashboard" && (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

              {/* Welcome Card */}
              <div className="bg-white rounded-lg border p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
                <p className="text-gray-600">This is your protected dashboard. Only authenticated users can access this page.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deals</h3>
                  <p className="text-3xl font-bold text-gray-900">$2.4M</p>
                  <p className="text-xs text-gray-500 mt-2">+12% from last month</p>
                </div>
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Active Customers</h3>
                  <p className="text-3xl font-bold text-gray-900">324</p>
                  <p className="text-xs text-gray-500 mt-2">+8 new this week</p>
                </div>
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Escalations</h3>
                  <p className="text-3xl font-bold text-gray-900">12</p>
                  <p className="text-xs text-gray-500 mt-2">2 pending review</p>
                </div>
              </div>

              {/* Placeholder for more content */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <p className="text-gray-600">Add your dashboard content here. This is a protected page that requires authentication.</p>
              </div>
            </div>
          )}
          {activeView === "escalations" && <EscalationsContent />}
          {activeView === "customers" && <CustomersContent />}
        </main>
      </div>
    </div>
  )
}
