"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, AlertTriangle, Users, LogOut } from "lucide-react"

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "escalations", icon: AlertTriangle, label: "Escalation" },
  { id: "customers", icon: Users, label: "Customers" },
]

export function Sidebar({ isOpen, activeView, setActiveView, handleLogout }) {
  const handleItemClick = (item) => {
    setActiveView(item.id)
  }

  const onLogoutClick = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      handleLogout()
    }
  }

  return (
    <aside className={cn("w-56 bg-white border-r flex flex-col transition-all duration-300", !isOpen && "w-16")}>
      <div className="h-14 border-b flex items-center px-4 gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        {isOpen && <span className="font-bold text-gray-800">Mancrel</span>}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
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
      <div className="p-3 border-t">
        <button
          onClick={onLogoutClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600",
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isOpen && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
