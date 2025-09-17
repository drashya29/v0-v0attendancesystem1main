"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Eye,
  RefreshCw,
  GraduationCap,
} from "lucide-react"

interface DashboardData {
  stats: {
    totalTeachers: number
    activeTeachers: number
    totalStudents: number
    activeStudents: number
    attendanceRate: number
    todaySessions: number
    completedSessions: number
    ongoingSessions: number
  }
  recentActivity: Array<{
    id: number
    time: string
    event: string
    type: string
    userId: string
  }>
  systemStatus: {
    isOnline: boolean
    lastBackup: string
    activeConnections: number
    serverHealth: string
  }
}

interface AdminDashboardProps {
  defaultTab?: string
}

export function AdminDashboard({ defaultTab = "overview" }: AdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const dashboardResponse = await fetch("/api/admin/dashboard")

      if (!dashboardResponse.ok) throw new Error("Failed to fetch dashboard data")

      const dashboardData = await dashboardResponse.json()

      setDashboardData(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setDashboardData({
        stats: {
          totalTeachers: 0,
          activeTeachers: 0,
          totalStudents: 0,
          activeStudents: 0,
          attendanceRate: 0,
          todaySessions: 0,
          completedSessions: 0,
          ongoingSessions: 0,
        },
        recentActivity: [],
        systemStatus: {
          isOnline: false,
          lastBackup: "Never",
          activeConnections: 0,
          serverHealth: "Error",
        },
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const { stats, recentActivity, systemStatus } = dashboardData

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col space-y-4 sm:space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {stats.totalTeachers === 0 && stats.totalStudents === 0
                ? "Welcome! Start by adding teachers and students to your system."
                : "Welcome back! Here's what's happening with your attendance system today."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              {systemStatus.isOnline ? "System Online" : "System Offline"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Reports</span>
            </Button>
          </div>
        </div>
      </div>

      {stats.totalTeachers === 0 && stats.totalStudents === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Activity className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your attendance system is ready! Start by adding teachers and students to begin tracking attendance.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalTeachers}</div>
            <div className="flex items-center mt-2">
              <Progress
                value={stats.totalTeachers > 0 ? (stats.activeTeachers / stats.totalTeachers) * 100 : 0}
                className="flex-1 h-2"
              />
              <span className="text-xs text-muted-foreground ml-2">{stats.activeTeachers} active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {stats.activeStudents} active students
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Student Attendance Rate</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.attendanceRate}%</div>
            <div className="flex items-center mt-2">
              <Progress value={stats.attendanceRate} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground ml-2">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sessions</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.todaySessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              {stats.completedSessions} completed, {stats.ongoingSessions} ongoing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest attendance and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div
                      className={`p-1 rounded-full flex-shrink-0 ${
                        activity.type === "success"
                          ? "bg-green-100"
                          : activity.type === "warning"
                            ? "bg-orange-100"
                            : "bg-blue-100"
                      }`}
                    >
                      {activity.type === "success" ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : activity.type === "warning" ? (
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                      ) : (
                        <Activity className="h-3 w-3 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground break-words">{activity.event}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Activity will appear here as users interact with the system</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Teachers
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <GraduationCap className="h-4 w-4 mr-2" />
              Manage Students
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">System Status</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All systems are operational. Last backup: {systemStatus.lastBackup}.
            </AlertDescription>
          </Alert>
          <Alert className="border-blue-200 bg-blue-50">
            <Activity className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {systemStatus.activeConnections} active connections. Server health: {systemStatus.serverHealth}.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
