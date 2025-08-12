// src/lib/gpx-processing.ts
// Pure functions for GPX data processing - easily testable!

import { GPXParseResult } from '@/lib/gpx/gpx-utils';
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx';

export interface ProcessedGPXData {
  allPoints: GPXPoint[];
  tracks: GPXRoute[];
  routes: GPXRoute[];
  waypoints: GPXWaypoint[];
}

export interface GPXMetadata {
  totalPoints: number;
  totalWaypoints: number;
  totalRoutes: number;
  totalTracks: number;
  hasElevation: boolean;
}

/**
 * Pure function to process parsed GPX data into structured format
 * @param parsedData - Raw GPX parse result
 * @returns Processed GPX data ready for consumption
 */
export function processGPXData(parsedData: GPXParseResult): ProcessedGPXData {
  if (!parsedData || !parsedData.tracks || parsedData.tracks.length === 0) {
    throw new Error('Il file GPX non contiene tracciati validi');
  }

  // Extract all points from all tracks
  const allPoints: GPXPoint[] = [];
  const gpxTracks: GPXRoute[] = [];
  
  parsedData.tracks.forEach((track, index) => {
    const trackPoints: GPXPoint[] = track.points.map(point => ({
      lat: point.lat,
      lng: point.lng,
      elevation: point.elevation
    }));
    
    // Add track to separate tracks list - use real name from GPX
    gpxTracks.push({
      name: track.name || `Traccia ${index + 1}`,
      points: trackPoints,
      color: index === 0 ? '#3b82f6' : `hsl(${(index * 60) % 360}, 70%, 50%)`
    });
    
    // Add points to total list for backward compatibility
    allPoints.push(...trackPoints);
  });

  if (allPoints.length === 0) {
    throw new Error('Nessun punto trovato nel tracciato GPX');
  }

  // Extract waypoints
  const gpxWaypoints: GPXWaypoint[] = parsedData.waypoints.map(wp => ({
    lat: wp.lat,
    lng: wp.lng,
    name: wp.name,
    elevation: wp.elevation
  }));

  // Extract routes
  const gpxRoutes: GPXRoute[] = parsedData.routes.map(route => ({
    name: route.name,
    points: route.points.map(point => ({
      lat: point.lat,
      lng: point.lng,
      elevation: point.elevation
    }))
  }));

  return {
    allPoints,
    tracks: gpxTracks,
    routes: gpxRoutes,
    waypoints: gpxWaypoints
  };
}

/**
 * Pure function to calculate metadata from processed GPX data
 * @param data - Processed GPX data
 * @returns Metadata about the GPX data
 */
export function createGPXMetadata(data: ProcessedGPXData): GPXMetadata {
  return {
    totalPoints: data.allPoints.length,
    totalWaypoints: data.waypoints.length,
    totalRoutes: data.routes.length,
    totalTracks: data.tracks.length,
    hasElevation: data.allPoints.some(point => point.elevation !== undefined)
  };
}

/**
 * Pure function to fetch GPX content from URL
 * @param blobUrl - URL to fetch GPX content from
 * @returns GPX content as string
 */
export async function fetchGPXFromUrl(blobUrl: string): Promise<string> {
  const response = await fetch(`/api/gpx/preview?url=${encodeURIComponent(blobUrl)}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Errore nel caricamento del file GPX');
  }
  
  return response.text();
}

/**
 * Pure function to read GPX content from file
 * @param file - File to read
 * @returns GPX content as string
 */
export async function readGPXFromFile(file: File): Promise<string> {
  return file.text();
}