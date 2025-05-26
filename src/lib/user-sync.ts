import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

/**
 * Ensures user exists in database, creating it if necessary
 * This is needed because we use JWT strategy for Edge Runtime compatibility
 * but still want to persist user data to database
 */
export async function ensureUserExists(session: Session) {
  if (!session.user?.email) {
    throw new Error("No user email in session")
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  // Create user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
                emailVerified: new Date(), // Since it's from OAuth, consider it verified
      }
    })
  }

  return user
}
