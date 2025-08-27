/**
 * Utility functions for trip status management
 * Centralizes color schemes and labels for trip status badges
 */

export type TripStatusType = 'Bozza' | 'Pronto_per_revisione' | 'Pubblicato' | 'Archiviato';

/**
 * Gets the Tailwind CSS classes for trip status badge coloring
 */
export function getTripStatusColor(status: TripStatusType | string): string {
  switch (status) {
    case 'Bozza':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pronto_per_revisione':
      return 'bg-blue-100 text-blue-800';
    case 'Pubblicato':
      return 'bg-green-100 text-green-800';
    case 'Archiviato':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Gets the human-readable label for trip status
 */
export function getTripStatusLabel(status: TripStatusType | string): string {
  switch (status) {
    case 'Bozza':
      return 'Bozza';
    case 'Pronto_per_revisione':
      return 'Pronto per revisione';
    case 'Pubblicato':
      return 'Pubblicato';
    case 'Archiviato':
      return 'Archiviato';
    default:
      return status;
  }
}

/**
 * Determines if a trip status should show a badge
 * Currently, published trips don't show badges in public views
 */
export function shouldShowStatusBadge(status: TripStatusType | string, isPublicView: boolean = true): boolean {
  if (isPublicView && status === 'Pubblicato') {
    return false;
  }
  return true;
}