// src/lib/trip-access.ts
// Pure functions for trip access logic - easily testable!

export interface TripAccessInfo {
  canAccess: boolean;
  isOwner: boolean;
  hasPurchased: boolean;
  price: number;
  reason?: string;
  message?: string;
}

export interface PurchaseInfo {
  purchased: boolean;
  isOwner: boolean;
  price: number;
  purchase?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pure function to validate JSON response content type
 * @param response - Fetch response object
 * @returns true if content type is JSON
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  return !!(contentType && contentType.includes('application/json'));
}

/**
 * Pure function to handle non-JSON response errors
 * @param response - Fetch response object
 * @returns Error with descriptive message
 */
export async function handleNonJsonResponse(response: Response): Promise<Error> {
  const contentType = response.headers.get('content-type');
  const textResponse = await response.text();
  
  console.error('❌ [TripAccess] Risposta non JSON ricevuta:', contentType);
  console.error('❌ [TripAccess] Contenuto risposta HTML:', textResponse.substring(0, 200));
  
  return new Error(`Server ha restituito HTML invece di JSON. Status: ${response.status}`);
}

/**
 * Pure function to create default access info for unauthenticated users
 * @returns Default TripAccessInfo for non-authenticated users
 */
export function createUnauthenticatedAccessInfo(): TripAccessInfo {
  return {
    canAccess: false,
    isOwner: false,
    hasPurchased: false,
    price: 0,
    reason: 'authentication_required',
    message: 'È necessario effettuare il login'
  };
}

/**
 * Pure function to create default purchase info for unauthenticated users
 * @returns Default PurchaseInfo for non-authenticated users
 */
export function createUnauthenticatedPurchaseInfo(): PurchaseInfo {
  return {
    purchased: false,
    isOwner: false,
    price: 0
  };
}

/**
 * Pure function to validate trip access data structure
 * @param data - Raw data from API
 * @returns true if data has required fields
 */
export function validateTripAccessData(data: unknown): data is TripAccessInfo {
  return typeof data === 'object' && 
         data !== null && 
         typeof (data as TripAccessInfo).canAccess === 'boolean';
}

/**
 * Pure function to parse API error response
 * @param response - Failed response object
 * @returns Error message string
 */
export async function parseApiErrorResponse(response: Response): Promise<string> {
  let errorMessage = `HTTP error! status: ${response.status}`;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorMessage;
  } catch (parseError) {
    console.warn('❌ [TripAccess] Non riesco a parsare errore JSON:', parseError);
  }
  
  return errorMessage;
}

/**
 * Pure function to fetch trip access information from API
 * @param tripId - Trip ID to check access for
 * @returns Promise with access information or error
 */
export async function fetchTripAccessFromApi(tripId: string): Promise<ApiResponse<TripAccessInfo>> {
  try {
    console.log(`🔍 [TripAccess] Fetching access info for trip: ${tripId}`);
    const response = await fetch(`/api/trips/${tripId}/access`);
    
    console.log(`🔍 [TripAccess] Response status: ${response.status}`);
    console.log(`🔍 [TripAccess] Response content-type: ${response.headers.get('content-type')}`);
    
    // Check if response is JSON
    if (!isJsonResponse(response)) {
      const error = await handleNonJsonResponse(response);
      return { success: false, error: error.message };
    }
    
    // Handle 401 specially - return default access info
    if (response.status === 401) {
      console.log(`🔍 [TripAccess] Utente non autenticato`);
      return { 
        success: true, 
        data: createUnauthenticatedAccessInfo() 
      };
    }
    
    if (!response.ok) {
      const errorMessage = await parseApiErrorResponse(response);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    console.log(`✅ [TripAccess] Dati ricevuti:`, data);
    
    // Validate received data
    if (!validateTripAccessData(data)) {
      return { 
        success: false, 
        error: 'Formato dati ricevuti non valido: manca canAccess' 
      };
    }
    
    return { success: true, data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('❌ [TripAccess] Errore nel controllo accesso:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Pure function to fetch purchase status from API
 * @param tripId - Trip ID to check purchase status for
 * @returns Promise with purchase information or error
 */
export async function fetchPurchaseStatusFromApi(tripId: string): Promise<ApiResponse<PurchaseInfo>> {
  try {
    const response = await fetch(`/api/trips/${tripId}/purchase`);
    
    // Handle 401 specially - return default purchase info
    if (response.status === 401) {
      return { 
        success: true, 
        data: createUnauthenticatedPurchaseInfo() 
      };
    }
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP error! status: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('❌ [TripAccess] Errore nel controllo acquisto:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Pure function to determine if access fetch should be skipped
 * @param tripId - Trip ID (can be null)
 * @param sessionStatus - NextAuth session status
 * @returns true if fetch should be skipped
 */
export function shouldSkipAccessFetch(
  tripId: string | null,
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
): boolean {
  // Skip se non c'è tripId, se la sessione sta caricando,
  // o se l'utente non è autenticato (il frontend sa già che non ha accesso)
  return !tripId || sessionStatus === 'loading' || sessionStatus === 'unauthenticated';
}