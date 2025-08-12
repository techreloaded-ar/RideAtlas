// src/app/api/trip-builder/trips/route.ts
import { NextResponse } from 'next/server';
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
    elevationLoss?: number;
    waypoints?: number;
    maxElevation?: number;
    minElevation?: number;
    startTime?: string;
    endTime?: string;
    startPoint?: { lat: number; lng: number };
    endPoint?: { lat: number; lng: number };
    keyPoints?: Array<{
      lat: number;
      lng: number;
      elevation?: number;
      distanceFromStart: number;
      type: 'start' | 'intermediate' | 'end';
      description: string;
    }>;
  };
}

// GET - Fetch all published trips with GPX data for AI analysis
export async function GET() {
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
          elevationLoss: gpxFile.elevationLoss,
          waypoints: gpxFile.waypoints,
          maxElevation: gpxFile.maxElevation,
          minElevation: gpxFile.minElevation,
          startTime: gpxFile.startTime,
          endTime: gpxFile.endTime,
        };

        // Add key points if available (geographic coordinates every 30km)
        if (gpxFile.keyPoints && gpxFile.keyPoints.length > 0) {
          processedTrip.gpxData.keyPoints = gpxFile.keyPoints;

          // Extract start and end points from keyPoints for easy access
          const startPoint = gpxFile.keyPoints.find(p => p.type === 'start');
          const endPoint = gpxFile.keyPoints.find(p => p.type === 'end');

          if (startPoint) {
            processedTrip.gpxData.startPoint = { lat: startPoint.lat, lng: startPoint.lng };
          }
          if (endPoint) {
            processedTrip.gpxData.endPoint = { lat: endPoint.lat, lng: endPoint.lng };
          }

          console.log(`✅ Added ${gpxFile.keyPoints.length} keyPoints to trip "${trip.title}" for AI`);
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
