import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <DashboardOverview />
      </DashboardLayout>
    </AuthGuard>
  )
}
