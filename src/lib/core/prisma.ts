// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Dichiara globale per evitare multiple istanze in sviluppo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
