"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-guard"
import { Shield, Users, Settings, Home, LogOut, Menu, BarChart3, Database, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface AdminLayoutProps {
  children: React.ReactNode
}

const adminNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home, badge: null },
  { name: "Teachers", href: "/admin/teachers", icon: Users, badge: "3" },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, badge: null },
  { name: "Database", href: "/admin/database", icon: Database, badge: "New" },
  { name: "Settings", href: "/admin/settings", icon: Settings, badge: null },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center px-4 sm:px-6 border-b border-sidebar-border bg-gradient-to-r from-primary to-accent">
        <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white mr-2 sm:mr-3 flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-white truncate">AttendanceTracker</h1>
          <p className="text-xs text-white/80">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 sm:space-y-2 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
        {adminNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] min-h-[44px]",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
              )}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <div className="flex items-center min-w-0">
                <item.icon className="mr-2 sm:mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <Badge variant={isActive ? "secondary" : "outline"} className="text-xs flex-shrink-0 ml-2">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 sm:p-4 bg-sidebar-primary/50">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" className="p-2 min-h-[36px] min-w-[36px]">
            <Bell className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="text-xs">
            Online
          </Badge>
        </div>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="ml-2 sm:ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "Admin User"}</p>
            <p className="text-xs text-primary font-medium">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="ml-2 hover:bg-destructive hover:text-destructive-foreground min-h-[36px] min-w-[36px]"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-border shadow-sm">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 sm:w-80">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 border-b border-border bg-card shadow-sm">
            <div className="flex items-center min-w-0">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="mr-2 sm:mr-3 min-h-[36px] min-w-[36px]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">AttendanceTracker</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Admin Portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="min-h-[36px] min-w-[36px]">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
