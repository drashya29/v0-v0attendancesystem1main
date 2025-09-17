import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LiveAttendanceView } from "@/components/live-attendance-view"

export default function LiveAttendancePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <LiveAttendanceView />
      </DashboardLayout>
    </AuthGuard>
  )
}
