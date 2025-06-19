// src/lib/trip-utils.ts
// Shared utilities for trip operations

/**
 * Prepare update payload for media and gpxFile fields
 * Unified logic for both creation and update operations
 */
export function prepareJsonFieldsUpdate(data: {
  media?: unknown;
  gpxFile?: unknown;
}): Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {};
  
  // Add media if present
  if (data.media !== undefined) {
    updatePayload.media = data.media;
  }
  
  // Add gpxFile if present (null is a valid value for removal)
  if (data.gpxFile !== undefined) {
    updatePayload.gpxFile = data.gpxFile;
  }
  
  return updatePayload;
}
