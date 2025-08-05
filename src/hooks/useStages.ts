// src/hooks/useStages.ts
// Hook per la gestione CRUD delle tappe (stages) con optimistic updates e reordering

import { useState, useCallback, useEffect, useRef } from 'react';
import { Stage, StageCreationData, StageUpdateData } from '@/types/trip';

interface UseStagesProps {
  tripId: string;
  autoFetch?: boolean; // Auto-fetch stages on mount, default true
}

interface UseStagesReturn {
  // Data state
  stages: Stage[];
  isLoading: boolean;
  error: string | null;
  isReordering: boolean;
  
  // CRUD operations
  createStage: (data: StageCreationData) => Promise<Stage | null>;
  updateStage: (stageId: string, data: StageUpdateData) => Promise<Stage | null>;
  deleteStage: (stageId: string) => Promise<boolean>;
  
  // Reordering operations
  reorderStages: (newOrder: Stage[]) => Promise<boolean>;
  
  // Utility operations
  refreshStages: () => Promise<void>;
  clearError: () => void;
  getStageById: (stageId: string) => Stage | undefined;
  getTotalStages: () => number;
}

export function useStages({ tripId, autoFetch = true }: UseStagesProps): UseStagesReturn {
  // State management
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  // Ref per tracking operazioni in corso per evitare race conditions
  const operationRef = useRef<string | null>(null);
  
  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch stages from API
  const fetchStages = useCallback(async (): Promise<Stage[]> => {
    try {
      const response = await fetch(`/api/trips/${tripId}/stages`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore caricamento tappe');
      }
      
      const data = await response.json();
      return data.stages || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      throw new Error(errorMessage);
    }
  }, [tripId]);

  // Refresh stages with loading state
  const refreshStages = useCallback(async () => {
    if (operationRef.current) return; // Avoid concurrent operations
    
    try {
      setIsLoading(true);
      setError(null);
      operationRef.current = 'refresh';
      
      const fetchedStages = await fetchStages();
      setStages(fetchedStages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore caricamento tappe';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      operationRef.current = null;
    }
  }, [fetchStages]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && tripId) {
      refreshStages();
    }
  }, [tripId, autoFetch, refreshStages]);

  // Create stage with optimistic update
  const createStage = useCallback(async (data: StageCreationData): Promise<Stage | null> => {
    if (operationRef.current) return null;
    
    try {
      setError(null);
      operationRef.current = 'create';
      
      // Calcola orderIndex se non specificato
      const finalData = {
        ...data,
        orderIndex: data.orderIndex !== undefined ? data.orderIndex : stages.length
      };
      
      // Optimistic update: aggiungi temporaneamente la stage
      const tempStage: Stage = {
        id: `temp-${Date.now()}`,
        tripId,
        ...finalData,
        media: finalData.media || [],
        gpxFile: finalData.gpxFile || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setStages(prev => [...prev, tempStage].sort((a, b) => a.orderIndex - b.orderIndex));
      
      // API call
      const response = await fetch(`/api/trips/${tripId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore creazione tappa');
      }
      
      const result = await response.json();
      const newStage = result.stage;
      
      // Replace temporary stage with real one
      setStages(prev => prev.map(stage => 
        stage.id === tempStage.id ? newStage : stage
      ));
      
      return newStage;
    } catch (err) {
      // Rollback optimistic update
      setStages(prev => prev.filter(stage => !stage.id.startsWith('temp-')));
      
      const errorMessage = err instanceof Error ? err.message : 'Errore creazione tappa';
      setError(errorMessage);
      return null;
    } finally {
      operationRef.current = null;
    }
  }, [tripId, stages.length]);

  // Update stage with optimistic update
  const updateStage = useCallback(async (stageId: string, data: StageUpdateData): Promise<Stage | null> => {
    if (operationRef.current) return null;
    
    const originalStage = stages.find(stage => stage.id === stageId);
    if (!originalStage) {
      setError('Tappa non trovata');
      return null;
    }
    
    try {
      setError(null);
      operationRef.current = 'update';
      
      // Optimistic update
      const updatedStage: Stage = {
        ...originalStage,
        ...data,
        updatedAt: new Date()
      };
      
      setStages(prev => prev.map(stage => 
        stage.id === stageId ? updatedStage : stage
      ).sort((a, b) => a.orderIndex - b.orderIndex));
      
      // API call
      const response = await fetch(`/api/trips/${tripId}/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore aggiornamento tappa');
      }
      
      const result = await response.json();
      const serverStage = result.stage;
      
      // Update with server response
      setStages(prev => prev.map(stage => 
        stage.id === stageId ? serverStage : stage
      ));
      
      return serverStage;
    } catch (err) {
      // Rollback optimistic update
      setStages(prev => prev.map(stage => 
        stage.id === stageId ? originalStage : stage
      ));
      
      const errorMessage = err instanceof Error ? err.message : 'Errore aggiornamento tappa';
      setError(errorMessage);
      return null;
    } finally {
      operationRef.current = null;
    }
  }, [tripId, stages]);

  // Delete stage with optimistic update
  const deleteStage = useCallback(async (stageId: string): Promise<boolean> => {
    if (operationRef.current) return false;
    
    const stageToDelete = stages.find(stage => stage.id === stageId);
    if (!stageToDelete) {
      setError('Tappa non trovata');
      return false;
    }
    
    try {
      setError(null);
      operationRef.current = 'delete';
      
      // Optimistic update: rimuovi la stage e ricompatta gli orderIndex
      const updatedStages = stages
        .filter(stage => stage.id !== stageId)
        .map((stage, index) => ({ ...stage, orderIndex: index }));
      
      setStages(updatedStages);
      
      // API call
      const response = await fetch(`/api/trips/${tripId}/stages/${stageId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore eliminazione tappa');
      }
      
      // La ricompattazione degli orderIndex è già gestita dal server
      // Reset operation ref before refresh to avoid blocking
      operationRef.current = null;
      
      // Facciamo un refresh per sicurezza
      await refreshStages();
      
      return true;
    } catch (err) {
      // Rollback optimistic update
      setStages(stages);
      
      const errorMessage = err instanceof Error ? err.message : 'Errore eliminazione tappa';
      setError(errorMessage);
      operationRef.current = null;
      return false;
    }
  }, [tripId, stages, refreshStages]);

  // Reorder stages with optimistic updates
  const reorderStages = useCallback(async (newOrder: Stage[]): Promise<boolean> => {
    if (operationRef.current || isReordering) return false;
    
    // Valida che tutti gli stage appartengano allo stesso trip
    const invalidStages = newOrder.filter(stage => stage.tripId !== tripId);
    if (invalidStages.length > 0) {
      setError('Errore: tappe non appartenenti al viaggio corrente');
      return false;
    }
    
    // Valida che il numero di stages corrisponda
    if (newOrder.length !== stages.length) {
      setError('Errore: numero di tappe non corrispondente');
      return false;
    }
    
    const originalStages = [...stages];
    
    try {
      setError(null);
      setIsReordering(true);
      operationRef.current = 'reorder';
      
      // Optimistic update: aggiorna immediatamente l'ordine con nuovi orderIndex
      const reorderedStages = newOrder.map((stage, index) => ({
        ...stage,
        orderIndex: index,
        updatedAt: new Date()
      }));
      
      setStages(reorderedStages);
      
      // Prepara i dati per l'API call
      const reorderData = reorderedStages.map((stage, index) => ({
        id: stage.id,
        orderIndex: index
      }));
      
      // Per ora, dato che non abbiamo un endpoint specifico per il reordering,
      // aggiorniamo ogni stage individualmente
      // TODO: Implementare endpoint batch per performance migliori
      const updatePromises = reorderData.map(({ id, orderIndex }) =>
        fetch(`/api/trips/${tripId}/stages/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex })
        })
      );
      
      const responses = await Promise.all(updatePromises);
      
      // Verifica che tutte le richieste siano andate a buon fine
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Errore nel riordinamento: ${failedResponses.length} operazioni fallite`);
      }
      
      // Refresh completo per sincronizzare con il server
      await refreshStages();
      
      return true;
    } catch (err) {
      // Rollback optimistic update
      setStages(originalStages);
      
      const errorMessage = err instanceof Error ? err.message : 'Errore riordinamento tappe';
      setError(errorMessage);
      return false;
    } finally {
      setIsReordering(false);
      operationRef.current = null;
    }
  }, [tripId, stages, isReordering, refreshStages]);

  // Utility functions
  const getStageById = useCallback((stageId: string): Stage | undefined => {
    return stages.find(stage => stage.id === stageId);
  }, [stages]);

  const getTotalStages = useCallback((): number => {
    return stages.length;
  }, [stages.length]);

  return {
    // Data state
    stages,
    isLoading,
    error,
    isReordering,
    
    // CRUD operations
    createStage,
    updateStage,
    deleteStage,
    
    // Reordering operations
    reorderStages,
    
    // Utility operations
    refreshStages,
    clearError,
    getStageById,
    getTotalStages
  };
}