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

    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching students:", error)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    const transformedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.student_id,
      phone: student.phone || "",
      enrollmentDate: student.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      photo: student.photo_url,
      courses: [], // Will be populated when course system is implemented
      attendanceRate: 0, // Will be calculated from attendance_records
      status: "active" as const,
      faceEncodingStatus: student.face_encoding ? ("completed" as const) : ("pending" as const),
    }))

    return NextResponse.json({ students: transformedStudents })
  } catch (error) {
    console.error("[v0] Students API error:", error)
    return NextResponse.json({ error: "Failed to fetch students data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data: newStudent, error } = await supabase
      .from("students")
      .insert({
        name: studentData.name,
        email: studentData.email,
        student_id: studentData.studentId,
        phone: studentData.phone,
        photo_url: studentData.photo,
        department: studentData.department || null,
        year: studentData.year || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating student:", error)
      return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
    }

    console.log(`[v0] Added new student: ${newStudent.name} with UUID: ${newStudent.id}`)

    const transformedStudent = {
      id: newStudent.id, // This is now a proper UUID from Supabase
      name: newStudent.name,
      email: newStudent.email,
      studentId: newStudent.student_id,
      phone: newStudent.phone || "",
      enrollmentDate: newStudent.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      photo: newStudent.photo_url,
      courses: [],
      attendanceRate: 0,
      status: "active" as const,
      faceEncodingStatus: "pending" as const,
    }

    return NextResponse.json({ student: transformedStudent, message: "Student created successfully" })
  } catch (error) {
    console.error("[v0] Create student API error:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("id")

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { error } = await supabase.from("students").delete().eq("id", studentId)

    if (error) {
      console.error("[v0] Error deleting student:", error)
      return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
    }

    console.log(`[v0] Deleted student with UUID: ${studentId}`)

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete student API error:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const studentData = await request.json()
    const { id, ...updateData } = studentData

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update({
        name: updateData.name,
        email: updateData.email,
        student_id: updateData.studentId,
        phone: updateData.phone,
        photo_url: updateData.photo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating student:", error)
      return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
    }

    console.log(`[v0] Updated student with UUID: ${id}`)

    const transformedStudent = {
      id: updatedStudent.id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      studentId: updatedStudent.student_id,
      phone: updatedStudent.phone || "",
      enrollmentDate: updatedStudent.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      photo: updatedStudent.photo_url,
      courses: [],
      attendanceRate: 0,
      status: "active" as const,
      faceEncodingStatus: updatedStudent.face_encoding ? ("completed" as const) : ("pending" as const),
    }

    return NextResponse.json({
      student: transformedStudent,
      message: "Student updated successfully",
    })
  } catch (error) {
    console.error("[v0] Update student API error:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}
