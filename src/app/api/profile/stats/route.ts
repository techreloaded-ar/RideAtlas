import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { TripStatus, type Prisma } from '@prisma/client';
import { castToGpxFile } from '@/types/trip';

interface ProfileStats {
  tripsCreated: number;
  totalKilometers: number;
  memberSince: string;
  user: {
    id: string;
    name: string | null;
    bio: string | null;
    email: string;
    socialLinks: Prisma.JsonValue; // JSON field from Prisma
  };
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Conta i viaggi creati dall'utente (solo quelli pubblicati)
    const tripsCreated = await prisma.trip.count({
      where: {
        user_id: userId,
        status: TripStatus.Pubblicato
      }
    });

    // 2. Calcola i km dai viaggi creati dall'utente
    const userTrips = await prisma.trip.findMany({
      where: {
        user_id: userId,
        status: TripStatus.Pubblicato
      },
      select: {
        gpxFile: true
      }
    });

    let kmFromUserTrips = 0;
    for (const trip of userTrips) {
      const gpxFile = castToGpxFile(trip.gpxFile);
      if (gpxFile && gpxFile.distance) {
        kmFromUserTrips += gpxFile.distance;
      }
    }

    // 3. Calcola i km dai viaggi acquistati dall'utente
    const purchasedTrips = await prisma.tripPurchase.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED'
      },
      include: {
        trip: {
          select: {
            gpxFile: true
          }
        }
      }
    });

    let kmFromPurchasedTrips = 0;
    for (const purchase of purchasedTrips) {
      const gpxFile = castToGpxFile(purchase.trip.gpxFile);
      if (gpxFile && gpxFile.distance) {
        kmFromPurchasedTrips += gpxFile.distance;
      }
    }

    const totalKilometers = Math.round((kmFromUserTrips + kmFromPurchasedTrips) * 100) / 100;

    // 4. Recupera la data di registrazione dell'utente e i social links
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        createdAt: true,
        socialLinks: true,
        name: true,
        bio: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const stats: ProfileStats = {
      tripsCreated,
      totalKilometers,
      memberSince: user.createdAt.toISOString(),
      user: {
        id: userId,
        name: user.name,
        bio: user.bio,
        email: user.email,
        socialLinks: user.socialLinks
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Errore nel recupero delle statistiche profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}