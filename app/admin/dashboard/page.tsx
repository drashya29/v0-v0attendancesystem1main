"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminDashboardPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  )
}
