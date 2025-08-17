// src/lib/batch/BatchProcessor.ts
import { ZipParser, ParsedTrip, ParsedMediaFile, ParsedGpxFile } from './ZipParser'
import { BatchProcessingResult } from '@/schemas/batch-trip'
import { prisma } from '@/lib/core/prisma'
import { getStorageProvider } from '@/lib/storage'
import { MediaItem, GpxFile } from '@/types/trip'
import { RecommendedSeason } from '@prisma/client'

interface BatchJob {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalTrips: number
  processedTrips: number
  createdTripIds: string[]
  errors: Array<{
    tripIndex?: number
    stageIndex?: number
    field?: string
    message: string
  }>
  startedAt: Date
  completedAt?: Date
  zipData: Buffer
}

export class BatchProcessor {
  private static jobs = new Map<string, BatchJob>()
  private storageProvider = getStorageProvider()

  async startBatchJob(userId: string, zipBuffer: Buffer): Promise<string> {
    const jobId = this.generateJobId()
    
    // Parse ZIP to get basic info
    const parser = new ZipParser()
    await parser.loadZip(zipBuffer)
    
    const errors = parser.validateZipStructure()
    if (errors.length > 0) {
      throw new Error(`Struttura ZIP non valida: ${errors.join(', ')}`)
    }
    
    if (!parser.validateZipSize()) {
      throw new Error('File ZIP troppo grande (max 100MB)')
    }
    
    const parsedData = await parser.parse()
    
    // Create job
    const job: BatchJob = {
      id: jobId,
      userId,
      status: 'pending',
      totalTrips: parsedData.trips.length,
      processedTrips: 0,
      createdTripIds: [],
      errors: [],
      startedAt: new Date(),
      zipData: zipBuffer,
    }
    
    BatchProcessor.jobs.set(jobId, job)
    
    // Start processing asynchronously
    this.processJobAsync(jobId).catch((error) => {
      console.error(`Job ${jobId} failed:`, error)
      const failedJob = BatchProcessor.jobs.get(jobId)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.errors.push({
          message: error.message || 'Errore sconosciuto durante il processamento'
        })
        failedJob.completedAt = new Date()
      }
    })
    
    return jobId
  }

  async getJobStatus(jobId: string): Promise<BatchProcessingResult | null> {
    const job = BatchProcessor.jobs.get(jobId)
    if (!job) return null
    
    return {
      jobId: job.id,
      status: job.status,
      totalTrips: job.totalTrips,
      processedTrips: job.processedTrips,
      createdTripIds: job.createdTripIds,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    }
  }

  private async processJobAsync(jobId: string): Promise<void> {
    const job = BatchProcessor.jobs.get(jobId)
    if (!job) throw new Error('Job non trovato')
    
    console.log(`🚀 Starting processing for job ${jobId}`)
    job.status = 'processing'
    
    try {
      // Re-parse ZIP data
      console.log(`📦 Re-parsing ZIP data for job ${jobId}`)
      const parser = new ZipParser()
      await parser.loadZip(job.zipData)
      const parsedData = await parser.parse()
      
      console.log(`✅ ZIP parsed successfully. Found ${parsedData.trips.length} trip(s)`)
      
      // Process each trip
      for (let i = 0; i < parsedData.trips.length; i++) {
        try {
          console.log(`🎯 Processing trip ${i + 1}/${parsedData.trips.length}: "${parsedData.trips[i].title}"`)
          const tripData = parsedData.trips[i]
          const createdTripId = await this.processSingleTrip(job.userId, tripData, i)
          
          job.createdTripIds.push(createdTripId)
          job.processedTrips++
          console.log(`✅ Trip ${i + 1} created successfully with ID: ${createdTripId}`)
        } catch (error) {
          console.error(`❌ Error processing trip ${i + 1}:`, error)
          job.errors.push({
            tripIndex: i,
            message: error instanceof Error ? error.message : 'Errore sconosciuto'
          })
        }
      }
      
      // Determine final status: success if any trips were created, failed only if none were created
      if (job.createdTripIds.length > 0) {
        job.status = 'completed'
      } else {
        job.status = 'failed'
      }
      job.completedAt = new Date()
      
      console.log(`🏁 Job ${jobId} completed. Status: ${job.status}, Created: ${job.createdTripIds.length}, Errors: ${job.errors.length}`)
      
    } catch (error) {
      console.error(`💥 Fatal error in job ${jobId}:`, error)
      job.status = 'failed'
      job.errors.push({
        message: error instanceof Error ? error.message : 'Errore generale di processamento'
      })
      job.completedAt = new Date()
    }
  }

  private async processSingleTrip(userId: string, tripData: ParsedTrip, tripIndex: number): Promise<string> {
    console.log(`🔧 Processing single trip: "${tripData.title}" (user: ${userId})`)
    console.log(`📊 Trip data: ${tripData.stages.length} stages, ${tripData.media.length} media files`)
    
    return await prisma.$transaction(async (tx) => {
      try {
        // 1. Upload and process main trip media
        console.log(`📸 Processing ${tripData.media.length} media files for trip`)
        const tripMedia = await this.processMediaFiles(tripData.media, `trip-${tripIndex}`)
        console.log(`✅ Trip media processed: ${tripMedia.length} files`)
        
        // 2. Upload and process main trip GPX
        const tripGpxFile = tripData.gpxFile 
          ? await this.processGpxFile(tripData.gpxFile, `trip-${tripIndex}`)
          : null
        console.log(`🗺️ Trip GPX: ${tripGpxFile ? 'processed' : 'none'}`)
        
        // 3. Create trip
        const slug = this.slugify(tripData.title)
        const calculatedDays = Math.max(1, tripData.stages.length)
        
        console.log(`🏗️ Creating trip in database with slug: ${slug}`)
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
            duration_days: calculatedDays,
            duration_nights: 0,
            insights: null, // Explicitly null as per requirements
            media: tripMedia as unknown as object[],
            gpxFile: tripGpxFile as unknown as object,
            slug,
            user_id: userId,
          },
        })
        console.log(`✅ Trip created with ID: ${newTrip.id}`)
        
        // 4. Process and create stages
        console.log(`🔗 Creating ${tripData.stages.length} stages`)
        for (let stageIndex = 0; stageIndex < tripData.stages.length; stageIndex++) {
          const stageData = tripData.stages[stageIndex]
          
          try {
            console.log(`🎯 Processing stage ${stageIndex + 1}: "${stageData.title}"`)
            
            // Upload stage media
            const stageMedia = await this.processMediaFiles(
              stageData.media, 
              `trip-${tripIndex}-stage-${stageIndex}`
            )
            
            // Upload stage GPX
            const stageGpxFile = stageData.gpxFile 
              ? await this.processGpxFile(stageData.gpxFile, `trip-${tripIndex}-stage-${stageIndex}`)
              : null
            
            // Create stage
            await tx.stage.create({
              data: {
                tripId: newTrip.id,
                orderIndex: stageData.orderIndex,
                title: stageData.title,
                description: stageData.description || null,
                routeType: stageData.routeType || null,
                duration: stageData.duration || null,
                media: stageMedia as unknown as object[],
                gpxFile: stageGpxFile as unknown as object,
              },
            })
            console.log(`✅ Stage ${stageIndex + 1} created successfully`)
          } catch (error) {
            console.error(`❌ Error creating stage ${stageIndex + 1}:`, error)
            throw new Error(`Errore nella tappa ${stageIndex + 1}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
          }
        }
        
        console.log(`🎉 Trip "${tripData.title}" completed successfully with ${tripData.stages.length} stages`)
        return newTrip.id
      } catch (error) {
        console.error(`💥 Error in processSingleTrip for "${tripData.title}":`, error)
        throw error
      }
    })
  }

  private async processMediaFiles(mediaFiles: ParsedMediaFile[], prefix: string): Promise<MediaItem[]> {
    const mediaItems: MediaItem[] = []
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      
      try {
        // Convert buffer to File object for storage provider
        const fileObj = new File([file.buffer], file.filename, { type: file.mimeType })
        
        // Upload to storage
        const uploadResult = await this.storageProvider.uploadFile(
          fileObj,
          `${prefix}-${i}-${file.filename}`
        )
        
        const mediaItem: MediaItem = {
          id: `media_${Date.now()}_${i}`,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          url: uploadResult.url,
          caption: file.caption,
          thumbnailUrl: file.mimeType.startsWith('video/') ? undefined : undefined,
        }
        
        mediaItems.push(mediaItem)
      } catch (error) {
        console.error(`Error uploading media file ${file.filename}:`, error)
        // Don't fail the entire process for media upload errors - just skip this file
        console.warn(`Skipping media file ${file.filename} due to upload error`)
        continue
      }
    }
    
    return mediaItems
  }

  private async processGpxFile(gpxFile: ParsedGpxFile, prefix: string): Promise<GpxFile> {
    try {
      // Convert buffer to File object for storage provider
      const fileObj = new File([gpxFile.buffer], gpxFile.filename, { type: 'application/gpx+xml' })
      
      // Upload GPX file
      const uploadResult = await this.storageProvider.uploadFile(
        fileObj,
        `${prefix}-${gpxFile.filename}`
      )
      
      // Parse GPX metadata (simplified - could be enhanced with actual GPX parsing)
      const gpxData: GpxFile = {
        url: uploadResult.url,
        filename: gpxFile.filename,
        waypoints: 0, // Would be parsed from actual GPX content
        distance: 0, // Would be calculated from GPX content  
        elevationGain: undefined,
        elevationLoss: undefined,
        duration: undefined,
        maxElevation: undefined,
        minElevation: undefined,
        startTime: undefined,
        endTime: undefined,
        isValid: true, // Would be validated from actual GPX parsing
        keyPoints: undefined,
      }
      
      return gpxData
    } catch (error) {
      console.error(`Error uploading GPX file ${gpxFile.filename}:`, error)
      throw new Error(`Errore caricamento GPX: ${gpxFile.filename}`)
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup old jobs (call periodically)
  static cleanupOldJobs(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    
    BatchProcessor.jobs.forEach((job, jobId) => {
      if (job.startedAt < cutoff) {
        BatchProcessor.jobs.delete(jobId)
      }
    })
  }
}