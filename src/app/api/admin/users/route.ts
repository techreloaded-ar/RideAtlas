import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Schema di validazione per la creazione di un nuovo utente da parte del Sentinel
const createUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.Explorer),
  sendWelcomeEmail: z.boolean().optional().default(true),
})

// GET - Lista tutti gli utenti (solo per Sentinel)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') as UserRole | null

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        roleFilter ? { role: roleFilter } : {}
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Errore nel recupero utenti:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// POST - Crea un nuovo utente (solo per Sentinel)
export async function POST(request: NextRequest) {
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
    const result = createUserSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: result.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { name, email, password, role, sendWelcomeEmail } = result.data

    // Controlla se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 409 }
      )
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Genera token di verifica se richiesto l'invio email
    let verificationToken: string | undefined
    let tokenExpiry: Date | undefined
    
    if (sendWelcomeEmail) {
      verificationToken = randomBytes(32).toString('hex')
      tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ore
    }

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        // Se non inviamo email di benvenuto, marca come verificato
        emailVerified: sendWelcomeEmail ? null : new Date(),
      },
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
      },
    })

    // Salva il token di verifica se necessario
    if (sendWelcomeEmail && verificationToken && tokenExpiry) {
      await prisma.emailVerificationToken.create({
        data: {
          email,
          token: verificationToken,
          expiresAt: tokenExpiry,
        }
      })

      // Invia email di verifica
      const emailResult = await sendVerificationEmail(email, verificationToken)
      
      if (!emailResult.success) {
        // Se l'invio dell'email fallisce, elimina l'utente e il token creati
        await prisma.user.delete({ where: { id: user.id } })
        await prisma.emailVerificationToken.deleteMany({ where: { email } })
        
        return NextResponse.json(
          { error: 'Errore nell\'invio dell\'email di verifica. Riprova più tardi.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: `Utente creato con successo${sendWelcomeEmail ? '. Email di verifica inviata.' : '.'}`,
        user,
        requiresVerification: sendWelcomeEmail,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Errore durante la creazione dell\'utente:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
