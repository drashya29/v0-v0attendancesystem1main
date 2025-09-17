import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AttendanceTracker</h1>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {params?.error ? (
                <p className="text-sm text-muted-foreground mb-6">Error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  An authentication error occurred. Please try again.
                </p>
              )}
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
