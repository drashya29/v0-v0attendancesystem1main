import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes, and auth pages
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // For protected routes, let the client-side AuthGuard handle authentication
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
