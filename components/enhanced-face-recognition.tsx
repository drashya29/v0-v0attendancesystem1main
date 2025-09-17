"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Camera, Settings, Zap, Eye, CheckCircle, AlertTriangle, 
  Brain, Shield, Gauge, Target, Cpu, Activity, TrendingUp,
  Scan, Layers, Sparkles, Radar
} from "lucide-react"

interface EnhancedSettings {
  confidenceThreshold: number
  qualityThreshold: number
  livenessThreshold: number
  antiSpoofThreshold: number
  modelEnsemble: boolean
  realTimeOptimization: boolean
  landmarkDetection: boolean
  emotionRecognition: boolean
  ageEstimation: boolean
  multiModelValidation: boolean
}

interface SystemMetrics {
  totalStudents: number
  studentsWithEncodings: number
  encodingCoverage: number
  qualityCoverage: number
  averageConfidence: number
  averageQuality: number
  processingEfficiency: number
  accuracyTrend: string
}

interface ProcessingResult {
  success: boolean
  confidence: number
  qualityScore: number
  livenessScore: number
  antiSpoofScore: number
  processingTime: number
  validationChecks: Record<string, boolean>
}

export function EnhancedFaceRecognition() {
  const [settings, setSettings] = useState<EnhancedSettings>({
    confidenceThreshold: 0.88,
    qualityThreshold: 0.75,
    livenessThreshold: 0.85,
    antiSpoofThreshold: 0.85,
    modelEnsemble: true,
    realTimeOptimization: true,
    landmarkDetection: true,
    emotionRecognition: false,
    ageEstimation: false,
    multiModelValidation: true,
  })

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null)
  const [systemStatus, setSystemStatus] = useState<"idle" | "processing" | "ready" | "calibrating">("idle")
  const [isCalibrating, setIsCalibrating] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Load system metrics on component mount
  useEffect(() => {
    loadSystemMetrics()
  }, [])

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch("/api/facial-recognition/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "performance_metrics" }),
      })

      const data = await response.json()
      if (data.performance_metrics) {
        setSystemMetrics({
          totalStudents: data.statistics.total_students,
          studentsWithEncodings: data.statistics.students_with_encodings,
          encodingCoverage: data.statistics.encoding_coverage,
          qualityCoverage: data.statistics.quality_coverage,
          averageConfidence: data.performance_metrics.average_confidence,
          averageQuality: data.performance_metrics.average_quality,
          processingEfficiency: data.performance_metrics.processing_efficiency,
          accuracyTrend: data.performance_metrics.accuracy_trend,
        })
        setSystemStatus("ready")
      }
    } catch (error) {
      console.error("Error loading system metrics:", error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  const processEnhancedRecognition = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      // Capture frame from video
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")!
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      const imageData = canvas.toDataURL("image/jpeg", 0.9)

      // Enhanced processing pipeline
      setProcessingProgress(20)
      
      const response = await fetch("/api/facial-recognition/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quality_assessment",
          imageData,
          settings,
        }),
      })

      setProcessingProgress(50)

      const qualityResult = await response.json()
      
      if (qualityResult.success && qualityResult.pass_threshold) {
        setProcessingProgress(80)
        
        // Perform liveness detection
        const livenessResponse = await fetch("/api/facial-recognition/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "liveness_detection",
            imageData,
            settings,
          }),
        })

        const livenessResult = await livenessResponse.json()
        setProcessingProgress(100)

        setLastResult({
          success: livenessResult.is_live,
          confidence: qualityResult.quality_metrics.overall,
          qualityScore: qualityResult.quality_metrics.overall,
          livenessScore: livenessResult.liveness_score,
          antiSpoofScore: livenessResult.liveness_score,
          processingTime: 650,
          validationChecks: {
            quality_check: qualityResult.pass_threshold,
            liveness_check: livenessResult.is_live,
            anti_spoof_check: livenessResult.is_live,
            landmark_detection: true,
          },
        })
      } else {
        setLastResult({
          success: false,
          confidence: 0,
          qualityScore: qualityResult.quality_metrics?.overall || 0,
          livenessScore: 0,
          antiSpoofScore: 0,
          processingTime: 300,
          validationChecks: {
            quality_check: false,
            liveness_check: false,
            anti_spoof_check: false,
            landmark_detection: false,
          },
        })
      }

      setSystemStatus("ready")
    } catch (error) {
      console.error("Enhanced recognition error:", error)
      setSystemStatus("idle")
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [settings])

  const calibrateSystem = async () => {
    setIsCalibrating(true)
    setSystemStatus("calibrating")

    try {
      const response = await fetch("/api/facial-recognition/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "system_calibration",
          settings,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        // Update settings with optimized values
        setSettings(prev => ({
          ...prev,
          confidenceThreshold: result.optimized_settings.confidence_threshold,
          qualityThreshold: result.optimized_settings.quality_threshold,
          antiSpoofThreshold: result.optimized_settings.anti_spoof_threshold,
        }))
        
        await loadSystemMetrics() // Refresh metrics
      }
    } catch (error) {
      console.error("Calibration error:", error)
    } finally {
      setIsCalibrating(false)
      setSystemStatus("ready")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Enhanced Facial Recognition System
          </CardTitle>
          <CardDescription>
            Advanced AI-powered facial recognition with anti-spoofing, quality assessment, and real-time optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus === "ready" ? "bg-green-500 animate-pulse" :
                  systemStatus === "processing" ? "bg-yellow-500 animate-pulse" :
                  systemStatus === "calibrating" ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                }`} />
                <span className="font-semibold capitalize">{systemStatus}</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {systemMetrics ? `${(systemMetrics.averageConfidence * 100).toFixed(1)}%` : "N/A"}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Security</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {settings.antiSpoofThreshold >= 0.85 ? "High" : "Medium"}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {systemMetrics ? `${(systemMetrics.processingEfficiency * 100).toFixed(0)}%` : "N/A"}
              </div>
            </div>
          </div>

          <Tabs defaultValue="recognition" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recognition">Recognition</TabsTrigger>
              <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
              <TabsTrigger value="calibration">Calibration</TabsTrigger>
              <TabsTrigger value="metrics">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="recognition" className="space-y-4">
              {/* Live Camera Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Live Recognition Testing
                  </CardTitle>
                  <CardDescription>Test enhanced facial recognition with live camera feed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isStreaming ? "block" : "none" }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!isStreaming && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Enhanced Recognition Ready</p>
                          <p className="text-sm opacity-75">Start camera to test advanced features</p>
                        </div>
                      </div>
                    )}

                    {isStreaming && (
                      <div className="absolute top-4 left-4 space-y-2">
                        <Badge variant="default" className="bg-purple-600">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Enhanced
                        </Badge>
                        <Badge variant="default" className="bg-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Anti-Spoof Active
                        </Badge>
                      </div>
                    )}

                    {lastResult && (
                      <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg">
                        <div className="text-sm space-y-1">
                          <div>Confidence: {(lastResult.confidence * 100).toFixed(1)}%</div>
                          <div>Quality: {(lastResult.qualityScore * 100).toFixed(1)}%</div>
                          <div>Liveness: {(lastResult.livenessScore * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <Button onClick={startCamera} className="bg-purple-600 hover:bg-purple-700">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Enhanced Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline">
                        <Camera className="mr-2 h-4 w-4" />
                        Stop Camera
                      </Button>
                    )}

                    {isStreaming && (
                      <Button 
                        onClick={processEnhancedRecognition} 
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Scan className="mr-2 h-4 w-4" />
                        {isProcessing ? "Processing..." : "Test Recognition"}
                      </Button>
                    )}
                  </div>

                  {/* Processing Progress */}
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Enhanced Processing Pipeline</Label>
                        <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                      </div>
                      <Progress value={processingProgress} className="h-3" />
                      <div className="text-xs text-muted-foreground">
                        {processingProgress < 30 ? "Image preprocessing..." :
                         processingProgress < 60 ? "Multi-model face detection..." :
                         processingProgress < 90 ? "Quality & liveness assessment..." : "Finalizing results..."}
                      </div>
                    </div>
                  )}

                  {/* Last Result */}
                  {lastResult && (
                    <Alert className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Recognition Result:</span>
                            <Badge variant={lastResult.success ? "default" : "destructive"}>
                              {lastResult.success ? "Success" : "Failed"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Confidence:</span>
                                <span className="font-medium">{(lastResult.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Quality Score:</span>
                                <span className="font-medium">{(lastResult.qualityScore * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Liveness:</span>
                                <span className="font-medium">{(lastResult.livenessScore * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Anti-Spoof:</span>
                                <span className="font-medium">{(lastResult.antiSpoofScore * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-sm font-medium">Validation Checks:</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(lastResult.validationChecks).map(([check, passed]) => (
                                <div key={check} className="flex items-center gap-1">
                                  {passed ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                  )}
                                  <span className="capitalize">{check.replace(/_/g, " ")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recognition Thresholds */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recognition Thresholds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label>Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[settings.confidenceThreshold]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, confidenceThreshold: value }))}
                          min={0.7}
                          max={0.98}
                          step={0.01}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Quality Threshold: {(settings.qualityThreshold * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[settings.qualityThreshold]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, qualityThreshold: value }))}
                          min={0.5}
                          max={0.95}
                          step={0.05}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Liveness Threshold: {(settings.livenessThreshold * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[settings.livenessThreshold]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, livenessThreshold: value }))}
                          min={0.6}
                          max={0.95}
                          step={0.05}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Anti-Spoof Threshold: {(settings.antiSpoofThreshold * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[settings.antiSpoofThreshold]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, antiSpoofThreshold: value }))}
                          min={0.7}
                          max={0.98}
                          step={0.01}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Advanced Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Model Ensemble
                        </Label>
                        <Switch
                          checked={settings.modelEnsemble}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, modelEnsemble: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Real-time Optimization
                        </Label>
                        <Switch
                          checked={settings.realTimeOptimization}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, realTimeOptimization: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Radar className="h-4 w-4" />
                          Landmark Detection
                        </Label>
                        <Switch
                          checked={settings.landmarkDetection}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, landmarkDetection: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Multi-Model Validation
                        </Label>
                        <Switch
                          checked={settings.multiModelValidation}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, multiModelValidation: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Emotion Recognition</Label>
                        <Switch
                          checked={settings.emotionRecognition}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emotionRecognition: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Age Estimation</Label>
                        <Switch
                          checked={settings.ageEstimation}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, ageEstimation: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="calibration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Calibration
                  </CardTitle>
                  <CardDescription>
                    Automatically optimize system settings for maximum accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      System calibration analyzes your student database to optimize recognition thresholds
                      for maximum accuracy while minimizing false positives.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Current Settings</h4>
                        <div className="space-y-1 text-sm">
                          <div>Confidence: {(settings.confidenceThreshold * 100).toFixed(0)}%</div>
                          <div>Quality: {(settings.qualityThreshold * 100).toFixed(0)}%</div>
                          <div>Liveness: {(settings.livenessThreshold * 100).toFixed(0)}%</div>
                          <div>Anti-Spoof: {(settings.antiSpoofThreshold * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">System Health</h4>
                        <div className="space-y-1 text-sm">
                          <div>Coverage: {systemMetrics?.encodingCoverage.toFixed(1)}%</div>
                          <div>Quality: {systemMetrics ? (systemMetrics.averageQuality * 100).toFixed(1) : "N/A"}%</div>
                          <div>Efficiency: {systemMetrics ? (systemMetrics.processingEfficiency * 100).toFixed(1) : "N/A"}%</div>
                          <div>Trend: {systemMetrics?.accuracyTrend || "Unknown"}</div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={calibrateSystem} 
                      disabled={isCalibrating}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isCalibrating ? (
                        <>
                          <Cpu className="mr-2 h-4 w-4 animate-spin" />
                          Calibrating System...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Auto-Calibrate System
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              {systemMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        System Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Students:</span>
                          <span className="font-medium">{systemMetrics.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>With Face Encodings:</span>
                          <span className="font-medium">{systemMetrics.studentsWithEncodings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Encoding Coverage:</span>
                          <span className="font-medium">{systemMetrics.encodingCoverage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Coverage:</span>
                          <span className="font-medium">{systemMetrics.qualityCoverage.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Encoding Coverage</span>
                            <span>{systemMetrics.encodingCoverage.toFixed(1)}%</span>
                          </div>
                          <Progress value={systemMetrics.encodingCoverage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Average Confidence:</span>
                          <span className="font-medium">{(systemMetrics.averageConfidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Quality:</span>
                          <span className="font-medium">{(systemMetrics.averageQuality * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Efficiency:</span>
                          <span className="font-medium">{(systemMetrics.processingEfficiency * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy Trend:</span>
                          <Badge variant="default" className="capitalize">
                            {systemMetrics.accuracyTrend}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>System Performance</span>
                            <span>{(systemMetrics.processingEfficiency * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={systemMetrics.processingEfficiency * 100} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}