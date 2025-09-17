import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Mock teachers data - in production, this would fetch from your database
    const teachers = [
      {
        id: "1",
        username: "john_doe",
        email: "john.doe@school.edu",
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        dateJoined: "2024-01-15",
        lastLogin: "2024-03-10",
        department: "Mathematics",
        phone: "+1-555-0123",
        classes: ["Math 101", "Algebra II"],
      },
      {
        id: "2",
        username: "jane_smith",
        email: "jane.smith@school.edu",
        firstName: "Jane",
        lastName: "Smith",
        isActive: true,
        dateJoined: "2024-02-01",
        lastLogin: "2024-03-09",
        department: "Science",
        phone: "+1-555-0124",
        classes: ["Biology", "Chemistry"],
      },
      {
        id: "3",
        username: "mike_wilson",
        email: "mike.wilson@school.edu",
        firstName: "Mike",
        lastName: "Wilson",
        isActive: false,
        dateJoined: "2023-09-01",
        lastLogin: "2024-02-15",
        department: "History",
        phone: "+1-555-0125",
        classes: ["World History", "US History"],
      },
    ]

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error("Teachers API error:", error)
    return NextResponse.json({ error: "Failed to fetch teachers data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacherData = await request.json()

    // Mock teacher creation - in production, this would save to your database
    const newTeacher = {
      id: Date.now().toString(),
      ...teacherData,
      dateJoined: new Date().toISOString().split("T")[0],
      isActive: true,
    }

    return NextResponse.json({ teacher: newTeacher, message: "Teacher created successfully" })
  } catch (error) {
    console.error("Create teacher API error:", error)
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("id")

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    // In production, this would delete from your database
    // For now, we'll simulate a successful deletion
    console.log(`[v0] Deleting teacher with ID: ${teacherId}`)

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Delete teacher API error:", error)
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const teacherData = await request.json()
    const { id, ...updateData } = teacherData

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    // In production, this would update the teacher in your database
    const updatedTeacher = {
      id,
      ...updateData,
      lastModified: new Date().toISOString(),
    }

    console.log(`[v0] Updating teacher with ID: ${id}`)

    return NextResponse.json({ teacher: updatedTeacher, message: "Teacher updated successfully" })
  } catch (error) {
    console.error("Update teacher API error:", error)
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 })
  }
}
