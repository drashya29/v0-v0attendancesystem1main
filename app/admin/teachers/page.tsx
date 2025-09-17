"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TeacherManagement } from "@/components/teacher-management"

export default function TeachersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <TeacherManagement />
    </AuthGuard>
  )
}
