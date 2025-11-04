import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { z } from 'zod'
import { sendRoleChangeNotificationEmail } from '@/lib/core/email'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole),
})

// PATCH - Aggiorna il ruolo di un utente (solo per Sentinel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json()
    const result = updateUserSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { role } = result.data
    const { id: userId } = await params

    // Non permettere di modificare il proprio ruolo
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Non puoi modificare il tuo stesso ruolo' },
        { status: 400 }
      )
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Aggiorna il ruolo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    // Invia email di notifica se il ruolo è effettivamente cambiato
    if (existingUser.role !== role && updatedUser.email) {
      try {
        await sendRoleChangeNotificationEmail(
          updatedUser.email,
          updatedUser.name || 'Utente',
          role,
          session.user.name || 'Amministratore'
        );
      } catch (emailError) {
        console.error('❌ Errore nell\'invio email di notifica ruolo:', emailError);
        // Non blocchiamo l'operazione anche se l'email fallisce
      }
    }

    return NextResponse.json({
      message: 'Ruolo utente aggiornato con successo',
      user: updatedUser
    })

  } catch (error) {
    console.error('Errore nell\'aggiornamento ruolo utente:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// GET - Ottieni dettagli di un singolo utente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        bio: true,
        _count: {
          select: {
            trips: true
          }
        },
        trips: {
          select: {
            id: true,
            title: true,
            status: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Errore nel recupero dettagli utente:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina un utente (solo per Sentinel)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    // Non permettere di eliminare il proprio account
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo stesso account' },
        { status: 400 }
      )
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Verifica se è l'ultimo Sentinel nel sistema
    if (existingUser.role === UserRole.Sentinel) {
      const sentinelCount = await prisma.user.count({
        where: { role: UserRole.Sentinel }
      })
      
      if (sentinelCount <= 1) {
        return NextResponse.json(
          { error: 'Non puoi eliminare l\'ultimo Sentinel del sistema' },
          { status: 400 }
        )
      }
    }

    // Elimina l'utente e tutti i dati correlati
    // Prima elimina i viaggi associati
    await prisma.trip.deleteMany({
      where: { user_id: userId }
    })

    // Poi elimina account e sessioni
    await prisma.account.deleteMany({
      where: { userId }
    })

    await prisma.session.deleteMany({
      where: { userId }
    })

    // Infine elimina l'utente
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'Utente eliminato con successo',
      deletedUser: {
        id: existingUser.id,
        email: existingUser.email,
        tripsDeleted: existingUser._count.trips
      }
    })

  } catch (error) {
    console.error('Errore nell\'eliminazione utente:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
