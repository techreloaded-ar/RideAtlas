'use server';

import { prisma } from '@/lib/core/prisma';
import type {
  RangerProfileResult,
  RangerProfile,
  RangerTripSummary,
  SocialLinks,
} from '@/types/ranger';
import { extractThumbnail } from '@/types/ranger';
import { isValidUsername } from '@/lib/utils/validation';

/**
 * Get Ranger profile and published trips
 *
 * CRITICAL: Email is EXPLICITLY EXCLUDED (FR-008)
 *
 * @param username - Ranger name from URL
 * @returns RangerProfileResult with success/error discriminated union
 */
export async function getRangerProfile(
  username: string
): Promise<RangerProfileResult> {
  // 1. Validate input
  if (!isValidUsername(username)) {
    return {
      success: false,
      error: {
        type: 'NOT_FOUND',
        message: 'Ranger non trovato',
      },
    };
  }

  try {
    // 2. Fetch user
    const user = await prisma.user.findFirst({
      where: {
        name: username,
        role: { in: ['Ranger', 'Sentinel'] },
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        socialLinks: true,
        bikeDescription: true,
        bikePhotos: true,
        // ❌ CRITICAL: email, password, emailVerified are EXCLUDED
      },
    });

    // 3. Handle not found
    if (!user) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Ranger non trovato',
        },
      };
    }

    // 4. Fetch trips (only published, max 20, most recent first)
    const trips = await prisma.trip.findMany({
      where: {
        user_id: user.id,
        status: 'Pubblicato',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        media: true,
        duration_days: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc', // Clarification #1: most recent first
      },
      take: 20, // Clarification #3: limit to 20
    });

    // 5. Transform data to application types
    const ranger: RangerProfile = {
      id: user.id,
      name: user.name!,
      image: user.image,
      bio: user.bio,
      socialLinks: user.socialLinks as SocialLinks | null, // Type cast from Prisma Json
      isActive: true, // MVP: always true
      bikeDescription: user.bikeDescription,
      bikePhotos: (user.bikePhotos as unknown as Array<{ url: string; type: string; caption?: string }>) || [],
    };

    const tripsSummary: RangerTripSummary[] = trips.map(trip => ({
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      thumbnailUrl: extractThumbnail(trip.media),
      durationDays: trip.duration_days,
      distanceKm: null, // MVP: always null (distance calculation out of scope)
    }));

    // 6. Return success
    return {
      success: true,
      data: {
        ranger,
        trips: tripsSummary,
        totalTripsCount: trips.length, // MVP: same as trips.length (no pagination yet)
      },
    };
  } catch (error) {
    // Log error for debugging but return generic error to client
    console.error('Error fetching ranger profile:', error);
    return {
      success: false,
      error: {
        type: 'NOT_FOUND',
        message: 'Ranger non trovato',
      },
    };
  }
}
