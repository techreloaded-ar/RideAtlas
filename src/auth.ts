import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { UserRole } from "@/types/profile"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Validate input
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
            })
            .safeParse(credentials)

          if (!parsedCredentials.success) {
            return null
          }

          const { email, password } = parsedCredentials.data

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
              emailVerified: true,
              role: true,
            }
          })

          if (!user) {
            return null
          }

          // Se l'utente non ha password, deve impostarla
          if (user.password === null) {
            throw new Error("PasswordSetupRequired")
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("EmailNotVerified")
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          if (error instanceof Error) {
            if (error.message === "EmailNotVerified" || error.message === "PasswordSetupRequired") {
              throw error
            }
          }
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT strategy for Edge Runtime compatibility
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  },
  events: {
    linkAccount: async ({ user, account }) => {
      // Quando viene collegato un account Google, verifica automaticamente l'email
      if (account.provider === 'google') {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }
    },
  },
  callbacks: {
    signIn: async ({ user, account }) => {
      // Se è un login Google, verifica automaticamente l'email per nuovi utenti e esistenti
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, emailVerified: true }
        })
        
        if (existingUser && !existingUser.emailVerified) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() }
          })
        }
      }
      
      return true
    },
    jwt: async ({ token, account, profile, user }) => {
      // Persist the OAuth account data to the token right after signin
      if (account && profile) {
        token.id = profile.sub
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture
      }
      
      // If user data is available from database, use it
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      
      // Se non abbiamo ancora il ruolo, lo recuperiamo dal database
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true }
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      
      return token
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
        },
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/auth-error",
  },
  debug: process.env.NODE_ENV === 'development',
  trustHost: true, // Required for NextAuth.js v5
})
