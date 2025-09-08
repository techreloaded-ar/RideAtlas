/**
 * Trip Access Control Utilities
 * 
 * Centralizes the logic for determining user access to trips based on
 * trip status, user role, and ownership.
 */

import { TripStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/core/prisma'

/**
 * Result of a trip access check
 */
export interface TripAccessResult {
  hasAccess: boolean
  reason?: 'draft-unauthorized' | 'not-found' | 'not-authenticated' | 'session-invalid' | 'database-error'
}

/**
 * Minimal trip data needed for access control
 */
export interface TripAccessData {
  id: string
  status: TripStatus
  user_id: string
}

/**
 * Check if a user has access to a specific trip
 * 
 * @param trip - Trip data with status and owner information
 * @param session - Current user session (can be null for unauthenticated users)
 * @returns Promise<TripAccessResult> - Access result with reason if denied
 */
export async function checkTripAccess(
  trip: TripAccessData,
  session: Session | null
): Promise<TripAccessResult> {
  try {
    // Validate trip data
    if (!trip || !trip.id || !trip.status || !trip.user_id) {
      console.error('Invalid trip data provided to checkTripAccess:', trip)
      return {
        hasAccess: false,
        reason: 'not-found'
      }
    }

    // If user is not authenticated
    if (!session?.user?.id) {
      // Log unauthorized access attempt for draft trips
      if (requiresAccessControl(trip.status)) {
        console.warn(`Unauthorized access attempt to draft trip ${trip.id} by unauthenticated user`)
      }
      return {
        hasAccess: false,
        reason: 'not-authenticated'
      }
    }

    // Validate session data
    if (!session.user.role) {
      console.error(`Invalid session data - missing role for user ${session.user.id}`)
      return {
        hasAccess: false,
        reason: 'session-invalid'
      }
    }

    // If trip is published, everyone with valid session can access
    if (trip.status === TripStatus.Pubblicato) {
      return {
        hasAccess: true
      }
    }

    // For draft trips, check ownership and role
    if (trip.status === TripStatus.Bozza) {
      const isOwner = session.user.id === trip.user_id
      const isSentinel = session.user.role === UserRole.Sentinel

      if (isOwner || isSentinel) {
        return {
          hasAccess: true
        }
      }

      // Log unauthorized access attempt
      console.warn(`Unauthorized access attempt to draft trip ${trip.id} by user ${session.user.id} (${session.user.role})`)
      return {
        hasAccess: false,
        reason: 'draft-unauthorized'
      }
    }

    // For other statuses (Pronto_per_revisione, Archiviato), apply same logic as draft
    // Only owner and sentinel can access
    const isOwner = session.user.id === trip.user_id
    const isSentinel = session.user.role === UserRole.Sentinel

    if (isOwner || isSentinel) {
      return {
        hasAccess: true
      }
    }

    // Log unauthorized access attempt
    console.warn(`Unauthorized access attempt to ${trip.status} trip ${trip.id} by user ${session.user.id} (${session.user.role})`)
    return {
      hasAccess: false,
      reason: 'draft-unauthorized'
    }
  } catch (error) {
    console.error('Unexpected error in checkTripAccess:', error)
    return {
      hasAccess: false,
      reason: 'database-error'
    }
  }
}

/**
 * Check trip access by slug, fetching trip data from database
 * 
 * @param slug - Trip slug
 * @param session - Current user session
 * @returns Promise<TripAccessResult> - Access result with reason if denied
 */
export async function checkTripAccessBySlug(
  slug: string,
  session: Session | null
): Promise<TripAccessResult> {
  try {
    // Validate input
    if (!slug || typeof slug !== 'string') {
      console.error('Invalid slug provided to checkTripAccessBySlug:', slug)
      return {
        hasAccess: false,
        reason: 'not-found'
      }
    }

    const trip = await prisma.trip.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        user_id: true
      }
    })

    if (!trip) {
      console.info(`Trip not found for slug: ${slug}`)
      return {
        hasAccess: false,
        reason: 'not-found'
      }
    }

    return checkTripAccess(trip, session)
  } catch (error) {
    console.error('Database error checking trip access by slug:', error, { slug })
    return {
      hasAccess: false,
      reason: 'database-error'
    }
  }
}

/**
 * Check trip access by ID, fetching trip data from database
 * 
 * @param tripId - Trip ID
 * @param session - Current user session
 * @returns Promise<TripAccessResult> - Access result with reason if denied
 */
export async function checkTripAccessById(
  tripId: string,
  session: Session | null
): Promise<TripAccessResult> {
  try {
    // Validate input
    if (!tripId || typeof tripId !== 'string') {
      console.error('Invalid tripId provided to checkTripAccessById:', tripId)
      return {
        hasAccess: false,
        reason: 'not-found'
      }
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        status: true,
        user_id: true
      }
    })

    if (!trip) {
      console.info(`Trip not found for ID: ${tripId}`)
      return {
        hasAccess: false,
        reason: 'not-found'
      }
    }

    return checkTripAccess(trip, session)
  } catch (error) {
    console.error('Database error checking trip access by ID:', error, { tripId })
    return {
      hasAccess: false,
      reason: 'database-error'
    }
  }
}

/**
 * Utility function to determine if a trip requires access control
 * (i.e., only owner and sentinel can access it)
 * 
 * @param status - Trip status
 * @returns boolean - True if trip requires access control
 */
export function requiresAccessControl(status: TripStatus): boolean {
  return status === TripStatus.Bozza || 
         status === TripStatus.Pronto_per_revisione || 
         status === TripStatus.Archiviato
}

/**
 * Utility function to check if user can edit a trip
 * (same logic as access control but more semantic)
 * 
 * @param trip - Trip data
 * @param session - Current user session
 * @returns boolean - True if user can edit the trip
 */
export function canEditTrip(
  trip: TripAccessData,
  session: Session | null
): boolean {
  if (!session?.user?.id) {
    return false
  }

  const isOwner = session.user.id === trip.user_id
  const isSentinel = session.user.role === UserRole.Sentinel

  return isOwner || isSentinel
}