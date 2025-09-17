"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Bell, Shield, Camera, Mail, Save, CheckCircle, Eye, Zap } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    faceRecognition: true,
    emailNotifications: false,
    autoBackup: true,
    maintenanceMode: false,
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    schoolName: "Demo School",
    adminEmail: "admin@school.edu",
    faceRecognitionTolerance: 0.5,
    faceRecognitionModel: "cnn" as "hog" | "cnn",
    confidenceThreshold: 0.75,
    multipleDetection: true,
    imagePreprocessing: true,
    realTimeOptimization: true,
    batchProcessing: true,
    qualityAssessment: true,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Configure system preferences and security settings</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {saveSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="facial-recognition">Facial Recognition</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic system configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={settings.schoolName}
                      onChange={(e) => updateSetting("schoolName", e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => updateSetting("adminEmail", e.target.value)}
                      placeholder="admin@school.edu"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium">Face Recognition</h3>
                      </div>
                      <p className="text-sm text-gray-600">Enable facial recognition for attendance tracking</p>
                    </div>
                    <Switch
                      checked={settings.faceRecognition}
                      onCheckedChange={(checked) => updateSetting("faceRecognition", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">Automatic Backup</h3>
                      <p className="text-sm text-gray-600">Automatically backup database daily</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facial-recognition" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Enhanced Facial Recognition
                </CardTitle>
                <CardDescription>Configure advanced facial recognition settings for optimal accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Recognition Accuracy</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Recognition Tolerance: {settings.faceRecognitionTolerance.toFixed(2)}</Label>
                      <Slider
                        value={[settings.faceRecognitionTolerance]}
                        onValueChange={([value]) => updateSetting("faceRecognitionTolerance", value)}
                        min={0.3}
                        max={0.8}
                        step={0.05}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower = More strict (better accuracy, fewer matches)
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.confidenceThreshold]}
                        onValueChange={([value]) => updateSetting("confidenceThreshold", value)}
                        min={0.5}
                        max={0.95}
                        step={0.05}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum confidence required for positive identification
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recognition Model</Label>
                    <Select
                      value={settings.faceRecognitionModel}
                      onValueChange={(value: "hog" | "cnn") => updateSetting("faceRecognitionModel", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hog">HOG (Fast, Good for CPU)</SelectItem>
                        <SelectItem value="cnn">CNN (Accurate, Requires GPU)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      CNN model provides better accuracy but requires more processing power
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Optimization
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Multiple Face Detection</h4>
                        <p className="text-sm text-gray-600">Detect multiple faces in single image</p>
                      </div>
                      <Switch
                        checked={settings.multipleDetection}
                        onCheckedChange={(checked) => updateSetting("multipleDetection", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Image Preprocessing</h4>
                        <p className="text-sm text-gray-600">Enhance image quality before processing</p>
                      </div>
                      <Switch
                        checked={settings.imagePreprocessing}
                        onCheckedChange={(checked) => updateSetting("imagePreprocessing", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Real-time Optimization</h4>
                        <p className="text-sm text-gray-600">Optimize for live camera processing</p>
                      </div>
                      <Switch
                        checked={settings.realTimeOptimization}
                        onCheckedChange={(checked) => updateSetting("realTimeOptimization", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Batch Processing</h4>
                        <p className="text-sm text-gray-600">Process multiple students simultaneously</p>
                      </div>
                      <Switch
                        checked={settings.batchProcessing}
                        onCheckedChange={(checked) => updateSetting("batchProcessing", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Quality Assessment</h4>
                        <p className="text-sm text-gray-600">Assess image quality before processing</p>
                      </div>
                      <Switch
                        checked={settings.qualityAssessment}
                        onCheckedChange={(checked) => updateSetting("qualityAssessment", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>Recognition System Status:</strong>
                        </span>
                        <Badge variant="default" className="bg-green-600">
                          Optimized
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Model: {settings.faceRecognitionModel.toUpperCase()}</div>
                        <div>Tolerance: {settings.faceRecognitionTolerance.toFixed(2)}</div>
                        <div>Confidence: {(settings.confidenceThreshold * 100).toFixed(0)}%</div>
                        <div>Preprocessing: {settings.imagePreprocessing ? "Enabled" : "Disabled"}</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure authentication and security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting("sessionTimeout", Number.parseInt(e.target.value))}
                      min="5"
                      max="120"
                    />
                    <p className="text-xs text-gray-600">Users will be logged out after this period of inactivity</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting("maxLoginAttempts", Number.parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-gray-600">Account will be locked after this many failed attempts</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">Maintenance Mode</h3>
                      <p className="text-sm text-gray-600">Temporarily disable system access for maintenance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                      />
                      <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
                        {settings.maintenanceMode ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Status:</strong> All security features are properly configured. Two-factor
                    authentication is recommended for admin accounts.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure email notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium">Email Notifications</h3>
                      </div>
                      <p className="text-sm text-gray-600">Send attendance reports and alerts via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Daily Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Receive daily attendance summaries</p>
                      <Badge variant="outline">Enabled</Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">System Alerts</h4>
                      <p className="text-sm text-gray-600 mb-3">Get notified of system issues</p>
                      <Badge variant="outline">Enabled</Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Low Attendance Alerts</h4>
                      <p className="text-sm text-gray-600 mb-3">Alert when attendance drops below threshold</p>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Weekly Summaries</h4>
                      <p className="text-sm text-gray-600 mb-3">Weekly attendance and system reports</p>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Current system status and version information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">System Version</h4>
                      <p className="text-sm text-gray-600">Attendance System v2.1.0</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Database Version</h4>
                      <p className="text-sm text-gray-600">PostgreSQL 15.2</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Last Updated</h4>
                      <p className="text-sm text-gray-600">March 10, 2024</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Server Status</h4>
                      <Badge variant="default" className="bg-green-600">
                        Online
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">Uptime</h4>
                      <p className="text-sm text-gray-600">15 days, 7 hours, 23 minutes</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Active Users</h4>
                      <p className="text-sm text-gray-600">47 users currently online</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
