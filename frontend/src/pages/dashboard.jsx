import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Sidebar } from "@/components/Sidebar"
import { Menu, LogOut } from "@/components/Icons"

import { EscalationsContent } from "@/components/EscalationsContent"
import { CustomersContent } from "@/components/CustomersContent"
import DealsKanban from "@/components/DealsKaban"
import OrdersKanban from "@/components/OrdersKanban"
import AIInbox from "@/components/AIInbox"
import WhatsAppConnect from "@/components/WhatsAppConnect"
import { ProfileContent } from "@/components/ProfileContent"
import { IntegrationsContent } from "@/components/IntegrationsContent"
import { CatalogueContent } from "@/components/CatalogueContent"
import KnowledgeBase from "@/components/KnowledgeBase"
import { CampaignsContent } from "@/components/CampaignsContent"
import { StatusLinksGuide } from "@/components/StatusLinksGuide"
import { apiClient } from "@/lib/apiClient"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ total_contacts: 0, active_deals: 0, ai_interactions: 0 })

  useEffect(() => {
    async function fetchUserAndStats() {
      try {
        const userData = await apiClient.get('/auth/me');
        
        // Redirect to onboarding if they haven't completed their profile
        if (!userData.phone) {
          router.push('/onboarding');
          return;
        }

        setUser({
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          business_name: userData.business_name,
          industry_sector: userData.industry_sector,
          business_type: userData.business_type,
          phone: userData.phone,
          whatsapp_connected: userData.whatsapp_connected,
          twilio_phone_number: userData.twilio_phone_number,
          payment_details: userData.payment_details
        });
        setIsAuthenticated(true);
        
        try {
          const statsData = await apiClient.get('/customers/stats');
          setStats(statsData);
        } catch (e) {
          console.error("Failed to fetch stats", e);
        }

      } catch (error) {
        console.error('Not authenticated', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndStats();
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
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/50 z-30 transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`z-40 ${sidebarOpen ? 'absolute md:relative' : 'absolute md:relative'} h-full`}>
        <Sidebar isOpen={sidebarOpen} activeView={activeView} setActiveView={setActiveView} handleLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md p-1.5 shadow-sm hidden md:block"
            title={sidebarOpen ? "Retract Sidebar" : "Expand Sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-500 hover:text-gray-700 md:hidden p-2"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
            <button 
              onClick={() => setActiveView("profile")}
              className="w-8 h-8 bg-[#4F46E5] text-white rounded-full flex items-center justify-center font-bold hover:ring-2 hover:ring-indigo-300 transition-all focus:outline-none"
              title="View Profile"
            >
              {user.name.charAt(0)}
            </button>
          </div>
        </header>
        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 flex flex-col relative">
          {!user.whatsapp_connected && activeView !== "integrations" && (
            <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <p className="text-amber-800 text-sm font-medium">Your AI assistant is offline. Connect WhatsApp to start receiving messages.</p>
              </div>
              <button 
                onClick={() => setActiveView("integrations")}
                className="text-sm font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-1.5 rounded-lg transition-colors"
              >
                Connect Now
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto relative">
              {activeView === "dashboard" && (
              <div className="max-w-7xl mx-auto p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Contacts</h3>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_contacts}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Active Deals</h3>
                      <p className="text-3xl font-bold text-gray-900">{stats.active_deals}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">AI Interactions</h3>
                      <p className="text-3xl font-bold text-gray-900">{stats.ai_interactions}</p>
                    </div>
                  </div>
                </div>
              )}
              {activeView === "inbox" && <AIInbox isDashboard={true} />}
              {activeView === "deals" && <DealsKanban />}
              {activeView === "orders" && <OrdersKanban />}
              {activeView === "escalations" && <EscalationsContent />}
              {activeView === "customers" && <CustomersContent />}
              {activeView === "profile" && <ProfileContent user={user} />}
              {activeView === "catalogue" && <CatalogueContent user={user} />}
              {activeView === "knowledge" && <KnowledgeBase user={user} />}
              {activeView === "campaigns" && <CampaignsContent user={user} />}
              {activeView === "status_links" && <StatusLinksGuide user={user} />}
              {activeView === "integrations" && <IntegrationsContent user={user} setUser={setUser} />}
          </div>
        </main>
      </div>
    </div>
  )
}
