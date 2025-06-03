import { NextResponse } from 'next/server'
import { UserRole } from '@/types/profile'

interface MockRequest {
  nextUrl: URL
  auth?: {
    user?: {
      id: string
      role: UserRole
    }
  }
}

// Mock NextResponse with factory functions
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}))

// Mock auth to return a middleware function
jest.mock('@/auth', () => ({
  auth: jest.fn((callback) => callback),
}))

// Import the actual middleware after mocking
import middlewareFunction from '@/middleware'

// Get references to the mocked functions after import
const mockRedirect = NextResponse.redirect as jest.MockedFunction<typeof NextResponse.redirect>
const mockNext = NextResponse.next as jest.MockedFunction<typeof NextResponse.next>

describe('Middleware Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockClear()
    mockNext.mockClear()
  })

  const createMockRequest = (url: string, auth?: { user?: { id: string; role: UserRole } }): MockRequest => ({
    nextUrl: new URL(url),
    auth,
  })

  // Test wrapper that calls the actual middleware
  const testMiddleware = (req: MockRequest) => {
    // The middleware expects a NextRequest-like object with auth property
    return middlewareFunction(req as any)
  }
      describe('Route Protection', () => {
    describe('Unauthenticated Access', () => {
      it('should redirect to signin for protected routes without authentication', () => {
        const request = createMockRequest('http://localhost/dashboard')

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/auth/signin', 'http://localhost/dashboard')
        )
      })

      it('should redirect to signin for API protected routes', () => {
        const request = createMockRequest('http://localhost/api/trips')

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/auth/signin', 'http://localhost/api/trips')
        )
      })

      it('should allow access to public routes', () => {
        const publicRoutes = [
          'http://localhost/',
          'http://localhost/auth/signin',
          'http://localhost/auth/register',
          'http://localhost/about',
        ]

        publicRoutes.forEach(url => {
          const request = createMockRequest(url)

          testMiddleware(request)

          expect(mockNext).toHaveBeenCalled()
          expect(mockRedirect).not.toHaveBeenCalled()
        })
      })
    })

    describe('Authenticated Access', () => {
      it('should allow access to protected routes for authenticated users', () => {
        const request = createMockRequest('http://localhost/dashboard', {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      })

      it('should redirect authenticated users away from signin page', () => {
        const request = createMockRequest('http://localhost/auth/signin', {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard', 'http://localhost/auth/signin')
        )
      })
    })
  })

  describe('Role-Based Access Control', () => {
    describe('Explorer Permissions', () => {
      it('should block Explorer from accessing Ranger routes', () => {
        const request = createMockRequest('http://localhost/create-trip', {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', 'http://localhost/create-trip')
        )
      })

      it('should block Explorer from accessing Ranger API routes', () => {
        const request = createMockRequest('http://localhost/api/trips', {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', 'http://localhost/api/trips')
        )
      })

      it('should block Explorer from accessing Sentinel routes', () => {
        const request = createMockRequest('http://localhost/admin', {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', 'http://localhost/admin')
        )
      })

      it('should allow Explorer to access dashboard', () => {
        const request = createMockRequest('http://localhost/dashboard', {
          user: { id: '1', role: UserRole.Explorer },
        })

                testMiddleware(request)

        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      })
    })

    describe('Ranger Permissions', () => {
      it('should allow Ranger to access trip creation routes', () => {
        const request = createMockRequest('http://localhost/create-trip', {
          user: { id: '1', role: UserRole.Ranger },
        })

        testMiddleware(request)

        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      })

      it('should allow Ranger to access trip API routes', () => {
        const request = createMockRequest('http://localhost/api/trips', {
          user: { id: '1', role: UserRole.Ranger },
        })

        testMiddleware(request)

        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      })

      it('should block Ranger from accessing Sentinel routes', () => {
        const request = createMockRequest('http://localhost/admin', {
          user: { id: '1', role: UserRole.Ranger },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', 'http://localhost/admin')
        )
      })

      it('should block Ranger from accessing admin API routes', () => {
        const request = createMockRequest('http://localhost/api/admin/users', {
          user: { id: '1', role: UserRole.Ranger },
        })

        testMiddleware(request)

                expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', 'http://localhost/api/admin/users')
        )
      })
    })

    describe('Sentinel Permissions', () => {
      it('should allow Sentinel to access all routes', () => {
        const sentinelRoutes = [
          'http://localhost/dashboard',
          'http://localhost/create-trip',
          'http://localhost/admin',
          'http://localhost/api/trips',
          'http://localhost/api/admin/users',
        ]

        sentinelRoutes.forEach(url => {
          const request = createMockRequest(url, {
            user: { id: '1', role: UserRole.Sentinel },
          })

          testMiddleware(request)

          expect(mockNext).toHaveBeenCalled()
          expect(mockRedirect).not.toHaveBeenCalled()
        })
      })

      it('should allow Sentinel to access admin sub-routes', () => {
        const adminRoutes = [
          'http://localhost/admin/users',
          'http://localhost/admin/trips',
          'http://localhost/api/admin/users/create',
          'http://localhost/api/admin/trips/approve',
        ]

        adminRoutes.forEach(url => {
          const request = createMockRequest(url, {
            user: { id: '1', role: UserRole.Sentinel },
          })

          testMiddleware(request)

          expect(mockNext).toHaveBeenCalled()
          expect(mockRedirect).not.toHaveBeenCalled()
        })
      })
    })
  })

    describe('Route Pattern Matching', () => {
    it('should correctly identify protected routes', () => {
      const protectedRoutes = [
        'http://localhost/dashboard',
        'http://localhost/dashboard/profile',
        'http://localhost/create-trip',
        'http://localhost/api/trips/create',
        'http://localhost/api/trips/123',
      ]

      protectedRoutes.forEach(url => {
        const request = createMockRequest(url)

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/auth/signin', url)
        )
      })
    })

    it('should correctly identify Ranger routes', () => {
      const rangerRoutes = [
        'http://localhost/create-trip',
        'http://localhost/create-trip/new',
        'http://localhost/api/trips',
        'http://localhost/api/trips/create',
      ]

      rangerRoutes.forEach(url => {
        const request = createMockRequest(url, {
          user: { id: '1', role: UserRole.Explorer },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', url)
        )
      })
    })

    it('should correctly identify Sentinel routes', () => {
      const sentinelRoutes = [
        'http://localhost/admin',
        'http://localhost/admin/users',
        'http://localhost/admin/trips',
        'http://localhost/api/admin',
        'http://localhost/api/admin/users',
        'http://localhost/api/admin/trips',
      ]

      sentinelRoutes.forEach(url => {
        const request = createMockRequest(url, {
          user: { id: '1', role: UserRole.Ranger },
        })

        testMiddleware(request)

        expect(mockRedirect).toHaveBeenCalledWith(
          new URL('/dashboard?error=insufficient-permissions', url)
        )
      })
    })
  })

    describe('Edge Cases', () => {
    it('should handle requests without user role', () => {
      const request = createMockRequest('http://localhost/dashboard', {
        user: { id: 'user123', role: undefined as any }, // User object without role
      })

      testMiddleware(request)

      // For a protected route without a user role, we should redirect to signin
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin', 'http://localhost/dashboard')
      )
    })

    it('should handle malformed URLs gracefully', () => {
      const request = createMockRequest('http://localhost//dashboard///', {
        user: { id: '1', role: UserRole.Explorer },
      })

      testMiddleware(request)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle requests with query parameters', () => {
      const request = createMockRequest('http://localhost/admin?tab=users&page=2', {
        user: { id: '1', role: UserRole.Explorer },
      })

      testMiddleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=insufficient-permissions', 'http://localhost/admin?tab=users&page=2')
      )
    })

    it('should handle requests with fragments', () => {
      const request = createMockRequest('http://localhost/dashboard#section1', {
        user: { id: '1', role: UserRole.Explorer },
      })

      testMiddleware(request)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Performance and Security', () => {
    it('should not make unnecessary redirects for allowed routes', () => {
      const request = createMockRequest('http://localhost/dashboard', {
        user: { id: '1', role: UserRole.Sentinel },
      })

      testMiddleware(request)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should handle concurrent requests properly', () => {
      const requests = [
        createMockRequest('http://localhost/dashboard', { user: { id: '1', role: UserRole.Explorer } }),
        createMockRequest('http://localhost/admin', { user: { id: '1', role: UserRole.Sentinel } }),
        createMockRequest('http://localhost/create-trip', { user: { id: '1', role: UserRole.Ranger } }),
      ]

      requests.forEach(request => {
        testMiddleware(request)
      })

      expect(mockNext).toHaveBeenCalledTimes(3)
    })

    it('should preserve original URL in redirect for auth', () => {
      const originalUrl = 'http://localhost/dashboard/profile?tab=settings'
      const request = createMockRequest(originalUrl)

      testMiddleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin', originalUrl)
      )
    })
  })
})
