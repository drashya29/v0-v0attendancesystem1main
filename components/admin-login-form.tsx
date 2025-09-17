"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, User, Lock, Shield, UserCheck, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginType, setLoginType] = useState<"admin" | "teacher">("admin")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      })

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned an invalid response.")
      }

      if (response.ok) {
        const user = data.user
        const isAdmin = user.is_superuser
        const isTeacher = user.is_staff

        if (loginType === "admin" && !isAdmin) {
          setError("You don't have administrator privileges")
          setIsLoading(false)
          return
        }

        if (loginType === "teacher" && !isTeacher) {
          setError("You don't have teacher privileges")
          setIsLoading(false)
          return
        }

        localStorage.setItem("authToken", data.token)
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.username,
            name: `${user.first_name} ${user.last_name}`.trim() || user.username,
            role: isAdmin ? "admin" : "teacher",
            permissions: isAdmin ? ["manage_teachers", "view_all_courses", "system_settings"] : ["manage_courses"],
            loginTime: new Date().toISOString(),
            isAdmin: isAdmin,
            isTeacher: isTeacher,
          }),
        )

        router.push(isAdmin ? "/admin/dashboard" : "/dashboard")
      } else {
        setError(data.error || data.non_field_errors?.[0] || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Network error. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Credentials:</strong>
          <br />
          Admin: username "admin", password "admin123"
          <br />
          Teacher: username "teacher", password "teacher123"
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
            {loginType === "admin" ? (
              <Shield className="h-6 w-6 text-blue-600" />
            ) : (
              <UserCheck className="h-6 w-6 text-green-600" />
            )}
            Attendance System
          </CardTitle>
          <CardDescription>{loginType === "admin" ? "Administrator Access" : "Teacher Access"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={loginType}
            onValueChange={(value) => setLoginType(value as "admin" | "teacher")}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Teacher
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Username/Email</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
                    <Input
                      id="admin-email"
                      type="text"
                      placeholder="admin username or email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-blue-200 focus:border-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Admin Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="teacher">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="teacher-email">Teacher Username/Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                    <Input
                      id="teacher-email"
                      type="text"
                      placeholder="teacher username or email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-green-200 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                    <Input
                      id="teacher-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-green-200 focus:border-green-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Teacher Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
