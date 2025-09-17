"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react"

interface Teacher {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  dateJoined: string
  lastLogin: string
  department: string
  phone: string
  classes: string[]
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    department: "",
    phone: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers")
      if (!response.ok) throw new Error("Failed to fetch teachers")
      const data = await response.json()
      setTeachers(data.teachers || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      setError("Failed to load teachers")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeacher),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create teacher")
      }

      const data = await response.json()
      setSuccess("Teacher created successfully!")
      setNewTeacher({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        department: "",
        phone: "",
        password: "",
      })
      setShowAddDialog(false)
      fetchTeachers()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create teacher")
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return

    try {
      const response = await fetch(`/api/admin/teachers?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete teacher")
      }

      setSuccess("Teacher deleted successfully!")
      fetchTeachers() // Refresh the list
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete teacher")
    }
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setNewTeacher({
      username: teacher.username,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      department: teacher.department,
      phone: teacher.phone,
      password: "", // Don't pre-fill password for security
    })
    setShowAddDialog(true)
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            Teacher Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage teacher accounts and permissions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account with login credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newTeacher.firstName}
                    onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newTeacher.lastName}
                    onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Teacher</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
              <CardDescription>Manage teacher accounts and permissions</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="grid gap-4">
              {filteredTeachers.map((teacher) => (
                <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {teacher.firstName[0]}
                            {teacher.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {teacher.firstName} {teacher.lastName}
                            </h3>
                            <Badge variant={teacher.isActive ? "default" : "secondary"}>
                              {teacher.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{teacher.email}</span>
                            </div>
                            {teacher.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{teacher.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3 w-3" />
                              <span>{teacher.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>Joined {new Date(teacher.dateJoined).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {teacher.classes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {teacher.classes.map((className, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {className}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTeacher(teacher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive bg-transparent"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredTeachers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No teachers found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
