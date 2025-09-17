"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AnalyticsDashboard />
    </AuthGuard>
  )
}
