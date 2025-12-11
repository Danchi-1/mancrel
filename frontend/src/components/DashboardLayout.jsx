"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-white flex items-center justify-between px-6">
          <h1 className="text-sm font-semibold text-blue-500">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <Avatar className="w-8 h-8">
              <AvatarImage src="/diverse-avatars.png" />
              <AvatarFallback className="bg-blue-500 text-white text-xs">BK</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
