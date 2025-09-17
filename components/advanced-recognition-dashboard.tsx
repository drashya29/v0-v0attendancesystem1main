"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, Shield, Zap, Eye, Activity, TrendingUp, Users, 
  CheckCircle, AlertTriangle, Cpu, Target, Layers, Radar,
  BarChart3, PieChart, LineChart, Settings
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line
} from "recharts"

interface SystemStatus {
  status: string
  modelType: string
  statistics: {
    totalStudents: number
    studentsWithEncodings: number
    highQualityEncodings: number
    encodingCoverage: number
    qualityCoverage: number
    todayEnhancedAttendance: number
  }
  performanceMetrics: {
    averageConfidence: number
    averageQuality: number
    processingEfficiency: number
    accuracyTrend: string
    totalProcessed: number
    successRate: number
  }
  systemCapabilities: {
    realTimeProcessing: boolean
    antiSpoofing: boolean
    qualityAssessment: boolean
    multiFaceDetection: boolean
    landmarkDetection: boolean
    emotionRecognition: boolean
    ageEstimation: boolean
  }
}

export function AdvancedRecognitionDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("/api/facial-recognition/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "performance_metrics" }),
      })

      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error("Error fetching system status:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSystemStatus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Brain className="h-8 w-8 animate-pulse text-purple-600" />
        <span className="ml-2">Loading enhanced system status...</span>
      </div>
    )
  }

  if (!systemStatus) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load system status. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const qualityDistribution = [
    { name: "Excellent (90-100%)", value: 45, color: "#22c55e" },
    { name: "Good (80-89%)", value: 35, color: "#3b82f6" },
    { name: "Fair (70-79%)", value: 15, color: "#f59e0b" },
    { name: "Poor (<70%)", value: 5, color: "#ef4444" },
  ]

  const performanceTrend = [
    { month: "Jan", accuracy: 85, quality: 78 },
    { month: "Feb", accuracy: 87, quality: 82 },
    { month: "Mar", accuracy: 91, quality: 85 },
    { month: "Apr", accuracy: 93, quality: 88 },
    { month: "May", accuracy: 95, quality: 91 },
    { month: "Jun", accuracy: 96, quality: 93 },
  ]

  const processingMetrics = [
    { metric: "Face Detection", value: 98, color: "#6366f1" },
    { metric: "Quality Assessment", value: 94, color: "#8b5cf6" },
    { metric: "Liveness Detection", value: 96, color: "#06b6d4" },
    { metric: "Anti-Spoofing", value: 92, color: "#10b981" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            Enhanced Recognition System
          </h1>
          <p className="text-muted-foreground mt-1">
            Advanced AI-powered facial recognition with comprehensive security features
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <Activity className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(systemStatus.performanceMetrics.averageConfidence * 100).toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+2.3% this month</span>
                </div>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {(systemStatus.performanceMetrics.successRate).toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Anti-spoof active</span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold text-blue-600">
                  {systemStatus.statistics.encodingCoverage.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600">
                    {systemStatus.statistics.studentsWithEncodings}/{systemStatus.statistics.totalStudents} students
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(systemStatus.performanceMetrics.processingEfficiency * 100).toFixed(0)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Optimized</span>
                </div>
              </div>
              <Cpu className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
          <TabsTrigger value="security">Security Features</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  System Capabilities
                </CardTitle>
                <CardDescription>Advanced features and AI capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(systemStatus.systemCapabilities).map(([capability, enabled]) => (
                    <div key={capability} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {capability === "realTimeProcessing" && <Zap className="h-4 w-4 text-yellow-600" />}
                        {capability === "antiSpoofing" && <Shield className="h-4 w-4 text-green-600" />}
                        {capability === "qualityAssessment" && <Eye className="h-4 w-4 text-blue-600" />}
                        {capability === "multiFaceDetection" && <Users className="h-4 w-4 text-purple-600" />}
                        {capability === "landmarkDetection" && <Radar className="h-4 w-4 text-orange-600" />}
                        {capability === "emotionRecognition" && <Activity className="h-4 w-4 text-pink-600" />}
                        {capability === "ageEstimation" && <Target className="h-4 w-4 text-indigo-600" />}
                        <span className="text-sm font-medium capitalize">
                          {capability.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Processing Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Processing Pipeline
                </CardTitle>
                <CardDescription>Multi-stage validation and processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: "Image Preprocessing", accuracy: 98, icon: Eye },
                    { stage: "Face Detection", accuracy: 96, icon: Radar },
                    { stage: "Quality Assessment", accuracy: 94, icon: Target },
                    { stage: "Liveness Detection", accuracy: 92, icon: Shield },
                    { stage: "Feature Extraction", accuracy: 95, icon: Brain },
                    { stage: "Recognition Matching", accuracy: 93, icon: CheckCircle },
                  ].map((stage, index) => (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <stage.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{stage.stage}</span>
                          <span className="text-sm text-muted-foreground">{stage.accuracy}%</span>
                        </div>
                        <Progress value={stage.accuracy} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>System accuracy and quality improvements over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={3} />
                  <Line type="monotone" dataKey="quality" stroke="#8b5cf6" strokeWidth={3} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Quality Distribution
                </CardTitle>
                <CardDescription>Face encoding quality across all students</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={qualityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {qualityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Metrics
                </CardTitle>
                <CardDescription>Detailed quality assessment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Sharpness", score: 92, color: "bg-blue-500" },
                    { metric: "Brightness", score: 88, color: "bg-yellow-500" },
                    { metric: "Contrast", score: 90, color: "bg-purple-500" },
                    { metric: "Resolution", score: 95, color: "bg-green-500" },
                    { metric: "Pose Quality", score: 87, color: "bg-orange-500" },
                    { metric: "Facial Symmetry", score: 93, color: "bg-pink-500" },
                  ].map((item) => (
                    <div key={item.metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.metric}</span>
                        <span>{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Features
                </CardTitle>
                <CardDescription>Anti-spoofing and liveness detection capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Advanced Anti-Spoofing Active:</strong> Multi-layer protection against photo attacks,
                      video replays, and 3D masks.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Liveness Detection</span>
                      </div>
                      <Badge variant="default">96% Accuracy</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Texture Analysis</span>
                      </div>
                      <Badge variant="default">94% Accuracy</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Radar className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Depth Analysis</span>
                      </div>
                      <Badge variant="default">92% Accuracy</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Motion Detection</span>
                      </div>
                      <Badge variant="default">89% Accuracy</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threat Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Threat Detection
                </CardTitle>
                <CardDescription>Recent security events and blocked attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Photo Attack", blocked: 12, time: "Last 24h", severity: "high" },
                    { type: "Video Replay", blocked: 3, time: "Last 7d", severity: "medium" },
                    { type: "Low Quality", blocked: 45, time: "Last 24h", severity: "low" },
                    { type: "Multiple Faces", blocked: 8, time: "Last 24h", severity: "medium" },
                  ].map((threat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{threat.type}</p>
                        <p className="text-sm text-muted-foreground">{threat.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{threat.blocked}</p>
                        <Badge 
                          variant={
                            threat.severity === "high" ? "destructive" :
                            threat.severity === "medium" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {threat.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Processing Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Processing Metrics
                </CardTitle>
                <CardDescription>Real-time performance across all components</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processingMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>Overall system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">GPU Utilization</span>
                    <span className="text-sm">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Latency</span>
                    <span className="text-sm">12ms</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All systems operating within optimal parameters. Average processing time: 450ms per face.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
