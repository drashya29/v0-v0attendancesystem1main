"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate authentication
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, accept any email/password
      if (email && password) {
        // Store user session (in real app, this would be handled by auth service)
        localStorage.setItem(
          "user",
          JSON.stringify({
            email,
            role: email.includes("admin") ? "admin" : "teacher",
            name: email.split("@")[0],
          }),
        )
        router.push("/dashboard")
      } else {
        setError("Please enter both email and password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
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
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Demo: Use any email/password to login
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
