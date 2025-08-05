import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface TripAccessInfo {
  canAccess: boolean;
  isOwner: boolean;
  hasPurchased: boolean;
  price: number;
  reason?: string;
  message?: string;
}

interface UseTripAccessReturn {
  accessInfo: TripAccessInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTripAccess(tripId: string | null): UseTripAccessReturn {
  const { data: session, status } = useSession();
  const [accessInfo, setAccessInfo] = useState<TripAccessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessInfo = useCallback(async () => {
    if (!tripId) {
      setAccessInfo(null);
      return;
    }

    if (status === 'loading') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 [useTripAccess] Fetching access info for trip: ${tripId}`);
      const response = await fetch(`/api/trips/${tripId}/access`);
      
      console.log(`🔍 [useTripAccess] Response status: ${response.status}`);
      console.log(`🔍 [useTripAccess] Response content-type: ${response.headers.get('content-type')}`);
      
      // Verifica che la risposta sia JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ [useTripAccess] Risposta non JSON ricevuta:', contentType);
        const textResponse = await response.text();
        console.error('❌ [useTripAccess] Contenuto risposta HTML:', textResponse.substring(0, 200));
        throw new Error(`Server ha restituito HTML invece di JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log(`🔍 [useTripAccess] Utente non autenticato`);
          setAccessInfo({
            canAccess: false,
            isOwner: false,
            hasPurchased: false,
            price: 0,
            reason: 'authentication_required',
            message: 'È necessario effettuare il login'
          });
          return;
        }
        
        // Tenta di parsare l'errore JSON
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('❌ [useTripAccess] Non riesco a parsare errore JSON:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ [useTripAccess] Dati ricevuti:`, data);
      
      // Validazione base dei dati ricevuti
      if (typeof data.canAccess !== 'boolean') {
        throw new Error('Formato dati ricevuti non valido: manca canAccess');
      }
      
      setAccessInfo(data);

    } catch (err) {
      console.error('❌ [useTripAccess] Errore nel controllo accesso:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setAccessInfo(null);
    } finally {
      setLoading(false);
    }
  }, [tripId, status]);

  useEffect(() => {
    fetchAccessInfo();
  }, [tripId, status, session?.user?.id, fetchAccessInfo]);

  return {
    accessInfo,
    loading,
    error,
    refetch: fetchAccessInfo
  };
}

export function usePurchaseStatus(tripId: string | null) {
  const { data: session, status } = useSession();
  const [purchaseInfo, setPurchaseInfo] = useState<{
    purchased: boolean;
    isOwner: boolean;
    price: number;
    purchase?: unknown;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseStatus = useCallback(async () => {
    if (!tripId || status === 'loading') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/purchase`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setPurchaseInfo({
            purchased: false,
            isOwner: false,
            price: 0
          });
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPurchaseInfo(data);

    } catch (err) {
      console.error('Errore nel controllo acquisto:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setPurchaseInfo(null);
    } finally {
      setLoading(false);
    }
  }, [tripId, status]);

  useEffect(() => {
    fetchPurchaseStatus();
  }, [tripId, status, session?.user?.id, fetchPurchaseStatus]);

  return {
    purchaseInfo,
    loading,
    error,
    refetch: fetchPurchaseStatus
  };
}