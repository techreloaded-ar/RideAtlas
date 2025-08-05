import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { UserRole } from "@/types/profile"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user?.id
  const userRole = req.auth?.user?.role as UserRole | undefined

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/create-trip', '/api/trips']
  
  // Routes that require Ranger or Sentinel role
  const rangerRoutes = ['/create-trip', '/api/trips']
  
  // Routes that require Sentinel role
  const sentinelRoutes = ['/admin', '/api/admin']
  
  // Check if this is an API endpoint that handles its own auth
  const isCustomAuthApiEndpoint = (
    nextUrl.pathname.match(/^\/api\/trips\/[^\/]+\/access$/) ||  // /api/trips/{id}/access
    nextUrl.pathname.match(/^\/api\/trips\/[^\/]+\/purchase$/) ||  // /api/trips/{id}/purchase
    nextUrl.pathname.match(/^\/api\/trips\/[^\/]+\/gpx$/) ||  // /api/trips/{id}/gpx
    nextUrl.pathname.startsWith('/api/payments/') ||
    nextUrl.pathname.startsWith('/api/user/purchases')
  )
  
  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  ) && !isCustomAuthApiEndpoint  // Exclude custom auth endpoints
  
  const isRangerRoute = rangerRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  ) && !isCustomAuthApiEndpoint  // Exclude custom auth endpoints
  
  const isSentinelRoute = sentinelRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // Redirect to signin if trying to access protected route while not logged in
  // or if user doesn't have a valid role
  if (isProtectedRoute && (!isLoggedIn || !userRole)) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  // Check role-based permissions
  if (isLoggedIn && userRole) {
    // Redirect if trying to access Ranger routes without proper role
    if (isRangerRoute && userRole === UserRole.Explorer) {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', nextUrl))
    }
    
    // Redirect if trying to access Sentinel routes without proper role
    if (isSentinelRoute && userRole !== UserRole.Sentinel) {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', nextUrl))
    }
  }

  // Redirect to dashboard if trying to access signin while logged in
  if (nextUrl.pathname === '/auth/signin' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}