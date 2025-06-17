// src/lib/geoUtils.ts

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
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
 * This is a simplified approach - in a real implementation you might use
 * a geocoding service or maintain a database of known locations
 */
export function getApproximateCoordinates(destination: string): { lat: number; lng: number } | null {
  const destinationLower = destination.toLowerCase();
  
  // Italian regions and major cities with approximate coordinates
  const locationMap: Record<string, { lat: number; lng: number }> = {
    // Major cities
    'roma': { lat: 41.9028, lng: 12.4964 },
    'milano': { lat: 45.4642, lng: 9.1900 },
    'napoli': { lat: 40.8518, lng: 14.2681 },
    'torino': { lat: 45.0703, lng: 7.6869 },
    'firenze': { lat: 43.7696, lng: 11.2558 },
    'bologna': { lat: 44.4949, lng: 11.3426 },
    'venezia': { lat: 45.4408, lng: 12.3155 },
    'genova': { lat: 44.4056, lng: 8.9463 },
    'palermo': { lat: 38.1157, lng: 13.3615 },
    'bari': { lat: 41.1171, lng: 16.8719 },
    
    // Regions
    'toscana': { lat: 43.7711, lng: 11.2486 },
    'umbria': { lat: 43.1122, lng: 12.3888 },
    'lazio': { lat: 41.8719, lng: 12.5674 },
    'campania': { lat: 40.8333, lng: 14.2500 },
    'sicilia': { lat: 37.5999, lng: 14.0153 },
    'sardegna': { lat: 40.1209, lng: 9.0129 },
    'calabria': { lat: 38.9072, lng: 16.5947 },
    'puglia': { lat: 41.1253, lng: 16.8619 },
    'basilicata': { lat: 40.6386, lng: 15.8059 },
    'abruzzo': { lat: 42.3498, lng: 13.3995 },
    'molise': { lat: 41.5586, lng: 14.6650 },
    'marche': { lat: 43.6158, lng: 13.5189 },
    'emilia-romagna': { lat: 44.4949, lng: 11.3426 },
    'veneto': { lat: 45.4408, lng: 12.3155 },
    'friuli-venezia giulia': { lat: 45.6494, lng: 13.7768 },
    'trentino-alto adige': { lat: 46.0748, lng: 11.1217 },
    'lombardia': { lat: 45.4642, lng: 9.1900 },
    'piemonte': { lat: 45.0703, lng: 7.6869 },
    'liguria': { lat: 44.4056, lng: 8.9463 },
    'valle d\'aosta': { lat: 45.7383, lng: 7.3514 },
    
    // Popular motorcycle destinations
    'dolomiti': { lat: 46.4102, lng: 11.8440 },
    'stelvio': { lat: 46.5281, lng: 10.4520 },
    'garda': { lat: 45.6389, lng: 10.7217 },
    'cinque terre': { lat: 44.1169, lng: 9.7297 },
    'amalfi': { lat: 40.6340, lng: 14.6026 },
    'etna': { lat: 37.7510, lng: 14.9934 },
    'vesuvio': { lat: 40.8210, lng: 14.4290 },
    'gran sasso': { lat: 42.4546, lng: 13.5635 },
    'appennini': { lat: 43.0000, lng: 13.0000 },
    'alpi': { lat: 46.0000, lng: 8.0000 },
  };
  
  // Try to find a match in the destination string
  for (const [location, coords] of Object.entries(locationMap)) {
    if (destinationLower.includes(location)) {
      return coords;
    }
  }
  
  return null;
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
