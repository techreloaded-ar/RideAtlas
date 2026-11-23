// Tipi condivisi tra API e UI per recensioni e commenti dei viaggi

export interface ReviewSummary {
  average: number | null; // null quando non ci sono recensioni
  count: number;
}

export interface ReviewSummaryWithDistribution extends ReviewSummary {
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CommunityAuthor {
  id: string;
  name: string;
}

export interface TripReviewItem {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommunityAuthor;
  canDelete: boolean;
}

export interface TripCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
  isTripAuthor: boolean;
  canDelete: boolean;
}

export interface TripReviewsResponse {
  summary: ReviewSummaryWithDistribution;
  reviews: TripReviewItem[];
  viewer: {
    isAuthenticated: boolean;
    canReview: boolean;
    ownReview: { id: string; rating: number; content: string | null } | null;
  };
}

export interface TripCommentsResponse {
  comments: TripCommentItem[];
  total: number;
  nextCursor: string | null;
  viewer: {
    isAuthenticated: boolean;
    canComment: boolean;
  };
}

/** Formatta la media in stile italiano con un decimale: 4.5 → "4,5" */
export function formatAverageRating(average: number): string {
  return average.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
