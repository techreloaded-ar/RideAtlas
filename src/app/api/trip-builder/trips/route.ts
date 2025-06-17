// src/app/api/trip-builder/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { castToGpxFile } from '@/types/trip';

export const dynamic = 'force-dynamic';

interface TripForAI {
  id: string;
  title: string;
  summary: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  tags: string[];
  theme: string;
  characteristics: string[];
  recommended_seasons: string[];
  insights?: string;
  slug: string;
  gpxData?: {
    hasGpx: boolean;
    distance?: number;
    elevationGain?: number;
    waypoints?: number;
    startPoint?: { lat: number; lng: number };
    endPoint?: { lat: number; lng: number };
  };
}

// GET - Fetch all published trips with GPX data for AI analysis
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Fetching trips for AI chatbot analysis');

    // Fetch all published trips with GPX data
    const trips = await prisma.trip.findMany({
      where: {
        status: 'Pubblicato'
      },
      select: {
        id: true,
        title: true,
        summary: true,
        destination: true,
        duration_days: true,
        duration_nights: true,
        tags: true,
        theme: true,
        characteristics: true,
        recommended_seasons: true,
        insights: true,
        slug: true,
        gpxFile: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Process trips for AI consumption
    const tripsForAI: TripForAI[] = trips.map(trip => {
      const gpxFile = castToGpxFile(trip.gpxFile);
      
      const processedTrip: TripForAI = {
        id: trip.id,
        title: trip.title,
        summary: trip.summary,
        destination: trip.destination,
        duration_days: trip.duration_days,
        duration_nights: trip.duration_nights,
        tags: trip.tags,
        theme: trip.theme,
        characteristics: trip.characteristics,
        recommended_seasons: trip.recommended_seasons,
        insights: trip.insights || undefined,
        slug: trip.slug,
      };

      // Add GPX data if available
      if (gpxFile && gpxFile.isValid) {
        processedTrip.gpxData = {
          hasGpx: true,
          distance: gpxFile.distance,
          elevationGain: gpxFile.elevationGain,
          waypoints: gpxFile.waypoints,
        };

        // Extract start and end points from GPX if available
        // Note: This is a simplified approach. In a real implementation,
        // you might want to parse the actual GPX file to get precise coordinates
        if (gpxFile.url) {
          // For now, we'll indicate that GPX data exists
          // The actual coordinate extraction would require parsing the GPX file
          processedTrip.gpxData.startPoint = undefined;
          processedTrip.gpxData.endPoint = undefined;
        }
      } else {
        processedTrip.gpxData = {
          hasGpx: false,
        };
      }

      return processedTrip;
    });

    console.log(`Returning ${tripsForAI.length} trips for AI analysis`);

    return NextResponse.json({
      trips: tripsForAI,
      total: tripsForAI.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching trips for AI:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
