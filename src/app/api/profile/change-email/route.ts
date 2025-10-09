import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { changeEmailSchema } from '@/schemas/profile';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmailChangeVerification } from '@/lib/core/email';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = changeEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { newEmail, password } = validation.data;

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true
      },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Utente non valido o password non impostata' },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password non corretta' },
        { status: 401 }
      );
    }

    // Check if email is the same as current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'La nuova email è uguale a quella attuale' },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già in uso da un altro account' },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to database
    await prisma.emailChangeToken.create({
      data: {
        userId: session.user.id,
        oldEmail: user.email,
        newEmail,
        token,
        expiresAt,
      },
    });

    // Send verification email to new address
    await sendEmailChangeVerification(newEmail, token);

    return NextResponse.json({
      success: true,
      message: 'Email di verifica inviata. Controlla la tua nuova email.',
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Error changing email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
