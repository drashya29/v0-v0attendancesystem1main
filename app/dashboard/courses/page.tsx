import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CourseManagement } from "@/components/course-management"

export default function CoursesPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <CourseManagement />
      </DashboardLayout>
    </AuthGuard>
  )
}
