// src/lib/batch/BatchProcessor.ts
import { ZipParser, ParsedTrip, ParsedMediaFile, ParsedGpxFile } from './ZipParser'
import { BatchProcessingResult } from '@/schemas/batch-trip'
import { prisma } from '@/lib/core/prisma'
import { getStorageProvider } from '@/lib/storage'
import { MediaItem, GpxFile } from '@/types/trip'
import { RecommendedSeason, BatchJobStatus, Prisma } from '@prisma/client'
import { put } from '@vercel/blob'
import { ErrorUtils } from './ErrorUtils'

interface BatchError {
  message: string;
  tripIndex?: number;
  stageIndex?: number;
  field?: string;
}

export class BatchProcessor {
  private storageProvider = getStorageProvider()

  async startBatchJob(userId: string, zipBuffer: Buffer): Promise<string> {
    console.log(`Starting batch job for user ${userId}, buffer size: ${zipBuffer.length}`)
    console.log(`Environment: ${process.env.NODE_ENV}, Runtime: ${process.env.VERCEL ? 'Vercel' : 'Local'}`)
    
    try {
      // 1. Upload ZIP to blob storage first
      const zipFileName = `batch-uploads/batch_${Date.now()}_${userId.slice(-6)}.zip`
      console.log(`Uploading ZIP to blob storage: ${zipFileName}`)
      
      const { url: zipFileUrl } = await put(zipFileName, zipBuffer, {
        access: 'public',
        contentType: 'application/zip',
      });
      console.log(`ZIP uploaded successfully to: ${zipFileUrl}`)

      // 2. Create job record in database
      const job = await prisma.batchJob.create({
        data: {
          userId,
          zipFileUrl,
          status: BatchJobStatus.PENDING,
          totalTrips: 0, // Will be updated after parsing
          createdTripIds: [],
        },
      });
      console.log(`Batch job created: ${job.id}`)

      // 3. Start processing asynchronously (fire and forget)
      // Use setTimeout to ensure the response is sent before processing starts
      setTimeout(() => {
        this.processJobAsync(job.id).catch((error) => {
          console.error(`Fatal error in processJobAsync for job ${job.id}:`, error)
          console.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack')
          
          // Log critical failure to the job itself
          prisma.batchJob.update({
            where: { id: job.id },
            data: {
              status: BatchJobStatus.FAILED,
              errors: {
                push: {
                  message: `Processamento fallito in modo critico: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
                }
              },
              completedAt: new Date(),
            },
          }).catch(e => console.error(`Failed to update job status on critical failure for job ${job.id}:`, e));
        })
      }, 100) // Small delay to ensure response is sent

      return job.id
    } catch (error) {
      console.error('Error in startBatchJob:', error)
      throw error
    }
  }

  async getJobStatus(jobId: string): Promise<BatchProcessingResult | null> {
    const job = await prisma.batchJob.findUnique({
      where: { id: jobId },
    })

    if (!job) return null

    // Debug logging for errors field
    console.log(`Job ${jobId} raw errors from DB:`, job.errors)
    console.log(`Job ${jobId} errors type:`, typeof job.errors)
    
    const parsedErrors = this.parseJobErrors(job.errors)
    console.log(`Job ${jobId} parsed errors:`, parsedErrors)

    // Adapt the Prisma model to the BatchProcessingResult schema
    return {
      jobId: job.id,
      status: job.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'failed',
      totalTrips: job.totalTrips,
      processedTrips: job.processedTrips,
      createdTripIds: job.createdTripIds,
      errors: parsedErrors,
      startedAt: job.startedAt,
      completedAt: job.completedAt ?? undefined,
    }
  }

  /**
   * Parse job errors from Prisma JSON field to BatchError array
   */
  private parseJobErrors(prismaErrors: unknown): BatchError[] {
    if (!prismaErrors) return []
    
    try {
      // Handle Prisma Json type
      if (Array.isArray(prismaErrors)) {
        return prismaErrors.map(error => {
          // More robust error message extraction
          let message = 'Errore durante il processamento'
          
          if (error && typeof error === 'object') {
            if (typeof error.message === 'string' && error.message.trim()) {
              message = error.message
            }
          } else if (typeof error === 'string' && error.trim()) {
            message = error
          }
          
          return {
            message,
            tripIndex: error?.tripIndex,
            stageIndex: error?.stageIndex,
            field: error?.field
          }
        })
      }
      
      // Single error object or Prisma push structure
      if (typeof prismaErrors === 'object' && prismaErrors !== null) {
        const error = prismaErrors as Record<string, unknown>
        
        // Handle Prisma push structure: { push: { message: "..." } }
        if (error.push && typeof error.push === 'object') {
          const pushError = error.push as Record<string, unknown>
          let message = 'Errore durante il processamento'
          
          if (typeof pushError.message === 'string' && pushError.message.trim()) {
            message = pushError.message
          }
          
          return [{
            message,
            tripIndex: (typeof pushError.tripIndex === 'number' ? pushError.tripIndex : undefined),
            stageIndex: (typeof pushError.stageIndex === 'number' ? pushError.stageIndex : undefined),
            field: (typeof pushError.field === 'string' ? pushError.field : undefined)
          }]
        }
        
        // Handle direct error structure
        let message = 'Errore durante il processamento'
        
        if (typeof error.message === 'string' && error.message.trim()) {
          message = error.message
        }
        
        return [{
          message,
          tripIndex: (typeof error.tripIndex === 'number' ? error.tripIndex : undefined),
          stageIndex: (typeof error.stageIndex === 'number' ? error.stageIndex : undefined),
          field: (typeof error.field === 'string' ? error.field : undefined)
        }]
      }
      
      // Handle case where prismaErrors is a string
      if (typeof prismaErrors === 'string' && prismaErrors.trim()) {
        return [{ message: prismaErrors }]
      }
      
      return []
    } catch (error) {
      console.error('Error parsing job errors:', error)
      return [{ message: 'Errore durante la lettura degli errori dal database' }]
    }
  }

  private async processJobAsync(jobId: string): Promise<void> {
    console.log(`Starting processJobAsync for job ${jobId}`)
    
    try {
      // 1. Set job to PROCESSING
      await prisma.batchJob.update({
        where: { id: jobId },
        data: { status: BatchJobStatus.PROCESSING },
      })
      console.log(`Job ${jobId} status updated to PROCESSING`)

      const job = await prisma.batchJob.findUnique({ where: { id: jobId } })
      if (!job) {
        console.error(`Job ${jobId} not found after setting to processing`)
        throw new Error('Job non trovato dopo averlo impostato come in elaborazione')
      }

      // 2. Download ZIP from storage with timeout and better error handling
      console.log(`Downloading ZIP file from: ${job.zipFileUrl}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      try {
        const response = await fetch(job.zipFileUrl, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'RideAtlas-BatchProcessor/1.0'
          }
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`Failed to download ZIP file: ${response.status} ${response.statusText}`)
          throw new Error(`Impossibile scaricare il file ZIP: ${response.status} ${response.statusText}`)
        }
        
        console.log(`ZIP file downloaded successfully, content-length: ${response.headers.get('content-length')}`)
        const zipBuffer = Buffer.from(await response.arrayBuffer())
        console.log(`ZIP buffer created, size: ${zipBuffer.length} bytes`)
        
        await this.processZipContent(jobId, zipBuffer)
        
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Timeout durante il download del file ZIP')
        }
        throw fetchError
      }
    } catch (error) {
      console.error(`Fatal error in processJobAsync for job ${jobId}:`, error)
      await this.handleJobError(jobId, error)
    }
  }
  
  private async processZipContent(jobId: string, zipBuffer: Buffer): Promise<void> {

    try {
      // 3. Parse ZIP and update total trips
      console.log(`Parsing ZIP content for job ${jobId}`)
      const parser = new ZipParser()
      
      await parser.loadZip(zipBuffer)
      console.log(`ZIP loaded successfully`)
      
      const validationErrors = parser.validateZipStructure()
      if (validationErrors.length > 0) {
        console.error(`ZIP structure validation failed:`, validationErrors)
        // Create detailed error message with each validation error
        const detailedErrors = validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n')
        throw new Error(`Struttura ZIP non valida:\n${detailedErrors}`)
      }
      console.log(`ZIP structure validation passed`)
      
      const parsedData = await parser.parse()
      console.log(`ZIP parsed successfully, found ${parsedData.trips.length} trips`)

      await prisma.batchJob.update({
        where: { id: jobId },
        data: { totalTrips: parsedData.trips.length },
      })
      console.log(`Job ${jobId} total trips updated to ${parsedData.trips.length}`)

      // 4. Process each trip
      const job = await prisma.batchJob.findUnique({ where: { id: jobId } })
      if (!job) throw new Error('Job not found during processing')
      
      for (let i = 0; i < parsedData.trips.length; i++) {
        const tripData = parsedData.trips[i]
        console.log(`Processing trip ${i + 1}/${parsedData.trips.length}: ${tripData.title}`)
        
        try {
          const createdTripId = await this.processSingleTrip(job.userId, tripData, i)
          console.log(`Trip ${i + 1} processed successfully, created trip ID: ${createdTripId}`)
          
          await prisma.batchJob.update({
            where: { id: jobId },
            data: {
              processedTrips: { increment: 1 },
              createdTripIds: { push: createdTripId },
            },
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
          console.error(`Error processing trip ${i + 1}:`, error)
          
          // Enhanced error context for better user understanding
          const contextualError = ErrorUtils.enhanceErrorMessage(errorMessage, i, tripData.title)
          
          await prisma.batchJob.update({
            where: { id: jobId },
            data: {
              errors: {
                push: { 
                  tripIndex: i, 
                  message: contextualError,
                  field: ErrorUtils.extractErrorField(errorMessage)
                }
              },
            },
          })
        }
      }

      // 5. Finalize job status
      const finalJobState = await prisma.batchJob.findUnique({ where: { id: jobId } })
      const finalStatus = (finalJobState?.createdTripIds.length ?? 0) > 0 ? BatchJobStatus.COMPLETED : BatchJobStatus.FAILED
      
      console.log(`Finalizing job ${jobId} with status ${finalStatus}, processed ${finalJobState?.processedTrips ?? 0} trips`)

      await prisma.batchJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          completedAt: new Date(),
        },
      })
      
      console.log(`Job ${jobId} completed successfully`)
    } catch (error) {
      console.error(`Error processing ZIP content for job ${jobId}:`, error)
      throw error // Re-throw to be handled by processJobAsync
    }
  }
  
  private async handleJobError(jobId: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Errore generale di processamento'
    console.error(`Handling job error for ${jobId}:`, errorMessage)
    
    // Enhance error message for better user understanding
    const userFriendlyError = ErrorUtils.enhanceGeneralErrorMessage(errorMessage)
    
    try {
      await prisma.batchJob.update({
        where: { id: jobId },
        data: {
          status: BatchJobStatus.FAILED,
          errors: {
            push: { message: userFriendlyError }
          },
          completedAt: new Date(),
        },
      })
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} error status:`, updateError)
    }
  }
  

  private async processSingleTrip(userId: string, tripData: ParsedTrip, tripIndex: number): Promise<string> {
    console.log(`Processing single trip ${tripIndex}: ${tripData.title}`)
    console.log(`Trip has ${tripData.media.length} media files and ${tripData.stages.length} stages`)
    
    try {
      // Process trip-level media files
      console.log(`Processing ${tripData.media.length} trip media files`)
      const tripMedia = await this.processMediaFiles(tripData.media, `trip-${tripIndex}`)
      console.log(`Successfully processed ${tripMedia.length} trip media files`)
      
      // Process trip-level GPX file
      const tripGpxFile = tripData.gpxFile ? await this.processGpxFile(tripData.gpxFile, `trip-${tripIndex}`) : null
      if (tripGpxFile) {
        console.log(`Successfully processed trip GPX file: ${tripGpxFile.filename}`)
      }

      // Process stages
      console.log(`Processing ${tripData.stages.length} stages`)
      const processedStages: Array<{
        stageData: ParsedTrip['stages'][0];
        media: MediaItem[];
        gpxFile: GpxFile | null;
      }> = [];

      for (let stageIndex = 0; stageIndex < tripData.stages.length; stageIndex++) {
        const stageData = tripData.stages[stageIndex]
        console.log(`Processing stage ${stageIndex + 1}: ${stageData.title} (${stageData.media.length} media files)`)
        
        try {
          const stageMedia = await this.processMediaFiles(stageData.media, `trip-${tripIndex}-stage-${stageIndex}`)
          const stageGpxFile = stageData.gpxFile ? await this.processGpxFile(stageData.gpxFile, `trip-${tripIndex}-stage-${stageIndex}`) : null
          processedStages.push({ stageData, media: stageMedia, gpxFile: stageGpxFile })
          console.log(`Stage ${stageIndex + 1} processed successfully`)
        } catch (stageError) {
          console.error(`Error processing stage ${stageIndex + 1}:`, stageError)
          // Continue processing other stages, but log the error
          processedStages.push({ stageData, media: [], gpxFile: null })
        }
      }

      // Create trip and stages in database transaction
      console.log(`Creating trip in database: ${tripData.title}`)
      return await prisma.$transaction(async (tx) => {
        const slug = this.slugify(tripData.title)
        console.log(`Generated slug: ${slug}`)
        
        const newTrip = await tx.trip.create({
          data: {
            title: tripData.title,
            summary: tripData.summary,
            destination: tripData.destination,
            theme: tripData.theme,
            characteristics: tripData.characteristics,
            recommended_seasons: tripData.recommended_seasons as RecommendedSeason[],
            tags: tripData.tags,
            travelDate: tripData.travelDate,
            duration_days: Math.max(1, tripData.stages.length),
            duration_nights: 0,
            insights: null,
            media: tripMedia as unknown as Prisma.InputJsonValue[],
            gpxFile: tripGpxFile as unknown as Prisma.JsonObject,
            slug,
            user_id: userId,
          },
        })
        console.log(`Trip created with ID: ${newTrip.id}`)

        // Create stages
        for (const { stageData, media, gpxFile } of processedStages) {
          try {
            await tx.stage.create({
              data: {
                tripId: newTrip.id,
                orderIndex: stageData.orderIndex,
                title: stageData.title,
                description: stageData.description || null,
                routeType: stageData.routeType || null,
                duration: stageData.duration || null,
                media: media as unknown as Prisma.InputJsonValue[],
                gpxFile: gpxFile as unknown as Prisma.JsonObject,
              },
            })
            console.log(`Stage created: ${stageData.title}`)
          } catch (stageError) {
            console.error(`Error creating stage ${stageData.title}:`, stageError)
            throw stageError // This will rollback the transaction
          }
        }
        
        console.log(`Trip ${newTrip.id} and all stages created successfully`)
        return newTrip.id
      }, {
        timeout: 60000, // 60 second timeout for the transaction
      })
    } catch (error) {
      console.error(`Error processing single trip ${tripIndex}:`, error)
      throw error
    }
  }

  private async processMediaFiles(mediaFiles: ParsedMediaFile[], prefix: string): Promise<MediaItem[]> {
    const mediaItems: MediaItem[] = []
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      try {
        const fileObj = new File([file.buffer], file.filename, { type: file.mimeType })
        const uploadResult = await this.storageProvider.uploadFile(fileObj, `${prefix}-${i}-${file.filename}`)
        mediaItems.push({
          id: `media_${Date.now()}_${i}`,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          url: uploadResult.url,
          caption: file.caption,
        })
      } catch (error) {
        console.warn(`Skipping media file ${file.filename} due to upload error`, error)
        continue
      }
    }
    return mediaItems
  }

  private async processGpxFile(gpxFile: ParsedGpxFile, prefix: string): Promise<GpxFile> {
    try {
      const fileObj = new File([gpxFile.buffer], gpxFile.filename, { type: 'application/gpx+xml' })
      const uploadResult = await this.storageProvider.uploadFile(fileObj, `${prefix}-${gpxFile.filename}`)
      return {
        url: uploadResult.url,
        filename: gpxFile.filename,
        waypoints: 0,
        distance: 0,
        isValid: true,
      }
    } catch (error) {
      console.error(`Error uploading GPX file ${gpxFile.filename}:`, error)
      throw new Error(`Errore caricamento GPX: ${gpxFile.filename}`)
    }
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^\w-]+/g, '-')
      .replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
  }

  static async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    await prisma.batchJob.deleteMany({
      where: {
        startedAt: {
          lt: cutoff,
        },
      },
    })
  }
}
