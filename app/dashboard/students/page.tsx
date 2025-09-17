import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentManagement } from "@/components/student-management"

export default function StudentsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <StudentManagement />
      </DashboardLayout>
    </AuthGuard>
  )
}
