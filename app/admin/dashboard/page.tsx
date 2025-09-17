"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Zap, Eye } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <AdminDashboard />
        
        {/* Enhanced Features Section */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Enhanced Facial Recognition System
            </CardTitle>
            <CardDescription>
              Advanced AI-powered facial recognition with anti-spoofing and quality assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Anti-Spoofing</p>
                  <p className="text-sm text-muted-foreground">96% Detection Rate</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <Eye className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Quality Assessment</p>
                  <p className="text-sm text-muted-foreground">Real-time Analysis</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <Zap className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-medium">Fast Processing</p>
                  <p className="text-sm text-muted-foreground">450ms Average</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <Brain className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">AI Enhanced</p>
                  <p className="text-sm text-muted-foreground">Deep Learning</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/admin/facial-recognition">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Brain className="mr-2 h-4 w-4" />
                  Access Enhanced System
                </Button>
              </Link>
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                System Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
