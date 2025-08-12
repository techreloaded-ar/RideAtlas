// src/hooks/useStageEditor.ts
// Hook per gestione form di creazione/modifica stage con validazione e file upload

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stage, StageCreationData, StageUpdateData, MediaItem, GpxFile } from '@/types/trip';
import { useStages } from '@/hooks/stages/useStages';
import { generateTempIdWithIndex, generateTempMediaId } from '@/lib/temp-id-service';

// Schema di validazione Zod per Stage
const stageValidationSchema = z.object({
  orderIndex: z.number().min(0, 'Order index deve essere >= 0'),
  title: z.string()
    .min(1, 'Titolo è obbligatorio')
    .max(200, 'Titolo non può superare 200 caratteri'),
  description: z.string().optional(),
  routeType: z.string()
    .max(500, 'Tipo percorso non può superare 500 caratteri')
    .optional(),
  duration: z.string()
    .max(500, 'Durata stimata non può superare 500 caratteri')
    .optional(),
  media: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'video']),
    url: z.string().url('URL non valido'),
    caption: z.string().optional(),
    thumbnailUrl: z.string().url('URL thumbnail non valido').optional()
  })),
  gpxFile: z.object({
    url: z.string().url('URL GPX non valido'),
    filename: z.string().min(1, 'Nome file richiesto'),
    waypoints: z.number().min(0),
    distance: z.number().min(0),
    elevationGain: z.number().min(0).optional(),
    elevationLoss: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    maxElevation: z.number().optional(),
    minElevation: z.number().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isValid: z.boolean(),
    keyPoints: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      elevation: z.number().optional(),
      distanceFromStart: z.number(),
      type: z.enum(['start', 'intermediate', 'end']),
      description: z.string()
    })).optional()
  }).nullable()
});

type StageFormData = z.infer<typeof stageValidationSchema>;

// Interfaccia per lo stato degli upload
interface UploadProgress {
  media: { [key: string]: number };
  gpx: number | null;
}

interface UseStageEditorProps {
  tripId: string;
  stageId?: string; // Se presente, modalità edit
  existingStages?: Stage[]; // Per calcolare automaticamente orderIndex
  autoFetch?: boolean; // Auto-fetch stage in modalità edit
}

interface UseStageEditorReturn {
  // Form state
  form: ReturnType<typeof useForm<StageFormData>>;
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  
  // Upload state
  uploadProgress: UploadProgress;
  isUploading: boolean;
  
  // Data state
  currentStage: Stage | null;
  
  // Operations
  saveStage: () => Promise<Stage | null>;
  resetForm: () => void;
  
  // File upload operations
  uploadMedia: (files: FileList) => Promise<MediaItem[]>;
  removeMedia: (mediaId: string) => void;
  uploadGpx: (file: File) => Promise<GpxFile | null>;
  removeGpx: () => void;
  
  // Error handling
  errors: {
    form: string | null;
    upload: string | null;
    save: string | null;
  };
  clearErrors: () => void;
}

export function useStageEditor({ 
  tripId, 
  stageId, 
  existingStages = [],
  autoFetch = true 
}: UseStageEditorProps): UseStageEditorReturn {
  // Integration con useStages per operazioni CRUD
  const { 
    stages, 
    createStage, 
    updateStage, 
    getStageById,
    isLoading: stagesLoading 
  } = useStages({ tripId, autoFetch: false });
  
  // Form state
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageValidationSchema),
    defaultValues: {
      orderIndex: 0,
      title: '',
      description: '',
      routeType: '',
      duration: '',
      media: [],
      gpxFile: null
    }
  });
  
  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    media: {},
    gpx: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({
    form: null as string | null,
    upload: null as string | null,
    save: null as string | null
  });

  // Fetch stage in modalità edit
  useEffect(() => {
    if (stageId && autoFetch && !stagesLoading) {
      const stage = getStageById(stageId);
      if (stage) {
        setCurrentStage(stage);
        // Popola il form con i dati dello stage
        form.reset({
          orderIndex: stage.orderIndex,
          title: stage.title,
          description: stage.description || '',
          routeType: stage.routeType || '',
          duration: stage.duration || '',
          media: stage.media,
          gpxFile: stage.gpxFile
        });
        setIsInitialized(true);
      }
    } else if (!stageId) {
      // Modalità creazione: calcola il prossimo orderIndex
      const stagesToConsider = existingStages.length > 0 ? existingStages : stages;
      const nextOrderIndex = stagesToConsider.length > 0 
        ? Math.max(...stagesToConsider.map(s => s.orderIndex)) + 1 
        : 0;
      form.setValue('orderIndex', nextOrderIndex);
      setIsInitialized(true);
    }
  }, [stageId, stages, existingStages, autoFetch, stagesLoading, getStageById, form]);
  
  // Clear errors function
  const clearErrors = useCallback(() => {
    setErrors({
      form: null,
      upload: null,
      save: null
    });
  }, []);
  
  // Reset form function
  const resetForm = useCallback(() => {
    if (currentStage) {
      form.reset({
        orderIndex: currentStage.orderIndex,
        title: currentStage.title,
        description: currentStage.description || '',
        routeType: currentStage.routeType || '',
        duration: currentStage.duration || '',
        media: currentStage.media,
        gpxFile: currentStage.gpxFile
      });
    } else {
      const stagesToConsider = existingStages.length > 0 ? existingStages : stages;
      const nextOrderIndex = stagesToConsider.length > 0 
        ? Math.max(...stagesToConsider.map(s => s.orderIndex)) + 1 
        : 0;
      form.reset({
        orderIndex: nextOrderIndex,
        title: '',
        description: '',
        routeType: '',
        duration: '',
        media: [],
        gpxFile: null
      });
    }
    clearErrors();
  }, [currentStage, stages, existingStages, form, clearErrors]);

  // Upload media files
  const uploadMedia = useCallback(async (files: FileList): Promise<MediaItem[]> => {
    if (!files.length) return [];
    
    setIsUploading(true);
    clearErrors();
    
    try {
      const uploadedMedia: MediaItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempId = generateTempIdWithIndex('media', i);
        
        // Validazione file
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} non è un'immagine valida`);
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} è troppo grande (max 10MB)`);
        }
        
        // Simula upload con progress tracking
        setUploadProgress(prev => ({
          ...prev,
          media: { ...prev.media, [tempId]: 0 }
        }));
        
        // Mock upload API call
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tripId', tripId);
        formData.append('type', 'stage-media');
        
        // Simula progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({
            ...prev,
            media: { ...prev.media, [tempId]: progress }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // TODO: Implementare chiamata API reale
        // const response = await fetch('/api/upload/media', {
        //   method: 'POST',
        //   body: formData
        // });
        
        // Mock response per ora
        const mockMediaItem: MediaItem = {
          id: generateTempMediaId(),
          type: 'image',
          url: URL.createObjectURL(file),
          caption: ''
        };
        
        uploadedMedia.push(mockMediaItem);
        
        // Remove progress tracking
        setUploadProgress(prev => {
          const newMedia = { ...prev.media };
          delete newMedia[tempId];
          return { ...prev, media: newMedia };
        });
      }
      
      // Aggiorna il form con i nuovi media
      const currentMedia = form.getValues('media');
      form.setValue('media', [...currentMedia, ...uploadedMedia]);
      
      return uploadedMedia;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante upload media';
      setErrors(prev => ({ ...prev, upload: errorMessage }));
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [tripId, form, clearErrors]);
  
  // Remove media item
  const removeMedia = useCallback((mediaId: string) => {
    const currentMedia = form.getValues('media');
    const updatedMedia = currentMedia.filter(item => item.id !== mediaId);
    form.setValue('media', updatedMedia);
  }, [form]);

  // Upload GPX file
  const uploadGpx = useCallback(async (file: File): Promise<GpxFile | null> => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setErrors(prev => ({ ...prev, upload: 'Il file deve essere un GPX valido' }));
      return null;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, upload: 'File GPX troppo grande (max 5MB)' }));
      return null;
    }
    
    setIsUploading(true);
    clearErrors();
    
    try {
      setUploadProgress(prev => ({ ...prev, gpx: 0 }));
      
      // Mock upload con progress
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploadProgress(prev => ({ ...prev, gpx: progress }));
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // TODO: Implementare parsing GPX reale e upload
      const mockGpxFile: GpxFile = {
        url: URL.createObjectURL(file),
        filename: file.name,
        waypoints: 150,
        distance: 142.5,
        elevationGain: 2350,
        elevationLoss: 1980,
        isValid: true
      };
      
      form.setValue('gpxFile', mockGpxFile);
      setUploadProgress(prev => ({ ...prev, gpx: null }));
      
      return mockGpxFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante upload GPX';
      setErrors(prev => ({ ...prev, upload: errorMessage }));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [form, clearErrors]);
  
  // Remove GPX file
  const removeGpx = useCallback(() => {
    form.setValue('gpxFile', null);
  }, [form]);

  // Save stage (create or update)
  const saveStage = useCallback(async (): Promise<Stage | null> => {
    clearErrors();
    
    // Trigger form validation
    const isValid = await form.trigger();
    if (!isValid) {
      setErrors(prev => ({ ...prev, form: 'Correggi i campi evidenziati' }));
      return null;
    }
    
    setIsSaving(true);
    
    try {
      const formData = form.getValues();
      
      if (stageId && currentStage) {
        // Modalità update
        const updateData: StageUpdateData = {
          orderIndex: formData.orderIndex,
          title: formData.title,
          description: formData.description || undefined,
          routeType: formData.routeType || undefined,
          duration: formData.duration || undefined,
          media: formData.media,
          gpxFile: formData.gpxFile
        };
        
        const updatedStage = await updateStage(stageId, updateData);
        if (updatedStage) {
          setCurrentStage(updatedStage);
        }
        return updatedStage;
      } else {
        // Modalità create
        const createData: StageCreationData = {
          orderIndex: formData.orderIndex,
          title: formData.title,
          description: formData.description || undefined,
          routeType: formData.routeType || undefined,
          duration: formData.duration || undefined,
          media: formData.media,
          gpxFile: formData.gpxFile
        };
        
        const newStage = await createStage(createData);
        if (newStage) {
          setCurrentStage(newStage);
        }
        return newStage;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il salvataggio';
      setErrors(prev => ({ ...prev, save: errorMessage }));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [form, stageId, currentStage, updateStage, createStage, clearErrors]);


  return {
    // Form state
    form,
    isLoading: stagesLoading,
    isSaving,
    isInitialized,
    
    // Upload state
    uploadProgress,
    isUploading,
    
    // Data state
    currentStage,
    
    // Operations
    saveStage,
    resetForm,
    
    // File upload operations
    uploadMedia,
    removeMedia,
    uploadGpx,
    removeGpx,
    
    // Error handling
    errors,
    clearErrors
  };
}