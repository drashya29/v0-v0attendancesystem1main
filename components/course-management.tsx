"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Users, Clock, MapPin, Edit, Trash2, GraduationCap } from "lucide-react"
import { EnhancedScheduling } from "./enhanced-scheduling"

interface Course {
  id: string
  code: string
  name: string
  description: string
  instructor: string
  schedule: {
    days: string[]
    time: string
    room: string
  }
  enrolledStudents: number
  maxCapacity: number
  semester: string
  status: "active" | "inactive" | "completed"
  attendanceRate: number
}

interface Class {
  id: string
  courseId: string
  courseName: string
  date: string
  time: string
  room: string
  instructor: string
  studentsPresent: number
  totalStudents: number
  status: "scheduled" | "ongoing" | "completed"
}

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      code: "CS101",
      name: "Introduction to Computer Science",
      description: "Fundamental concepts of computer science and programming",
      instructor: "Dr. Smith",
      schedule: {
        days: ["Monday", "Wednesday", "Friday"],
        time: "09:00 - 10:30",
        room: "Room A-101",
      },
      enrolledStudents: 45,
      maxCapacity: 50,
      semester: "Fall 2024",
      status: "active",
      attendanceRate: 88,
    },
    {
      id: "2",
      code: "MATH201",
      name: "Calculus II",
      description: "Advanced calculus concepts and applications",
      instructor: "Prof. Johnson",
      schedule: {
        days: ["Tuesday", "Thursday"],
        time: "14:00 - 15:30",
        room: "Room B-205",
      },
      enrolledStudents: 32,
      maxCapacity: 40,
      semester: "Fall 2024",
      status: "active",
      attendanceRate: 92,
    },
    {
      id: "3",
      code: "ENG101",
      name: "English Composition",
      description: "Writing and communication skills development",
      instructor: "Dr. Williams",
      schedule: {
        days: ["Monday", "Wednesday"],
        time: "11:00 - 12:30",
        room: "Room C-301",
      },
      enrolledStudents: 28,
      maxCapacity: 35,
      semester: "Fall 2024",
      status: "active",
      attendanceRate: 76,
    },
  ])

  const [classes, setClasses] = useState<Class[]>([
    {
      id: "1",
      courseId: "1",
      courseName: "CS101",
      date: "2024-03-15",
      time: "09:00 - 10:30",
      room: "Room A-101",
      instructor: "Dr. Smith",
      studentsPresent: 42,
      totalStudents: 45,
      status: "completed",
    },
    {
      id: "2",
      courseId: "2",
      courseName: "MATH201",
      date: "2024-03-15",
      time: "14:00 - 15:30",
      room: "Room B-205",
      instructor: "Prof. Johnson",
      studentsPresent: 30,
      totalStudents: 32,
      status: "completed",
    },
    {
      id: "3",
      courseId: "1",
      courseName: "CS101",
      date: "2024-03-16",
      time: "09:00 - 10:30",
      room: "Room A-101",
      instructor: "Dr. Smith",
      studentsPresent: 0,
      totalStudents: 45,
      status: "scheduled",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    description: "",
    instructor: "",
    days: [] as string[],
    time: "",
    room: "",
    maxCapacity: "",
    semester: "",
  })

  const [newClass, setNewClass] = useState({
    courseId: "",
    date: "",
    time: "",
    room: "",
  })

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCourse = () => {
    if (newCourse.code && newCourse.name && newCourse.instructor) {
      const course: Course = {
        id: Date.now().toString(),
        code: newCourse.code,
        name: newCourse.name,
        description: newCourse.description,
        instructor: newCourse.instructor,
        schedule: {
          days: newCourse.days,
          time: newCourse.time,
          room: newCourse.room,
        },
        enrolledStudents: 0,
        maxCapacity: Number.parseInt(newCourse.maxCapacity) || 30,
        semester: newCourse.semester,
        status: "active",
        attendanceRate: 0,
      }
      setCourses([...courses, course])
      setNewCourse({
        code: "",
        name: "",
        description: "",
        instructor: "",
        days: [],
        time: "",
        room: "",
        maxCapacity: "",
        semester: "",
      })
      setIsAddCourseDialogOpen(false)
    }
  }

  const handleAddClass = () => {
    if (newClass.courseId && newClass.date && newClass.time) {
      const course = courses.find((c) => c.id === newClass.courseId)
      if (course) {
        const classItem: Class = {
          id: Date.now().toString(),
          courseId: newClass.courseId,
          courseName: course.code,
          date: newClass.date,
          time: newClass.time,
          room: newClass.room || course.schedule.room,
          instructor: course.instructor,
          studentsPresent: 0,
          totalStudents: course.enrolledStudents,
          status: "scheduled",
        }
        setClasses([...classes, classItem])
        setNewClass({ courseId: "", date: "", time: "", room: "" })
        setIsAddClassDialogOpen(false)
      }
    }
  }

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  const AddCourseDialog = () => (
    <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>Create a new course with schedule and enrollment details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                placeholder="CS101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={newCourse.semester}
                onValueChange={(value) => setNewCourse({ ...newCourse, semester: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                  <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                  <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              placeholder="Introduction to Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Course description and objectives"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={newCourse.maxCapacity}
                onChange={(e) => setNewCourse({ ...newCourse, maxCapacity: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Class Time</Label>
              <Input
                id="time"
                value={newCourse.time}
                onChange={(e) => setNewCourse({ ...newCourse, time: e.target.value })}
                placeholder="09:00 - 10:30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                value={newCourse.room}
                onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                placeholder="Room A-101"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddCourse} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Add Course
            </Button>
            <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AddClassDialog = () => (
    <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Class</DialogTitle>
          <DialogDescription>Schedule a class session for a course</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseSelect">Course</Label>
            <Select value={newClass.courseId} onValueChange={(value) => setNewClass({ ...newClass, courseId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newClass.date}
                onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classTime">Time</Label>
              <Input
                id="classTime"
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                placeholder="09:00 - 10:30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classRoom">Room (optional)</Label>
            <Input
              id="classRoom"
              value={newClass.room}
              onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
              placeholder="Leave empty to use course default"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddClass} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Schedule Class
            </Button>
            <Button variant="outline" onClick={() => setIsAddClassDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage courses, schedules, and class sessions</p>
        </div>
        <div className="flex gap-2">
          <AddClassDialog />
          <AddCourseDialog />
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="classes">Class Sessions</TabsTrigger>
          <TabsTrigger value="scheduling">Smart Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses by name, code, or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.code}</CardTitle>
                      <CardDescription className="font-medium text-gray-900 dark:text-white">
                        {course.name}
                      </CardDescription>
                    </div>
                    <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{course.schedule.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{course.schedule.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {course.enrolledStudents}/{course.maxCapacity} students
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attendance Rate</span>
                      <span className="font-medium">{course.attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Classes</CardTitle>
              <CardDescription>All scheduled and completed class sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.courseName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{classItem.date}</p>
                          <p className="text-sm text-gray-500">{classItem.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>{classItem.room}</TableCell>
                      <TableCell>{classItem.instructor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {classItem.studentsPresent}/{classItem.totalStudents}
                          </span>
                          {classItem.status === "completed" && (
                            <Badge variant="secondary">
                              {Math.round((classItem.studentsPresent / classItem.totalStudents) * 100)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            classItem.status === "completed"
                              ? "default"
                              : classItem.status === "ongoing"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {classItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {classItem.status === "scheduled" && (
                            <Button variant="outline" size="sm">
                              Start Session
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <EnhancedScheduling />
        </TabsContent>
      </Tabs>
    </div>
  )
}
