"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, MapPin, Repeat, AlertTriangle, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"

interface Course {
  id: string
  code: string
  name: string
  instructor: string
  color: string
}

interface ClassSession {
  id: string
  courseId: string
  courseName: string
  courseColor: string
  date: Date
  startTime: string
  endTime: string
  room: string
  instructor: string
  isRecurring: boolean
  recurrencePattern?: {
    type: "weekly" | "daily"
    daysOfWeek: number[]
    endDate: Date
  }
  status: "scheduled" | "ongoing" | "completed"
}

interface TimeSlot {
  time: string
  available: boolean
  conflictWith?: string
}

export function EnhancedScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")

  const [courses] = useState<Course[]>([
    { id: "1", code: "CS101", name: "Intro to Computer Science", instructor: "Dr. Smith", color: "bg-blue-500" },
    { id: "2", code: "MATH201", name: "Calculus II", instructor: "Prof. Johnson", color: "bg-green-500" },
    { id: "3", code: "ENG101", name: "English Composition", instructor: "Dr. Williams", color: "bg-purple-500" },
  ])

  const [sessions, setSessions] = useState<ClassSession[]>([
    {
      id: "1",
      courseId: "1",
      courseName: "CS101",
      courseColor: "bg-blue-500",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:30",
      room: "Room A-101",
      instructor: "Dr. Smith",
      isRecurring: true,
      recurrencePattern: {
        type: "weekly",
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        endDate: addDays(new Date(), 90),
      },
      status: "scheduled",
    },
  ])

  const [newSession, setNewSession] = useState({
    courseId: "",
    date: new Date(),
    startTime: "",
    endTime: "",
    room: "",
    isRecurring: false,
    recurrenceType: "weekly" as "weekly" | "daily",
    selectedDays: [] as number[],
    endDate: addDays(new Date(), 30),
  })

  // Generate time slots for the day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const dayStart = 8 // 8 AM
    const dayEnd = 18 // 6 PM

    for (let hour = dayStart; hour < dayEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        // Check for conflicts
        const conflict = sessions.find(
          (session) => isSameDay(session.date, date) && session.startTime <= timeString && session.endTime > timeString,
        )

        slots.push({
          time: timeString,
          available: !conflict,
          conflictWith: conflict?.courseName,
        })
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots(selectedDate)

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => isSameDay(session.date, date))
  }

  // Handle recurring schedule creation
  const createRecurringSessions = (baseSession: typeof newSession) => {
    const newSessions: ClassSession[] = []
    const course = courses.find((c) => c.id === baseSession.courseId)
    if (!course) return []

    if (baseSession.isRecurring) {
      let currentDate = new Date(baseSession.date)
      const endDate = baseSession.endDate

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()

        if (baseSession.selectedDays.includes(dayOfWeek)) {
          newSessions.push({
            id: `${Date.now()}-${currentDate.getTime()}`,
            courseId: baseSession.courseId,
            courseName: course.code,
            courseColor: course.color,
            date: new Date(currentDate),
            startTime: baseSession.startTime,
            endTime: baseSession.endTime,
            room: baseSession.room,
            instructor: course.instructor,
            isRecurring: true,
            recurrencePattern: {
              type: baseSession.recurrenceType,
              daysOfWeek: baseSession.selectedDays,
              endDate: baseSession.endDate,
            },
            status: "scheduled",
          })
        }

        currentDate = addDays(currentDate, 1)
      }
    } else {
      newSessions.push({
        id: Date.now().toString(),
        courseId: baseSession.courseId,
        courseName: course.code,
        courseColor: course.color,
        date: baseSession.date,
        startTime: baseSession.startTime,
        endTime: baseSession.endTime,
        room: baseSession.room,
        instructor: course.instructor,
        isRecurring: false,
        status: "scheduled",
      })
    }

    return newSessions
  }

  const handleScheduleClass = () => {
    const newSessions = createRecurringSessions(newSession)
    setSessions([...sessions, ...newSessions])

    // Reset form
    setNewSession({
      courseId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      room: "",
      isRecurring: false,
      recurrenceType: "weekly",
      selectedDays: [],
      endDate: addDays(new Date(), 30),
    })
    setIsScheduleDialogOpen(false)
  }

  const weekDays = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
  ]

  const WeekView = () => {
    const weekStart = startOfWeek(selectedDate)
    const weekEnd = endOfWeek(selectedDate)
    const days = []

    for (let day = weekStart; day <= weekEnd; day = addDays(day, 1)) {
      days.push(day)
    }

    return (
      <div className="grid grid-cols-8 gap-2 h-96">
        {/* Time column */}
        <div className="space-y-2">
          <div className="h-12 flex items-center justify-center font-medium text-sm">Time</div>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-8 flex items-center justify-center text-xs text-gray-500">
              {`${8 + i}:00`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            <div className="h-12 flex flex-col items-center justify-center border-b">
              <div className="text-xs text-gray-500">{format(day, "EEE")}</div>
              <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? "text-blue-600" : ""}`}>
                {format(day, "d")}
              </div>
            </div>

            {/* Time slots for this day */}
            <div className="space-y-1">
              {getSessionsForDate(day).map((session) => (
                <div
                  key={session.id}
                  className={`${session.courseColor} text-white text-xs p-1 rounded text-center cursor-pointer hover:opacity-80`}
                  title={`${session.courseName} - ${session.room}`}
                >
                  <div className="font-medium">{session.courseName}</div>
                  <div>
                    {session.startTime}-{session.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Class Scheduling</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule classes with calendar view, conflict detection, and recurring patterns
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Schedule Dialog */}
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Class</DialogTitle>
                <DialogDescription>
                  Create single or recurring class sessions with automatic conflict detection
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Course Selection */}
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={newSession.courseId}
                    onValueChange={(value) => setNewSession({ ...newSession, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${course.color}`}></div>
                            {course.code} - {course.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Calendar
                      mode="single"
                      selected={newSession.date}
                      onSelect={(date) => date && setNewSession({ ...newSession, date })}
                      className="rounded-md border"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Select
                        value={newSession.startTime}
                        onValueChange={(value) => setNewSession({ ...newSession, startTime: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                              <div className="flex items-center gap-2">
                                {slot.available ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
                                {slot.time}
                                {!slot.available && <span className="text-xs text-red-500">({slot.conflictWith})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newSession.endTime}
                        onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Input
                        value={newSession.room}
                        onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                        placeholder="Room A-101"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurring Options */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newSession.isRecurring}
                      onCheckedChange={(checked) => setNewSession({ ...newSession, isRecurring: checked })}
                    />
                    <Label className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      Recurring Schedule
                    </Label>
                  </div>

                  {newSession.isRecurring && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label>Repeat Pattern</Label>
                        <Select
                          value={newSession.recurrenceType}
                          onValueChange={(value) =>
                            setNewSession({ ...newSession, recurrenceType: value as "weekly" | "daily" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="flex gap-2 flex-wrap">
                          {weekDays.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox
                                checked={newSession.selectedDays.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewSession({
                                      ...newSession,
                                      selectedDays: [...newSession.selectedDays, day.value],
                                    })
                                  } else {
                                    setNewSession({
                                      ...newSession,
                                      selectedDays: newSession.selectedDays.filter((d) => d !== day.value),
                                    })
                                  }
                                }}
                              />
                              <Label className="text-sm">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={format(newSession.endDate, "yyyy-MM-dd")}
                          onChange={(e) => setNewSession({ ...newSession, endDate: parseISO(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Conflict Warning */}
                {newSession.startTime && !timeSlots.find((slot) => slot.time === newSession.startTime)?.available && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">Time conflict detected with existing class</span>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleScheduleClass}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!newSession.courseId || !newSession.startTime || !newSession.endTime}
                  >
                    {newSession.isRecurring ? "Create Recurring Schedule" : "Schedule Class"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "calendar" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  {format(startOfWeek(selectedDate), "MMM d")} - {format(endOfWeek(selectedDate), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WeekView />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Classes</CardTitle>
            <CardDescription>All upcoming class sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions
                .filter((session) => session.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 10)
                .map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className={`w-4 h-4 rounded ${session.courseColor}`}></div>
                    <div className="flex-1">
                      <div className="font-medium">{session.courseName}</div>
                      <div className="text-sm text-gray-500">
                        {format(session.date, "MMM d, yyyy")} • {session.startTime} - {session.endTime}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.room}
                    </div>
                    {session.isRecurring && (
                      <Badge variant="outline">
                        <Repeat className="h-3 w-3 mr-1" />
                        Recurring
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
