"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react"

interface AnalyticsData {
  attendanceOverview: {
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
  }
  teacherPerformance: Array<{
    name: string
    attendanceRate: number
    classes: number
  }>
  weeklyTrends: Array<{
    day: string
    attendance: number
  }>
  classDistribution: Array<{
    subject: string
    sessions: number
    avgAttendance: number
  }>
}

interface StudentRisk {
  id: string
  name: string
  studentId: string
  course: string
  attendanceRate: number
  absences: number
  lastAttended: string
  riskLevel: "high" | "medium" | "low"
  photo?: string
}

export function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAnalyticsData = async () => {
    try {
      const isAdminRoute = window.location.pathname.includes("/admin/")
      const endpoint = isAdminRoute ? "/api/admin/analytics" : "/api/dashboard/analytics"

      console.log("[v0] Fetching analytics from:", endpoint)

      const response = await fetch(endpoint)
      if (!response.ok) throw new Error("Failed to fetch analytics data")
      const data = await response.json()

      console.log("[v0] Analytics data received:", data.dataSource, data.viewType || "admin")
      setAnalyticsData(data)
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()

    const interval = setInterval(fetchAnalyticsData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const weeklyAttendanceData = analyticsData?.weeklyTrends || []
  const courseAttendanceData = analyticsData?.classDistribution || []

  const attendanceDistribution = [
    { range: "90-100%", count: 120, color: "#22c55e" },
    { range: "80-89%", count: 85, color: "#3b82f6" },
    { range: "70-79%", count: 45, color: "#f59e0b" },
    { range: "60-69%", count: 25, color: "#ef4444" },
    { range: "Below 60%", count: 15, color: "#dc2626" },
  ]

  const atRiskStudents: StudentRisk[] = [
    {
      id: "1",
      name: "Alex Johnson",
      studentId: "STU045",
      course: "CS101",
      attendanceRate: 45,
      absences: 12,
      lastAttended: "2024-03-10",
      riskLevel: "high",
    },
    {
      id: "2",
      name: "Maria Garcia",
      studentId: "STU078",
      course: "MATH201",
      attendanceRate: 62,
      absences: 8,
      lastAttended: "2024-03-12",
      riskLevel: "high",
    },
    {
      id: "3",
      name: "David Chen",
      studentId: "STU123",
      course: "ENG101",
      attendanceRate: 68,
      absences: 6,
      lastAttended: "2024-03-14",
      riskLevel: "medium",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      studentId: "STU156",
      course: "PHYS101",
      attendanceRate: 72,
      absences: 5,
      lastAttended: "2024-03-13",
      riskLevel: "medium",
    },
  ]

  const exportData = (format: "csv" | "pdf") => {
    // Simulate export functionality
    const filename = `attendance-report-${new Date().toISOString().split("T")[0]}.${format}`
    console.log(`Exporting ${format.toUpperCase()} report: ${filename}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive attendance analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportData("csv")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportData("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="cs101">CS101</SelectItem>
                  <SelectItem value="math201">MATH201</SelectItem>
                  <SelectItem value="eng101">ENG101</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="courses">By Course</TabsTrigger>
          <TabsTrigger value="students">At-Risk Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Rate</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {analyticsData?.attendanceOverview.thisWeek || 87}%
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+2.3%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">245</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+12</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">At-Risk Students</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">18</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">-3</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Classes Today</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">8</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">6 completed</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
                <CardDescription>Daily attendance rates this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Students by attendance rate ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ range, count }) => `${range}: ${count}`}
                    >
                      {attendanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Attendance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Trends</CardTitle>
              <CardDescription>Attendance rate trends over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData?.attendanceOverview || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="thisMonth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="lastMonth" stroke="#e5e7eb" fill="#e5e7eb" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Average attendance rates by course</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={courseAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgAttendance" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Detailed attendance information by course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Avg Attendance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseAttendanceData.map((course) => (
                      <TableRow key={course.subject}>
                        <TableCell className="font-medium">{course.subject}</TableCell>
                        <TableCell>{course.sessions}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{course.avgAttendance}%</span>
                            <Progress value={course.avgAttendance} className="w-20 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.avgAttendance >= 85
                                ? "default"
                                : course.avgAttendance >= 70
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {course.avgAttendance >= 85 ? "Good" : course.avgAttendance >= 70 ? "Fair" : "Poor"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                At-Risk Students
              </CardTitle>
              <CardDescription>Students with attendance below 75% threshold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Attendance Rate</TableHead>
                      <TableHead>Absences</TableHead>
                      <TableHead>Last Attended</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atRiskStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{student.attendanceRate}%</span>
                            <Progress value={student.attendanceRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{student.absences}</TableCell>
                        <TableCell>{student.lastAttended}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.riskLevel === "high"
                                ? "destructive"
                                : student.riskLevel === "medium"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {student.riskLevel} risk
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Contact
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
