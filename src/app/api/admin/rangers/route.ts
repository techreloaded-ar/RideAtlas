import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Lista dei ranger e sentinel disponibili (solo per utenti Sentinel)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      )
    }

    const rangers = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.Ranger, UserRole.Sentinel] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ rangers })

  } catch (error) {
    console.error('Errore nel caricamento rangers:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
