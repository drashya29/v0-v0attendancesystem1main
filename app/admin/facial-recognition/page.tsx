"use client"

import { AuthGuard } from "@/components/auth-guard"
import { EnhancedFaceRecognition } from "@/components/enhanced-face-recognition"
import { AdvancedRecognitionDashboard } from "@/components/advanced-recognition-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FacialRecognitionPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Facial Recognition</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered facial recognition system with comprehensive security and quality features
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">System Dashboard</TabsTrigger>
            <TabsTrigger value="testing">Live Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdvancedRecognitionDashboard />
          </TabsContent>

          <TabsContent value="testing">
            <EnhancedFaceRecognition />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}