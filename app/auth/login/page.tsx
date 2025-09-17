"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error

      localStorage.setItem(
        "user",
        JSON.stringify({
          email: email,
          role: "teacher",
          name: email.split("@")[0],
          loginTime: new Date().toISOString(),
        }),
      )

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "demo@school.edu",
        role: "teacher",
        name: "Demo Teacher",
        loginTime: new Date().toISOString(),
      }),
    )
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AttendanceTracker</h1>
            </div>
            <p className="text-muted-foreground">Sign in to track your attendance</p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Demo Mode: For admin/teacher login, use the main{" "}
              <Link href="/admin" className="underline">
                Admin Login
              </Link>{" "}
              page with demo credentials.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Student Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleDemoLogin}>
                    Demo Login (Student)
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="underline underline-offset-4 text-primary hover:text-accent">
                    Register here
                  </Link>
                </div>
                <div className="mt-2 text-center text-sm">
                  <Link href="/admin" className="underline underline-offset-4 text-primary hover:text-accent">
                    Admin/Teacher Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
