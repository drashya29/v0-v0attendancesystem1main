import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const [teachersResult, studentsResult, attendanceResult] = await Promise.all([
      supabase.from("teachers").select("*"),
      supabase.from("students").select("*"),
      supabase.from("attendance_records").select("*"),
    ])

    const totalTeachers = teachersResult.data?.length || 0
    const totalStudents = studentsResult.data?.length || 0
    const attendanceRecords = attendanceResult.data || []

    let attendanceRate = 0
    if (attendanceRecords.length > 0 && totalStudents > 0) {
      const presentCount = attendanceRecords.filter((record) => record.status === "present").length
      attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100)
    }

    const today = new Date().toISOString().split("T")[0]
    const todayRecords = attendanceRecords.filter((record) => record.date && record.date.startsWith(today))
    const todaySessions = todayRecords.length
    const completedSessions = todayRecords.filter((record) => record.check_out_time).length
    const ongoingSessions = todayRecords.filter((record) => record.check_in_time && !record.check_out_time).length

    const dashboardData = {
      stats: {
        totalTeachers,
        activeTeachers: totalTeachers, // All teachers are considered active for now
        totalStudents,
        activeStudents: totalStudents, // All students are considered active for now
        attendanceRate,
        todaySessions,
        completedSessions,
        ongoingSessions,
      },
      recentActivity: [],
      systemStatus: {
        isOnline: true,
        lastBackup: "Never",
        activeConnections: 0,
        serverHealth: "Good",
      },
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({
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
  }
}
