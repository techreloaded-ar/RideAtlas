// src/lib/trip-submission.ts
// Pure functions for trip submission logic - easily testable!

import { UseFormSetError } from 'react-hook-form';
import type { TripWithStagesData } from '@/schemas/trip';
import { serverErrorSchema } from '@/schemas/trip';

export interface TransformedTripData {
  title: string;
  summary: string;
  destination: string;
  theme: string;
  characteristics: string[];
  recommended_seasons: string[];
  tags: string[];
  media: unknown[];
  gpxFile: unknown;
  travelDate: Date | null;
  stages: TransformedStage[];
}

export interface TransformedStage {
  id?: string;
  title: string;
  description: string;
  routeType: string;
  duration: string;
  media: unknown[];
  gpxFile: unknown;
  orderIndex: number;
}

export interface ParsedServerErrors {
  fieldErrors: Record<string, string>;
  generalError: string | null;
}

export interface ApiSubmissionOptions {
  mode: 'create' | 'edit';
  tripId?: string;
}

/**
 * Pure function to transform form data into API-compatible format
 * @param data - Form data from React Hook Form
 * @returns Transformed data ready for API submission
 */
export function transformTripDataForSubmission(data: TripWithStagesData): TransformedTripData {
  return {
    ...data,
    travelDate: data.travelDate || null,
    // Transform stages to API format
    stages: data.stages.map((stage) => ({
      id: (stage.id as string) || undefined,
      title: stage.title,
      description: stage.description || '',
      routeType: stage.routeType || 'road',
      duration: stage.duration || '',
      media: stage.media || [],
      gpxFile: stage.gpxFile || null,
      orderIndex: stage.orderIndex,
    }))
  };
}

/**
 * Pure function to build API URL based on submission mode
 * @param options - Submission options
 * @returns API URL for the request
 */
export function buildApiUrl(options: ApiSubmissionOptions): string {
  return options.mode === 'create' 
    ? '/api/trips' 
    : `/api/trips/${options.tripId}`;
}

/**
 * Pure function to get HTTP method based on submission mode
 * @param mode - Submission mode
 * @returns HTTP method string
 */
export function getHttpMethod(mode: 'create' | 'edit'): 'POST' | 'PUT' {
  return mode === 'create' ? 'POST' : 'PUT';
}

/**
 * Pure function to parse server errors into structured format
 * @param result - Raw server response
 * @param mode - Submission mode for contextual error messages
 * @returns Parsed errors ready for React Hook Form
 */
export function parseServerErrors(
  result: unknown, 
  mode: 'create' | 'edit'
): ParsedServerErrors {
  const serverError = serverErrorSchema.safeParse(result);
  
  if (serverError.success && serverError.data.details) {
    // Parse field-specific errors
    const fieldErrors: Record<string, string> = {};
    
    Object.entries(serverError.data.details).forEach(([fieldName, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[fieldName] = messages[0]; // Take first error message
      }
    });
    
    return {
      fieldErrors,
      generalError: null
    };
  }
  
  // Fallback to general error
  const errorMessage = (result as Record<string, unknown>)?.error as string || 
    `Errore durante ${mode === 'create' ? 'la creazione' : 'l\'aggiornamento'} del viaggio`;
  
  return {
    fieldErrors: {},
    generalError: errorMessage
  };
}

/**
 * Pure function to handle HTTP error status codes
 * @param status - HTTP status code
 * @returns Appropriate error message
 */
export function handleHttpErrorStatus(status: number): string {
  switch (status) {
    case 404:
      return 'Viaggio non trovato';
    case 403:
      return 'Non hai i permessi per modificare questo viaggio';
    default:
      return 'Errore nel caricamento del viaggio';
  }
}

/**
 * Pure function to transform API trip data into form-compatible format
 * @param tripData - Raw trip data from API
 * @returns Form data ready for React Hook Form
 */
export function transformApiDataToFormData(tripData: Record<string, unknown>): TripWithStagesData {
  // Gestione della data del viaggio - converte da stringa ISO a Date object
  let travelDate: Date | null = null;
  if (tripData.travelDate) {
    if (typeof tripData.travelDate === 'string') {
      travelDate = new Date(tripData.travelDate);
    } else if (tripData.travelDate instanceof Date) {
      travelDate = tripData.travelDate;
    }
  }

  return {
    title: (tripData.title as string) || '',
    summary: (tripData.summary as string) || '',
    destination: (tripData.destination as string) || '',
    theme: (tripData.theme as string) || '',
    characteristics: (tripData.characteristics as TripWithStagesData['characteristics']) || [],
    recommended_seasons: (tripData.recommended_seasons as TripWithStagesData['recommended_seasons']) || [],
    tags: (tripData.tags as string[]) || [],
    media: (tripData.media as TripWithStagesData['media']) || [],
    gpxFile: (tripData.gpxFile as TripWithStagesData['gpxFile']) || null,
    travelDate: travelDate,
    stages: ((tripData.stages as Record<string, unknown>[]) || []).map((stage) => ({
      id: (stage.id as string) || undefined,
      orderIndex: (stage.orderIndex as number) || 0,
      title: (stage.title as string) || '',
      description: (stage.description as string) || '',
      routeType: (stage.routeType as string) || 'road',
      duration: (stage.duration as string) || '',
      media: (stage.media as TripWithStagesData['media']) || [],
      gpxFile: (stage.gpxFile as TripWithStagesData['gpxFile']) || null,
    }))
  };
}

/**
 * Pure function to create form field error setter compatible with React Hook Form
 * @param setError - The setError function from React Hook Form
 * @returns Function that can be used to set errors on form fields
 */
export function createFieldErrorSetter(
  setError: UseFormSetError<TripWithStagesData>
) {
  return (fieldErrors: Record<string, string>) => {
    Object.entries(fieldErrors).forEach(([fieldName, message]) => {
      // Use type assertion to work with React Hook Form's complex path types
      // This is safe because we're setting errors from server validation
      (setError as (name: string, error: { type: string; message: string }) => void)(fieldName, {
        type: 'server',
        message
      });
    });
  };
}

/**
 * Pure function to submit trip data to API
 * @param url - API endpoint URL
 * @param method - HTTP method
 * @param data - Transformed trip data
 * @returns Promise with response data
 */
export async function submitTripToApi(
  url: string,
  method: 'POST' | 'PUT',
  data: TransformedTripData
): Promise<{ success: boolean; result: unknown; response: Response }> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  return {
    success: response.ok,
    result,
    response
  };
}

/**
 * Pure function to fetch trip data from API
 * @param tripId - Trip ID to fetch
 * @returns Promise with trip data or error
 */
export async function fetchTripFromApi(tripId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const response = await fetch(`/api/trips/${tripId}`);
  
  if (!response.ok) {
    const error = handleHttpErrorStatus(response.status);
    return { success: false, error };
  }
  
  const data = await response.json();
  return { success: true, data };
}