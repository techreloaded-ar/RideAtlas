// src/lib/geoUtils.ts
import { getLocationCoordinates, isLocationInRegion } from './locationData';

/**
 * Calculate the distance between two points using the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract approximate coordinates from destination string
 */
export function getApproximateCoordinates(destination: string): { lat: number; lng: number } | null {
  return getLocationCoordinates(destination);
}

/**
 * Calculate distance between two trips based on their destinations
 */
export function calculateTripDistance(
  trip1Destination: string,
  trip2Destination: string
): number | null {
  const coords1 = getApproximateCoordinates(trip1Destination);
  const coords2 = getApproximateCoordinates(trip2Destination);
  
  if (!coords1 || !coords2) {
    return null;
  }
  
  return calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
}

/**
 * Check if distance between trips exceeds the warning threshold
 */
export function shouldWarnAboutDistance(distance: number | null, threshold: number = 30): boolean {
  return distance !== null && distance > threshold;
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}

/**
 * Check if a destination is within a specific Italian region
 */
export function isDestinationInRegion(destination: string, region: string): boolean {
  const destinationLower = destination.toLowerCase();
  const regionLower = region.toLowerCase();

  // Direct region name match
  if (destinationLower.includes(regionLower)) {
    return true;
  }

  // Use the centralized location data
  return isLocationInRegion(destination, region);
}

/**
 * Calculate distance from a destination to a region center
 */
export function calculateDistanceToRegion(destination: string, region: string): number | null {
  const regionCoords = getApproximateCoordinates(region);
  const destCoords = getApproximateCoordinates(destination);

  if (!regionCoords || !destCoords) {
    return null;
  }

  return calculateDistance(regionCoords.lat, regionCoords.lng, destCoords.lat, destCoords.lng);
}