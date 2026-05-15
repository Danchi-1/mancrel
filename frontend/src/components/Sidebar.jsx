"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, AlertTriangle, Users, LogOut, Briefcase, Inbox } from "lucide-react"
import { Logo } from "./Logo"

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "inbox", icon: Inbox, label: "AI Inbox" },
  { id: "deals", icon: Briefcase, label: "Deals" },
  { id: "escalations", icon: AlertTriangle, label: "Escalation" },
  { id: "customers", icon: Users, label: "Customers" },
]

export function Sidebar({ isOpen, activeView, setActiveView, handleLogout }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleItemClick = (item) => {
    setActiveView(item.id)
  }

  const onLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    handleLogout();
  }

  return (
    <>
      <aside className={cn("bg-white border-r flex flex-col transition-all duration-300 overflow-hidden relative z-40", isOpen ? "w-56" : "w-0 md:w-16", "absolute md:relative h-full")}>
        <div className="h-16 border-b flex items-center px-4">
          {isOpen ? (
            <Logo />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="16" x2="4" y2="8" />
                <path d="M4 11a3 3 0 0 1 6 0v5" />
                <path d="M10 11a3 3 0 0 1 6 0v5" />
                <path d="M16 11a3 3 0 0 1 4 0" />
              </svg>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.id === activeView

            return (
              <div key={item.label}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? "bg-indigo-50 text-[#4F46E5] border border-indigo-200" : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {isOpen && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t bg-white">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600",
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isOpen && <span className="flex-1 text-left">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100 opacity-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Log out of Mancrel</h3>
            <p className="text-sm text-center text-gray-500 mb-6">Are you sure you want to log out? You will need to sign in again to access your dashboard.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onLogoutConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
