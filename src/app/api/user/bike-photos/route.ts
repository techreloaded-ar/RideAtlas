import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { generateTempMediaId, castToMediaItems } from '@/lib/utils/media';
import type { MediaItem } from '@/types/profile';
import { Prisma } from '@prisma/client';

const MAX_PHOTOS = 10;

// Rate limiting tracker (in-memory, future: Redis)
// Export for testing purposes
export const uploadLimitTracker = new Map<string, { count: number; resetAt: Date }>();

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // 2. Check Ranger role
    if (session.user.role !== 'Ranger') {
      return NextResponse.json(
        { error: 'Solo gli utenti Ranger possono caricare foto moto' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // 3. Rate limiting check
    const userLimits = uploadLimitTracker.get(userId);
    const now = new Date();

    if (userLimits && userLimits.resetAt > now) {
      if (userLimits.count >= 10) {
        return NextResponse.json(
          { error: 'Limite upload raggiunto. Riprova tra qualche minuto.' },
          { status: 429 }
        );
      }
      userLimits.count++;
    } else {
      // Reset counter (10 minutes window)
      uploadLimitTracker.set(userId, {
        count: 1,
        resetAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    }

    // 4. Parse JSON body (expects URL from /api/upload)
    const body = await request.json();
    const { url, type, caption } = body;

    if (!url || !type) {
      return NextResponse.json({ error: 'URL e tipo sono obbligatori' }, { status: 400 });
    }

    // 5. Validate type
    if (type !== 'image') {
      return NextResponse.json(
        { error: 'Solo immagini sono supportate' },
        { status: 400 }
      );
    }

    // 6. Check photo limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bikePhotos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const currentPhotos = castToMediaItems(user.bikePhotos);
    if (currentPhotos.length >= MAX_PHOTOS) {
      return NextResponse.json(
        { error: 'Limite 10 foto raggiunto' },
        { status: 400 }
      );
    }

    // 7. Create media item
    const newMedia: MediaItem = {
      id: generateTempMediaId(),
      type: 'image',
      url,
      caption: caption || undefined,
      uploadedAt: new Date().toISOString(),
    };

    // 8. Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        bikePhotos: {
          push: newMedia as unknown as Prisma.InputJsonValue,
        },
      },
    });

    return NextResponse.json(
      { success: true, media: newMedia },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading bike photo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // 2. Check Ranger role
    if (session.user.role !== 'Ranger') {
      return NextResponse.json(
        { error: 'Solo gli utenti Ranger possono eliminare foto moto' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // 3. Get photoId from query params
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'ID foto mancante' },
        { status: 400 }
      );
    }

    // 4. Get current user bikePhotos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bikePhotos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const currentPhotos = castToMediaItems(user.bikePhotos);

    // 5. Find and remove photo with matching id
    const photoToDelete = currentPhotos.find(p => p.id === photoId);
    if (!photoToDelete) {
      return NextResponse.json(
        { error: 'Foto non trovata' },
        { status: 404 }
      );
    }

    const updatedPhotos = currentPhotos.filter(p => p.id !== photoId);

    // 6. Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        bikePhotos: updatedPhotos as unknown as Prisma.InputJsonValue[],
      },
    });

    // 7. Optional: Delete file from storage provider
    // Note: We could implement this, but it's not critical for MVP
    // The storage cleanup can be handled by a separate background job

    return NextResponse.json({
      success: true,
      message: 'Foto eliminata con successo',
    });
  } catch (error) {
    console.error('Error deleting bike photo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
