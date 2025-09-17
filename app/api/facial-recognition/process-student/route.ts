import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { studentId, imageData } = await request.json()

    if (!studentId || !imageData) {
      return NextResponse.json({ error: "Student ID and image data are required" }, { status: 400 })
    }

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    console.log("[v0] Processing face encoding for student:", studentId)

    // Simulate face encoding extraction (in real implementation, this would call Python service)
    const faceEncoding = await extractFaceEncoding(imageData)

    if (!faceEncoding) {
      return NextResponse.json(
        { error: "No face detected in the image. Please ensure the photo shows a clear face." },
        { status: 400 },
      )
    }

    // Update student with face encoding
    const { data: student, error: updateError } = await supabase
      .from("students")
      .update({
        face_encoding: faceEncoding,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating student face encoding:", updateError)
      return NextResponse.json({ error: "Failed to save face encoding" }, { status: 500 })
    }

    console.log("[v0] Successfully processed face encoding for student:", student.name)

    return NextResponse.json({
      success: true,
      message: `Face encoding generated for ${student.name}`,
      student: {
        id: student.id,
        name: student.name,
        student_id: student.student_id,
      },
    })
  } catch (error) {
    console.error("[v0] Face processing error:", error)
    return NextResponse.json({ error: "Internal server error during face processing" }, { status: 500 })
  }
}

async function extractFaceEncoding(imageData: string): Promise<number[] | null> {
  try {
    console.log("[v0] Starting real face detection on student image")

    // Convert base64 image to canvas for processing
    return new Promise((resolve) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(null)
          return
        }

        // Set canvas size
        canvas.width = img.width
        canvas.height = img.height

        // Draw image to canvas
        ctx.drawImage(img, 0, 0)

        // Get image data for processing
        const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Detect face and extract features
        const faceEncoding = detectAndEncodeFace(imageDataCanvas)

        if (faceEncoding) {
          console.log("[v0] Face detected and encoded successfully")
          resolve(faceEncoding)
        } else {
          console.log("[v0] No face detected in student image")
          resolve(null)
        }
      }

      img.onerror = () => {
        console.error("[v0] Error loading student image for face detection")
        resolve(null)
      }

      img.src = imageData
    })
  } catch (error) {
    console.error("[v0] Error extracting face encoding:", error)
    return null
  }
}

function detectAndEncodeFace(imageData: ImageData): number[] | null {
  const { data, width, height } = imageData

  // Convert to grayscale for better face detection
  const grayscale = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    grayscale[i / 4] = gray
  }

  // Detect face region using pattern matching
  const faceRegion = findFaceRegion(grayscale, width, height)

  if (!faceRegion) {
    console.log("[v0] No face region detected")
    return null
  }

  console.log("[v0] Face region detected at:", faceRegion)

  // Extract facial features from detected region
  const features = extractFaceFeatures(grayscale, faceRegion, width)

  return features
}

function findFaceRegion(
  grayscale: Uint8Array,
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } | null {
  const minFaceSize = Math.min(width, height) * 0.15
  const maxFaceSize = Math.min(width, height) * 0.9

  // Scan for face-like regions
  for (let size = minFaceSize; size <= maxFaceSize; size += 15) {
    for (let y = 0; y <= height - size; y += 10) {
      for (let x = 0; x <= width - size; x += 10) {
        const score = calculateFaceScore(grayscale, x, y, size, width)
        if (score > 0.6) {
          // Face detection threshold
          return { x, y, w: size, h: size }
        }
      }
    }
  }

  return null
}

function calculateFaceScore(grayscale: Uint8Array, x: number, y: number, size: number, width: number): number {
  // Define key facial feature positions (relative to face region)
  const eyeY = y + size * 0.35
  const noseY = y + size * 0.55
  const mouthY = y + size * 0.75

  const leftEyeX = x + size * 0.3
  const rightEyeX = x + size * 0.7
  const noseX = x + size * 0.5

  // Sample intensities at key points
  const leftEye = getPixel(grayscale, leftEyeX, eyeY, width)
  const rightEye = getPixel(grayscale, rightEyeX, eyeY, width)
  const nose = getPixel(grayscale, noseX, noseY, width)
  const mouth = getPixel(grayscale, noseX, mouthY, width)

  // Calculate surrounding area averages for comparison
  const leftEyeArea = getAreaAverage(grayscale, leftEyeX - 10, eyeY - 10, 20, 20, width)
  const rightEyeArea = getAreaAverage(grayscale, rightEyeX - 10, eyeY - 10, 20, 20, width)

  // Face scoring based on typical patterns
  let score = 0

  // Eyes should be darker than surrounding areas
  if (leftEye < leftEyeArea - 20) score += 0.2
  if (rightEye < rightEyeArea - 20) score += 0.2

  // Eyes should be similar intensity
  if (Math.abs(leftEye - rightEye) < 30) score += 0.2

  // Overall intensity should be in face range
  const avgIntensity = (leftEye + rightEye + nose + mouth) / 4
  if (avgIntensity > 60 && avgIntensity < 180) score += 0.3

  // Symmetry check
  const symmetryScore = 1 - Math.abs(leftEye - rightEye) / 255
  score += symmetryScore * 0.1

  return score
}

function extractFaceFeatures(
  grayscale: Uint8Array,
  faceRegion: { x: number; y: number; w: number; h: number },
  width: number,
): number[] {
  const features: number[] = []
  const { x, y, w, h } = faceRegion

  // Extract features using Local Binary Pattern (LBP) approach
  const gridSize = 8
  const cellWidth = w / gridSize
  const cellHeight = h / gridSize

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellX = x + col * cellWidth
      const cellY = y + row * cellHeight

      // Calculate LBP histogram for this cell
      const lbpFeature = calculateLBPFeature(grayscale, cellX, cellY, cellWidth, cellHeight, width)
      features.push(lbpFeature)
    }
  }

  // Add additional geometric features
  const geometricFeatures = extractGeometricFeatures(faceRegion)
  features.push(...geometricFeatures)

  // Normalize and pad to 128 dimensions
  const normalized = normalizeFeatures(features)
  while (normalized.length < 128) {
    normalized.push(0)
  }

  return normalized.slice(0, 128)
}

function getPixel(grayscale: Uint8Array, x: number, y: number, width: number): number {
  const index = Math.floor(y) * width + Math.floor(x)
  return index >= 0 && index < grayscale.length ? grayscale[index] : 0
}

function getAreaAverage(grayscale: Uint8Array, x: number, y: number, w: number, h: number, width: number): number {
  let sum = 0
  let count = 0

  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      if (px >= 0 && px < width && py >= 0) {
        sum += getPixel(grayscale, px, py, width)
        count++
      }
    }
  }

  return count > 0 ? sum / count : 0
}

function calculateLBPFeature(grayscale: Uint8Array, x: number, y: number, w: number, h: number, width: number): number {
  let feature = 0
  let count = 0

  // Sample points in the cell and calculate local binary pattern
  for (let py = y; py < y + h; py += 2) {
    for (let px = x; px < x + w; px += 2) {
      const center = getPixel(grayscale, px, py, width)
      const neighbors = [
        getPixel(grayscale, px - 1, py - 1, width),
        getPixel(grayscale, px, py - 1, width),
        getPixel(grayscale, px + 1, py - 1, width),
        getPixel(grayscale, px + 1, py, width),
      ]

      let lbp = 0
      for (let i = 0; i < neighbors.length; i++) {
        if (neighbors[i] >= center) {
          lbp |= 1 << i
        }
      }

      feature += lbp
      count++
    }
  }

  return count > 0 ? feature / count : 0
}

function extractGeometricFeatures(faceRegion: { x: number; y: number; w: number; h: number }): number[] {
  const { x, y, w, h } = faceRegion

  // Basic geometric ratios and positions
  return [
    w / h, // Aspect ratio
    x / w, // Relative x position
    y / h, // Relative y position
    (w * h) / 10000, // Normalized area
  ]
}

function normalizeFeatures(features: number[]): number[] {
  if (features.length === 0) return []

  const max = Math.max(...features)
  const min = Math.min(...features)
  const range = max - min

  if (range === 0) return features.map(() => 0)

  return features.map((f) => (f - min) / range)
}
