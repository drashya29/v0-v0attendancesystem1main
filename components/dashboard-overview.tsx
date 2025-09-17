"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserCheck,
  UserX,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Camera,
  Bell,
  Activity,
  History,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface AttendanceStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  totalCourses: number
  attendanceRate: number
  liveSessionsActive: number
}

interface ActivityRecord {
  id: string
  type: "attendance" | "registration" | "course" | "alert" | "session"
  message: string
  time: string
  timestamp: Date
  status: "success" | "warning" | "info" | "error"
  details?: string
}

export function DashboardOverview() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 3, // Updated to use consistent student count with student management
    presentToday: 0,
    absentToday: 0,
    totalCourses: 0,
    attendanceRate: 0,
    liveSessionsActive: 0,
  })

  const [recentActivity, setRecentActivity] = useState<ActivityRecord[]>([])
  const [activityHistory, setActivityHistory] = useState<ActivityRecord[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Load saved activity history from localStorage
    const savedHistory = localStorage.getItem("attendance-activity-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setActivityHistory(parsed)
      } catch (error) {
        console.error("Failed to load activity history:", error)
      }
    }

    const updateStats = () => {
      const totalStudents = 3 // Matches the 3 students in student management
      const presentToday = Math.floor(Math.random() * 2) + 2 // 2-3 students present
      const absentToday = totalStudents - presentToday // Remaining students absent

      const newStats = {
        totalStudents,
        presentToday,
        absentToday,
        totalCourses: 12,
        attendanceRate: Math.floor((presentToday / totalStudents) * 100),
        liveSessionsActive: Math.floor(Math.random() * 3) + 1,
      }
      setStats(newStats)
      setLastUpdate(new Date())

      // Generate new activity with more variety
      const activityTypes = [
        {
          type: "attendance",
          messages: ["marked present in", "marked absent from", "late arrival in"],
          status: ["success", "warning", "info"],
        },
        {
          type: "registration",
          messages: ["New student registered:", "Student profile updated:", "Student enrollment changed:"],
          status: ["info", "success", "info"],
        },
        {
          type: "course",
          messages: ["New course created:", "Course schedule updated:", "Course capacity changed:"],
          status: ["info", "success", "warning"],
        },
        {
          type: "session",
          messages: ["Live session started in", "Live session ended in", "Session recording saved for"],
          status: ["success", "info", "success"],
        },
        {
          type: "alert",
          messages: ["Low attendance alert for", "System maintenance scheduled for", "Backup completed for"],
          status: ["warning", "info", "success"],
        },
      ]

      const students = ["John Smith", "Sarah Johnson", "Mike Davis"]
      const courses = ["CS101", "MATH201", "ENG101", "PHYS101", "CHEM101", "HIST101", "BIO101", "PSYC101"]

      if (Math.random() > 0.3) {
        // 70% chance of new activity
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
        const student = students[Math.floor(Math.random() * students.length)]
        const course = courses[Math.floor(Math.random() * courses.length)]
        const message = activityType.messages[Math.floor(Math.random() * activityType.messages.length)]
        const status = activityType.status[Math.floor(Math.random() * activityType.status.length)] as
          | "success"
          | "warning"
          | "info"
          | "error"

        const newActivity: ActivityRecord = {
          id: Date.now().toString(),
          type: activityType.type as any,
          message: `${student} ${message} ${course}`,
          time: new Date().toLocaleTimeString(),
          timestamp: new Date(),
          status,
          details: `Course: ${course}, Time: ${new Date().toLocaleString()}`,
        }

        setRecentActivity((prev) => [newActivity, ...prev.slice(0, 9)]) // Keep last 10

        // Add to history and save to localStorage
        setActivityHistory((prev) => {
          const updated = [newActivity, ...prev].slice(0, 100) // Keep last 100
          localStorage.setItem("attendance-activity-history", JSON.stringify(updated))
          return updated
        })
      }
    }

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    updateStats()
    const interval = setInterval(updateStats, 5000) // Faster updates every 5 seconds

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      change: "+12 this week",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      change: `${((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}%`,
    },
    {
      title: "Absent Today",
      value: stats.absentToday,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      change: stats.absentToday > 20 ? "High" : "Normal",
    },
    {
      title: "Active Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      change: "All active",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Welcome back! Here's what's happening with your attendance system.</span>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                {isOnline ? "Online" : "Offline"}
              </Badge>
              <span className="text-xs">Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/live">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Camera className="mr-2 h-4 w-4" />
              Start Live Session
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Today's Attendance Rate
            </CardTitle>
            <CardDescription>Overall attendance across all courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold">{stats.attendanceRate}%</span>
              <Badge
                variant={
                  stats.attendanceRate >= 85 ? "default" : stats.attendanceRate >= 70 ? "secondary" : "destructive"
                }
              >
                {stats.attendanceRate >= 85 ? "Excellent" : stats.attendanceRate >= 70 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
            <Progress value={stats.attendanceRate} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{stats.presentToday} present</span>
              <span>{stats.absentToday} absent</span>
              <span>{stats.totalStudents} total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-blue-600" />
              Live Sessions
            </CardTitle>
            <CardDescription>Currently active attendance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold">{stats.liveSessionsActive}</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                Active
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CS101 - Room A</span>
                <Badge variant="outline" className="text-xs">
                  Running
                </Badge>
              </div>
              {stats.liveSessionsActive > 1 && (
                <div className="flex justify-between text-sm">
                  <span>MATH201 - Room B</span>
                  <Badge variant="outline" className="text-xs">
                    Running
                  </Badge>
                </div>
              )}
              {stats.liveSessionsActive > 2 && (
                <div className="flex justify-between text-sm">
                  <span>ENG101 - Room C</span>
                  <Badge variant="outline" className="text-xs">
                    Running
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-gray-600" />
            Activity Feed
          </CardTitle>
          <CardDescription>Real-time updates and activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Recent ({recentActivity.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({activityHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-4">
              <ScrollArea className="h-64 sm:h-80">
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here as it happens</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            activity.status === "success"
                              ? "bg-green-100 dark:bg-green-900"
                              : activity.status === "warning"
                                ? "bg-yellow-100 dark:bg-yellow-900"
                                : activity.status === "error"
                                  ? "bg-red-100 dark:bg-red-900"
                                  : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          {activity.status === "success" ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : activity.status === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : activity.status === "error" ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Users className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {activity.message}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                            {activity.details && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{activity.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-64 sm:h-80">
                <div className="space-y-3">
                  {activityHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No activity history</p>
                      <p className="text-sm">Past activities will be saved here</p>
                    </div>
                  ) : (
                    activityHistory.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            activity.status === "success"
                              ? "bg-green-100 dark:bg-green-900"
                              : activity.status === "warning"
                                ? "bg-yellow-100 dark:bg-yellow-900"
                                : activity.status === "error"
                                  ? "bg-red-100 dark:bg-red-900"
                                  : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          {activity.status === "success" ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : activity.status === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : activity.status === "error" ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Users className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {activity.message}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString()}
                            </p>
                            {activity.details && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{activity.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
