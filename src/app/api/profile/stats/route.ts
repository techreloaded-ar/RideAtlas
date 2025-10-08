import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { TripStatus, type Prisma } from '@prisma/client';
import { castToGpxFile, type Trip, isMultiStageTrip, transformPrismaStages } from '@/types/trip';
import { UserRole } from '@/types/profile';

interface ProfileStats {
  tripsCreated?: number;
  totalKilometers?: number;
  memberSince: string;
  user: {
    id: string;
    name: string | null;
    bio: string | null;
    email: string;
    socialLinks: Prisma.JsonValue; // JSON field from Prisma
  };
}

/**
 * Calcola la distanza totale di un viaggio.
 * Se il viaggio ha tappe, somma le distanze delle tappe.
 * Altrimenti, usa la distanza del gpxFile principale del viaggio.
 */
function calculateTripDistance(trip: Trip): number {
  // Se il viaggio è multitappa, somma le distanze delle tappe
  if (isMultiStageTrip(trip) && trip.stages) {
    let totalDistance = 0;
    for (const stage of trip.stages) {
      if (stage.gpxFile && stage.gpxFile.distance) {
        totalDistance += stage.gpxFile.distance;
      }
    }
    return totalDistance;
  }

  // Altrimenti usa il gpxFile del viaggio principale
  const gpxFile = castToGpxFile(trip.gpxFile);
  return gpxFile?.distance || 0;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;

    // Recupera la data di registrazione dell'utente e i social links
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

    // Per gli Explorer, restituisci solo le info base senza calcolare statistiche
    if (userRole === UserRole.Explorer) {
      const stats: ProfileStats = {
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
    }

    // Per Ranger e Sentinel, calcola le statistiche complete

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
        gpxFile: true,
        stages: {
          select: {
            id: true,
            tripId: true,
            orderIndex: true,
            title: true,
            description: true,
            routeType: true,
            duration: true,
            media: true,
            gpxFile: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    let kmFromUserTrips = 0;
    for (const prismaTrip of userTrips) {
      // Trasforma i dati Prisma in Trip type
      const trip: Trip = {
        ...prismaTrip,
        stages: transformPrismaStages(prismaTrip.stages)
      } as Trip;

      kmFromUserTrips += calculateTripDistance(trip);
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
            gpxFile: true,
            stages: {
              select: {
                id: true,
                tripId: true,
                orderIndex: true,
                title: true,
                description: true,
                routeType: true,
                duration: true,
                media: true,
                gpxFile: true,
                createdAt: true,
                updatedAt: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      }
    });

    let kmFromPurchasedTrips = 0;
    for (const purchase of purchasedTrips) {
      // Trasforma i dati Prisma in Trip type
      const trip: Trip = {
        ...purchase.trip,
        stages: transformPrismaStages(purchase.trip.stages)
      } as Trip;

      kmFromPurchasedTrips += calculateTripDistance(trip);
    }

    // Converti da metri a chilometri e arrotonda a 2 decimali
    const totalKilometers = Math.round((kmFromUserTrips + kmFromPurchasedTrips) / 1000 * 100) / 100;

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