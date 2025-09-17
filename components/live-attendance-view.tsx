"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Camera,
  Play,
  Square,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  photo?: string
  timestamp: string
  confidence: number
  status: "present" | "absent" | "pending"
}

interface Course {
  id: string
  code: string
  name: string
  totalStudents: number
}

export function LiveAttendanceView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [sessionActive, setSessionActive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const [recognitionActive, setRecognitionActive] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [courses] = useState<Course[]>([
    { id: "1", code: "CS101", name: "Introduction to Computer Science", totalStudents: 45 },
    { id: "2", code: "MATH201", name: "Calculus II", totalStudents: 32 },
    { id: "3", code: "ENG101", name: "English Composition", totalStudents: 28 },
  ])

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [sessionStats, setSessionStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    sessionDuration: 0,
  })

  // Simulate real-time recognition updates
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionActive && selectedCourse) {
      const course = courses.find((c) => c.id === selectedCourse)
      if (course) {
        setSessionStats((prev) => ({ ...prev, totalStudents: course.totalStudents }))

        interval = setInterval(() => {
          // Simulate random student recognition
          const studentNames = [
            "John Smith",
            "Sarah Johnson",
            "Mike Davis",
            "Emily Brown",
            "David Wilson",
            "Lisa Garcia",
            "James Miller",
            "Anna Taylor",
          ]

          const randomStudent = studentNames[Math.floor(Math.random() * studentNames.length)]
          const existingRecord = attendanceRecords.find((record) => record.studentName === randomStudent)

          if (!existingRecord && Math.random() > 0.7) {
            const newRecord: AttendanceRecord = {
              id: Date.now().toString(),
              studentId: `STU${String(attendanceRecords.length + 1).padStart(3, "0")}`,
              studentName: randomStudent,
              timestamp: new Date().toLocaleTimeString(),
              confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
              status: "present",
            }

            setAttendanceRecords((prev) => [newRecord, ...prev])
          }
        }, 3000) // Check every 3 seconds
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionActive, selectedCourse, attendanceRecords, courses])

  // Update session stats when attendance records change
  useEffect(() => {
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length
    const course = courses.find((c) => c.id === selectedCourse)
    const totalStudents = course?.totalStudents || 0
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

    setSessionStats((prev) => ({
      ...prev,
      presentCount,
      absentCount: totalStudents - presentCount,
      attendanceRate,
    }))
  }, [attendanceRecords, selectedCourse, courses])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setConnectionStatus("disconnected")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
      setConnectionStatus("disconnected")
    }
  }

  const startSession = () => {
    if (selectedCourse && isStreaming) {
      setSessionActive(true)
      setAttendanceRecords([])
      setConnectionStatus("connected")
      setCurrentSessionId(`session_${selectedCourse}_${Date.now()}`)
    }
  }

  const stopSession = () => {
    setSessionActive(false)
    setRecognitionActive(false)
    setConnectionStatus("disconnected")
    setCurrentSessionId(null)
  }

  const processFrameForRecognition = async (imageData: string) => {
    if (!currentSessionId || !recognitionActive) return

    try {
      console.log("[v0] Processing frame for facial recognition")

      const response = await fetch("/api/facial-recognition/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          imageData,
        }),
      })

      const result = await response.json()

      if (result.success && result.student) {
        // Add to attendance records
        const newRecord: AttendanceRecord = {
          id: result.attendance_id,
          studentId: result.student.student_id,
          studentName: result.student.name,
          timestamp: new Date().toLocaleTimeString(),
          confidence: Math.round(result.student.confidence * 100),
          status: "present",
        }

        setAttendanceRecords((prev) => [newRecord, ...prev])

        console.log("[v0] Student recognized:", result.student.name)
      }
    } catch (error) {
      console.error("[v0] Recognition processing error:", error)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (sessionActive && isStreaming && videoRef.current && canvasRef.current) {
      setRecognitionActive(true)

      interval = setInterval(async () => {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (video && canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)

            // Convert canvas to base64 image
            const imageData = canvas.toDataURL("image/jpeg", 0.8)
            await processFrameForRecognition(imageData)
          }
        }
      }, 2000) // Process every 2 seconds
    } else {
      setRecognitionActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionActive, isStreaming, currentSessionId])

  const selectedCourseData = courses.find((c) => c.id === selectedCourse)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time facial recognition attendance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={connectionStatus === "connected" ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {connectionStatus === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Feed
              </CardTitle>
              <CardDescription>Live video feed for facial recognition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: isStreaming ? "block" : "none" }}
                  />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "none" }} />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Camera Not Active</p>
                        <p className="text-sm opacity-75">Click "Start Camera" to begin</p>
                      </div>
                    </div>
                  )}
                  {sessionActive && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="destructive" className="animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        RECORDING
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isStreaming ? (
                    <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                      <Play className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Camera
                    </Button>
                  )}

                  {isStreaming && !sessionActive && (
                    <Button
                      onClick={startSession}
                      disabled={!selectedCourse}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Session
                    </Button>
                  )}

                  {sessionActive && (
                    <Button onClick={stopSession} variant="destructive">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Session
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
              <CardDescription>Select course and configure attendance session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Course</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={sessionActive}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course for attendance" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name} ({course.totalStudents} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCourseData && (
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Ready to monitor attendance for {selectedCourseData.code} with {selectedCourseData.totalStudents}{" "}
                      enrolled students.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Stats & Live Updates */}
        <div className="space-y-4">
          {/* Session Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sessionStats.presentCount}</div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{sessionStats.absentCount}</div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium">{sessionStats.attendanceRate}%</span>
                </div>
                <Progress value={sessionStats.attendanceRate} className="h-2" />
              </div>

              <div className="text-center text-sm text-gray-500">
                {sessionStats.presentCount} of {sessionStats.totalStudents} students detected
              </div>
            </CardContent>
          </Card>

          {/* Live Recognition Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Live Recognition
              </CardTitle>
              <CardDescription>Real-time student detection updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No students detected yet</p>
                    <p className="text-sm">Start a session to begin recognition</p>
                  </div>
                ) : (
                  attendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={record.photo || "/placeholder.svg"} alt={record.studentName} />
                        <AvatarFallback>
                          {record.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{record.studentName}</p>
                        <p className="text-xs text-gray-500">
                          {record.timestamp} • {record.confidence}% confidence
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {record.status === "present" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Camera Status</span>
                <Badge variant={isStreaming ? "default" : "secondary"}>{isStreaming ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recognition Engine</span>
                <Badge variant={recognitionActive ? "default" : "secondary"}>
                  {recognitionActive ? "Running" : "Stopped"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Status</span>
                <Badge variant={sessionActive ? "default" : "outline"}>{sessionActive ? "Active" : "Idle"}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
