import { useState, useCallback, useRef } from 'react';
import { Trip } from '@/types/trip';
import { TripReorderRequest, TripReorderResponse } from '@/types/api/trips';

export interface UseTripReorderReturn {
  reorderedTrips: Trip[];
  hasChanges: boolean;
  isLoading: boolean;
  error: string | null;
  handleReorder: (newOrder: Trip[]) => void;
  saveOrder: () => Promise<void>;
  resetOrder: () => void;
}

export function useTripReorder(initialTrips: Trip[]): UseTripReorderReturn {
  const [reorderedTrips, setReorderedTrips] = useState<Trip[]>(initialTrips);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manteniamo un riferimento all'ordine originale per confronti e reset
  const originalTripsRef = useRef<Trip[]>(initialTrips);
  
  // Aggiorna il riferimento quando cambiano i trip iniziali
  const updateInitialTrips = useCallback((trips: Trip[]) => {
    originalTripsRef.current = trips;
    setReorderedTrips(trips);
    setError(null);
  }, []);

  // Verifica se ci sono modifiche rispetto all'ordine originale
  const hasChanges = useCallback(() => {
    if (reorderedTrips.length !== originalTripsRef.current.length) {
      return true;
    }
    
    return reorderedTrips.some((trip, index) => 
      trip.id !== originalTripsRef.current[index]?.id
    );
  }, [reorderedTrips]);

  // Handler per il riordinamento drag-and-drop
  const handleReorder = useCallback((newOrder: Trip[]) => {
    setReorderedTrips(newOrder);
    setError(null); // Pulisce eventuali errori precedenti
  }, []);

  // Salva il nuovo ordine tramite API
  const saveOrder = useCallback(async () => {
    if (!hasChanges()) {
      return; // Nessuna modifica da salvare
    }

    setIsLoading(true);
    setError(null);

    try {
      const tripIds = reorderedTrips.map(trip => trip.id);
      
      const requestBody: TripReorderRequest = {
        tripIds
      };

      const response = await fetch('/api/admin/trips/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: TripReorderResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Errore HTTP: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Operazione fallita');
      }

      // Aggiorna il riferimento originale con il nuovo ordine salvato
      originalTripsRef.current = [...reorderedTrips];
      
      console.log(`Ordinamento salvato con successo: ${data.updatedCount} viaggi aggiornati`);

    } catch (err) {
      console.error('Errore durante il salvataggio dell\'ordinamento:', err);
      
      let errorMessage = 'Errore sconosciuto durante il salvataggio';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Errore di connessione. Verifica la tua connessione internet e riprova.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Non hai i permessi per eseguire questa operazione.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Ripristina l'ordine originale in caso di errore
      setReorderedTrips([...originalTripsRef.current]);
      
      throw err; // Re-throw per permettere al componente di gestire l'errore
    } finally {
      setIsLoading(false);
    }
  }, [reorderedTrips, hasChanges]);

  // Reset all'ordine originale
  const resetOrder = useCallback(() => {
    setReorderedTrips([...originalTripsRef.current]);
    setError(null);
  }, []);

  // Aggiorna i trip iniziali quando cambiano (per refresh esterni)
  if (initialTrips !== originalTripsRef.current && 
      JSON.stringify(initialTrips.map(t => t.id)) !== JSON.stringify(originalTripsRef.current.map(t => t.id))) {
    updateInitialTrips(initialTrips);
  }

  return {
    reorderedTrips,
    hasChanges: hasChanges(),
    isLoading,
    error,
    handleReorder,
    saveOrder,
    resetOrder,
  };
}