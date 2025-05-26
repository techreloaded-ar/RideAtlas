import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  callbacks: {
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
      }
      return token
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
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
