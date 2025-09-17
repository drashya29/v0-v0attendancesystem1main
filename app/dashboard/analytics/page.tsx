import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <AnalyticsDashboard />
      </DashboardLayout>
    </AuthGuard>
  )
}
