"use client"

import type React from "react"
import { useEffect } from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Upload, Camera, Edit, Trash2, User, Mail, Phone, Save, Loader2, CheckCircle } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  phone: string
  enrollmentDate: string
  photo?: string
  courses: string[]
  attendanceRate: number
  status: "active" | "inactive"
  faceEncodingStatus?: "pending" | "processing" | "completed" | "failed"
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const { toast } = useToast()

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    phone: "",
    photo: null as File | null,
  })

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        })
        return
      }

      setNewStudent({ ...newStudent, photo: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students")
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
      toast({
        title: "Error loading students",
        description: "Failed to load student data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.studentId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!newStudent.photo) {
      toast({
        title: "Photo required",
        description: "Please upload a photo for facial recognition",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setSaveProgress(0)

    try {
      setSaveProgress(20)
      const photoUrl = await processAndUploadPhoto(newStudent.photo)

      setSaveProgress(40)
      const studentData = {
        name: newStudent.name,
        email: newStudent.email,
        studentId: newStudent.studentId,
        phone: newStudent.phone,
        photo: photoUrl,
      }

      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create student")
      }

      const createdStudent = await response.json()
      setSaveProgress(60)

      console.log("[v0] Processing enhanced facial recognition for student:", createdStudent.student.id)

      try {
        const faceResponse = await fetch("/api/facial-recognition/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "process_student_advanced",
            studentId: createdStudent.student.id,
            imageData: photoUrl,
            settings: {
              qualityThreshold: 0.75,
              livenessThreshold: 0.85,
              antiSpoofThreshold: 0.85,
            },
          }),
        })

        const faceResult = await faceResponse.json()
        setSaveProgress(90)

        if (faceResult.success) {
          console.log("[v0] Enhanced face encoding generated successfully")
          toast({
            title: "Student added successfully",
            description: `${studentData.name} has been registered with enhanced facial recognition (Quality: ${(faceResult.quality_score * 100).toFixed(1)}%)`,
          })
        } else {
          console.log("[v0] Enhanced face encoding failed:", faceResult.message)
          toast({
            title: "Student added with warning",
            description: `${studentData.name} was registered but enhanced facial recognition setup failed: ${faceResult.message}`,
            variant: "destructive",
          })
        }
      } catch (faceError) {
        console.error("[v0] Enhanced face processing error:", faceError)
        toast({
          title: "Student added with warning",
          description: `${studentData.name} was registered but enhanced facial recognition setup failed`,
          variant: "destructive",
        })
      }

      setSaveProgress(100)

      setNewStudent({ name: "", email: "", studentId: "", phone: "", photo: null })
      setPhotoPreview(null)
      setIsAddDialogOpen(false)

      // Refresh the students list
      fetchStudents()
    } catch (error) {
      console.error("[v0] Error saving student:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving the student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setSaveProgress(0)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    try {
      console.log("[v0] Deleting student with ID:", id)
      const response = await fetch(`/api/admin/students?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete student")
      }

      // Refresh the students list
      fetchStudents()

      toast({
        title: "Student deleted",
        description: "Student has been successfully removed from the system",
      })
    } catch (error) {
      console.error("[v0] Error deleting student:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the student. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setNewStudent({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      phone: student.phone,
      photo: null,
    })
    setPhotoPreview(student.photo || null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return

    setIsSaving(true)
    setSaveProgress(0)

    try {
      setSaveProgress(30)

      let photoUrl = selectedStudent.photo
      let shouldUpdateFaceEncoding = false

      if (newStudent.photo) {
        setSaveProgress(50)
        photoUrl = await processAndUploadPhoto(newStudent.photo)
        shouldUpdateFaceEncoding = true
      }

      setSaveProgress(70)
      const studentData = {
        id: selectedStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        studentId: newStudent.studentId,
        phone: newStudent.phone,
        photo: photoUrl,
      }

      const response = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update student")
      }

      if (shouldUpdateFaceEncoding && photoUrl) {
        setSaveProgress(85)
        try {
          const faceResponse = await fetch("/api/facial-recognition/process-student", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: selectedStudent.id,
              imageData: photoUrl,
            }),
          })

          const faceResult = await faceResponse.json()
          if (!faceResult.success) {
            console.log("[v0] Face encoding update failed:", faceResult.error)
          }
        } catch (faceError) {
          console.error("[v0] Face processing error during update:", faceError)
        }
      }

      setSaveProgress(100)

      setSelectedStudent(null)
      setNewStudent({ name: "", email: "", studentId: "", phone: "", photo: null })
      setPhotoPreview(null)
      setIsEditDialogOpen(false)

      fetchStudents()

      toast({
        title: "Student updated successfully",
        description: `${studentData.name}'s information has been updated`,
      })
    } catch (error) {
      console.error("[v0] Error updating student:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating the student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setSaveProgress(0)
    }
  }

  const processAndUploadPhoto = async (photo: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          if (result.startsWith("data:image/")) {
            resolve(result)
          } else {
            reject(new Error("Invalid image format"))
          }
        } else {
          reject(new Error("Failed to read image file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read image file"))
      reader.readAsDataURL(photo)
    })
  }

  const AddStudentDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>Register a new student with photo for facial recognition</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>Photo is required for facial recognition attendance tracking.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Student Photo</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoPreview || "/placeholder.svg"} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG supported.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                placeholder="John Smith"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                placeholder="STU001"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              placeholder="john.smith@student.edu"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              disabled={isSaving}
            />
          </div>

          {isSaving && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {saveProgress < 60
                    ? "Saving student..."
                    : saveProgress < 90
                      ? "Processing facial recognition..."
                      : "Finalizing..."}
                </Label>
                <span className="text-sm text-muted-foreground">{saveProgress}%</span>
              </div>
              <Progress value={saveProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {saveProgress < 60
                  ? "Creating student record..."
                  : saveProgress < 90
                    ? "Generating face encoding for attendance recognition..."
                    : "Completing registration..."}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddStudent} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Student
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1" disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const EditStudentDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student information and facial recognition data</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student Photo</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoPreview || "/placeholder.svg"} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-studentId">Student ID</Label>
              <Input
                id="edit-studentId"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              disabled={isSaving}
            />
          </div>

          {isSaving && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Updating student...</Label>
                <span className="text-sm text-muted-foreground">{saveProgress}%</span>
              </div>
              <Progress value={saveProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateStudent} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Student
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1" disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading students...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student registrations and facial recognition data</p>
        </div>
        <AddStudentDialog />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Students (
            {
              students.filter(
                (student) =>
                  student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  student.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
              ).length
            }
            )
          </CardTitle>
          <CardDescription>All registered students with their attendance information</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Face Recognition</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students
                .filter(
                  (student) =>
                    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">Enrolled: {student.enrollmentDate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{student.studentId}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {student.faceEncodingStatus === "completed" && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                          </Badge>
                        )}
                        {student.faceEncodingStatus === "processing" && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </Badge>
                        )}
                        {student.faceEncodingStatus === "failed" && <Badge variant="destructive">Failed</Badge>}
                        {student.faceEncodingStatus === "pending" && <Badge variant="outline">Pending</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.attendanceRate}%</span>
                        <Badge
                          variant={
                            student.attendanceRate >= 85
                              ? "default"
                              : student.attendanceRate >= 70
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {student.attendanceRate >= 85 ? "Good" : student.attendanceRate >= 70 ? "Fair" : "Poor"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditStudentDialog />
    </div>
  )
}
