"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Download, Upload, RefreshCw, HardDrive, Users, Calendar, CheckCircle } from "lucide-react"
import { useState } from "react"

export default function DatabasePage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackup, setLastBackup] = useState("2024-03-10 02:00:00")

  const handleBackup = async () => {
    setIsBackingUp(true)
    // Simulate backup process
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setLastBackup(new Date().toLocaleString())
    setIsBackingUp(false)
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              Database Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor and manage system database</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">All connections active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4 GB</div>
              <p className="text-xs text-muted-foreground">of 10 GB allocated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,847</div>
              <p className="text-xs text-muted-foreground">Across all tables</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today</div>
              <p className="text-xs text-muted-foreground">{lastBackup}</p>
            </CardContent>
          </Card>
        </div>

        {/* Database Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage database backups and restoration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Automatic backups are enabled and running daily at 2:00 AM</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleBackup} disabled={isBackingUp} className="bg-blue-600 hover:bg-blue-700">
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Recent Backups</h4>
                {[
                  { date: "2024-03-10", size: "2.4 GB", status: "Complete" },
                  { date: "2024-03-09", size: "2.3 GB", status: "Complete" },
                  { date: "2024-03-08", size: "2.3 GB", status: "Complete" },
                ].map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{backup.date}</p>
                      <p className="text-xs text-gray-600">{backup.size}</p>
                    </div>
                    <Badge variant="default">{backup.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Overview of database structure and record counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { table: "students", records: 1247, size: "1.2 GB" },
                  { table: "teachers", records: 45, size: "12 MB" },
                  { table: "attendance_records", records: 12890, size: "890 MB" },
                  { table: "courses", records: 156, size: "45 MB" },
                  { table: "face_encodings", records: 1247, size: "234 MB" },
                  { table: "system_logs", records: 8934, size: "156 MB" },
                ].map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{table.table}</p>
                      <p className="text-sm text-gray-600">{table.records.toLocaleString()} records</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{table.size}</p>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Operations</CardTitle>
            <CardDescription>Database optimization and maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Optimize Tables</h4>
                <p className="text-sm text-gray-600 mb-3">Optimize database tables for better performance</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Clean Logs</h4>
                <p className="text-sm text-gray-600 mb-3">Remove old system logs to free up space</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clean
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Rebuild Indexes</h4>
                <p className="text-sm text-gray-600 mb-3">Rebuild database indexes for optimal queries</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rebuild
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
