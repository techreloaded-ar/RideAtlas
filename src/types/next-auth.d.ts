import { UserRole } from '@prisma/client'
import { SocialLinks } from '@/types/user'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
    bio?: string | null
    socialLinks?: SocialLinks | null
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      bio?: string | null
      socialLinks?: SocialLinks | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}
