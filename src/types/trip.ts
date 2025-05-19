// src/types/trip.ts

// Rimozione dalla definizione Trip
export interface Trip {
  id: string;
  title: string;
  summary: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  // difficulty rimosso
  tags: string[];
  theme: string;
  recommended_season: 'Primavera' | 'Estate' | 'Autunno' | 'Inverno' | 'Tutte';
  slug: string; // generated automatically
  status: 'Bozza' | 'Pronto per revisione' | 'Pubblicato' | 'Archiviato';
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  user_id: string; // ID dell'utente (ranger) che ha creato il viaggio
  // Campi opzionali che potrebbero essere aggiunti in seguito (US 4.1, 4.5)
  // gpx_track_url?: string;
  // photos?: { url: string; caption?: string }[];
  // videos?: { url: string; caption?: string }[];
  // pois?: { latitude: number; longitude: number; name: string; description?: string }[];
}

export type TripCreationData = Omit<Trip, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at' | 'user_id'>;

export type TripUpdateData = Partial<TripCreationData> & {
  status?: Trip['status'];
};