"use client"

import { AdminLoginForm } from "@/components/admin-login-form"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <AdminLoginForm />
    </div>
  )
}
