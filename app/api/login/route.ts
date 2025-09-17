import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Mock authentication for demo purposes
    // In a real app, this would connect to your Django backend
    if (username === "admin" && password === "admin123") {
      return NextResponse.json({
        token: "mock-admin-token",
        user: {
          id: 1,
          email: "admin@school.edu",
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          is_superuser: true,
          is_staff: true,
        },
      })
    } else if (username === "teacher" && password === "teacher123") {
      return NextResponse.json({
        token: "mock-teacher-token",
        user: {
          id: 2,
          email: "teacher@school.edu",
          username: "teacher",
          first_name: "Teacher",
          last_name: "User",
          is_superuser: false,
          is_staff: true,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
