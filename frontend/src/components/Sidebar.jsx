"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, AlertTriangle, Users, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: AlertTriangle, label: "Escalation" },
  { icon: Users, label: "Customers" },
]

export function Sidebar({ isOpen }) {
  const [expandedItems, setExpandedItems] = useState([])

  const toggleExpand = (label) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
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
        {menuItems.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => item.hasSubmenu && toggleExpand(item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                item.active
                  ? "bg-indigo-50 text-[#4F46E5] border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {isOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.hasSubmenu &&
                    (expandedItems.includes(item.label) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    ))}
                </>
              )}
            </button>
          </div>
        ))}
      </nav>
    </aside>
  )
}
