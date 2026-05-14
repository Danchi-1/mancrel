import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Sidebar } from "@/components/Sidebar"
import { Menu, LogOut } from "@/components/Icons"

import { EscalationsContent } from "@/components/EscalationsContent"
import { CustomersContent } from "@/components/CustomersContent"
import DealsKanban from "@/components/DealsKaban"
import AIInbox from "@/components/AIInbox"
import WhatsAppConnect from "@/components/WhatsAppConnect"
import { apiClient } from "@/lib/apiClient"

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await apiClient.get('/auth/me');
        setUser({
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          whatsapp_connected: userData.whatsapp_connected
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Not authenticated', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  async function handleLogout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse font-medium">Loading Dashboard...</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <div className="w-8 h-8 bg-[#4F46E5] text-white rounded-full flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>
        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {!user.whatsapp_connected ? (
            <WhatsAppConnect onConnect={async () => {
              try {
                await apiClient.patch('/auth/whatsapp/connect');
                setUser({ ...user, whatsapp_connected: true });
              } catch (e) {
                console.error(e);
              }
            }} />
          ) : (
            <>
              {activeView === "dashboard" && (
                <div className="max-w-7xl mx-auto p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Contacts</h3>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Active Deals</h3>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">AI Interactions</h3>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
              )}
              {activeView === "inbox" && <AIInbox />}
              {activeView === "deals" && <DealsKanban />}
              {activeView === "escalations" && <EscalationsContent />}
              {activeView === "customers" && <CustomersContent />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
