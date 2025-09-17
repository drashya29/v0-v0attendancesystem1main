"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-guard"
import { BarChart3, BookOpen, Camera, Home, LogOut, Menu, Users, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Live Attendance", href: "/dashboard/live", icon: Camera },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
        <h1 className="text-lg sm:text-xl font-bold text-blue-600">AttendanceSystem</h1>
        <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
          {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-sm font-semibold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="ml-2 hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-lg font-bold text-blue-600">AttendanceSystem</h1>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
              {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
