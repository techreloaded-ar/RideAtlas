// src/lib/batch/ZipParser.ts
import JSZip from 'jszip'
import { BatchUpload, isSingleTripBatch, isMultipleTripsBatch, BatchTrip } from '@/schemas/batch-trip'

export interface ParsedTripData {
  metadata: BatchUpload
  trips: ParsedTrip[]
}

export interface ParsedTrip {
  title: string
  summary: string
  destination: string
  theme: string
  characteristics: string[]
  recommended_seasons: string[]
  tags: string[]
  travelDate: Date | null
  stages: ParsedStage[]
  media: ParsedMediaFile[]
  gpxFile: ParsedGpxFile | null
  folderName?: string // Per batch multipli
}

export interface ParsedStage {
  title: string
  description?: string
  routeType?: string
  duration?: string
  orderIndex: number
  media: ParsedMediaFile[]
  gpxFile: ParsedGpxFile | null
  folderName: string
}

export interface ParsedMediaFile {
  filename: string
  buffer: Buffer
  mimeType: string
  caption?: string
  isHero?: boolean
}

export interface ParsedGpxFile {
  filename: string
  buffer: Buffer
  // GPX metadata will be parsed separately
}

export class ZipParser {
  private zip: JSZip
  private supportedImageTypes = ['.jpg', '.jpeg', '.png', '.webp']
  private supportedVideoTypes = ['.mp4', '.mov', '.avi']
  private basePath: string = '' // Will be set if files are in a subfolder

  constructor() {
    this.zip = new JSZip()
  }

  async loadZip(zipBuffer: Buffer): Promise<void> {
    this.zip = await JSZip.loadAsync(zipBuffer)
  }

  async parse(): Promise<ParsedTripData> {
    // 1. Parse viaggi.json
    const metadata = await this.parseViaggiJson()
    
    // 2. Determine if single or multiple trips
    if (isSingleTripBatch(metadata)) {
      const trip = await this.parseSingleTrip(metadata)
      return {
        metadata,
        trips: [trip]
      }
    } else if (isMultipleTripsBatch(metadata)) {
      const trips = await this.parseMultipleTrips(metadata)
      return {
        metadata,
        trips
      }
    }
    
    throw new Error('Formato JSON non riconosciuto')
  }

  private async parseViaggiJson(): Promise<BatchUpload> {
    // First try at root level
    let viaggiFile = this.zip.file('viaggi.json')
    
    // If not found, look for it in any subfolder
    if (!viaggiFile) {
      const viaggiPath = this.findViaggiJsonPath()
      if (viaggiPath) {
        viaggiFile = this.zip.file(viaggiPath)
        // Set the base path for other files
        this.basePath = viaggiPath.replace('viaggi.json', '')
      }
    }
    
    if (!viaggiFile) {
      throw new Error('File viaggi.json non trovato nel ZIP')
    }

    const content = await viaggiFile.async('text')
    try {
      return JSON.parse(content)
    } catch {
      throw new Error('File viaggi.json non è un JSON valido')
    }
  }

  private findViaggiJsonPath(): string | null {
    let foundPath: string | null = null
    
    this.zip.forEach((relativePath) => {
      if (relativePath.endsWith('/viaggi.json') || relativePath.endsWith('\\viaggi.json')) {
        foundPath = relativePath
      }
    })
    
    return foundPath
  }

  private async parseSingleTrip(metadata: BatchUpload): Promise<ParsedTrip> {
    // Type guard to ensure we have a single trip format
    if ('viaggi' in metadata) {
      throw new Error('Expected single trip format but got multiple trips format')
    }
    
    return {
      title: metadata.title,
      summary: metadata.summary,
      destination: metadata.destination,
      theme: metadata.theme,
      characteristics: metadata.characteristics,
      recommended_seasons: metadata.recommended_seasons,
      tags: metadata.tags,
      travelDate: metadata.travelDate ? new Date(metadata.travelDate) : null,
      stages: await this.parseStages(`${this.basePath}tappe/`, metadata.stages || []),
      media: await this.parseMedia(`${this.basePath}media/`),
      gpxFile: await this.parseGpxFile(`${this.basePath}main.gpx`),
    }
  }

  private async parseMultipleTrips(metadata: { viaggi: BatchTrip[] }): Promise<ParsedTrip[]> {
    const trips: ParsedTrip[] = []
    
    // Get numbered folders (01-name, 02-name, etc.)
    const tripFolders = this.getNumberedFolders(this.basePath)
    
    for (let i = 0; i < metadata.viaggi.length; i++) {
      const tripMetadata = metadata.viaggi[i]
      const expectedFolder = tripFolders[i]
      
      if (!expectedFolder) {
        throw new Error(`Cartella mancante per viaggio ${i + 1}`)
      }

      const trip: ParsedTrip = {
        title: tripMetadata.title,
        summary: tripMetadata.summary,
        destination: tripMetadata.destination,
        theme: tripMetadata.theme,
        characteristics: tripMetadata.characteristics,
        recommended_seasons: tripMetadata.recommended_seasons,
        tags: tripMetadata.tags,
        travelDate: tripMetadata.travelDate ? new Date(tripMetadata.travelDate) : null,
        stages: await this.parseStages(`${this.basePath}${expectedFolder}/tappe/`, tripMetadata.stages || []),
        media: await this.parseMedia(`${this.basePath}${expectedFolder}/media/`),
        gpxFile: await this.parseGpxFile(`${this.basePath}${expectedFolder}/main.gpx`),
        folderName: expectedFolder,
      }
      
      trips.push(trip)
    }
    
    return trips
  }

  private async parseStages(stagesBasePath: string, stageMetadata: { title: string; description?: string; routeType?: string; duration?: string }[]): Promise<ParsedStage[]> {
    const stages: ParsedStage[] = []
    
    // Get numbered stage folders
    const stageFolders = this.getNumberedFolders(stagesBasePath)
    
    for (let i = 0; i < Math.max(stageMetadata.length, stageFolders.length); i++) {
      const metadata = stageMetadata[i]
      const folder = stageFolders[i]
      
      if (!metadata && !folder) continue
      
      if (!folder) {
        throw new Error(`Cartella mancante per tappa ${i + 1} in ${stagesBasePath}`)
      }
      
      // Extract title from folder name if not in metadata
      const folderTitle = this.extractTitleFromFolder(folder)
      
      const stage: ParsedStage = {
        title: metadata?.title || folderTitle || `Tappa ${i + 1}`,
        description: metadata?.description,
        routeType: metadata?.routeType,
        duration: metadata?.duration,
        orderIndex: i,
        media: await this.parseMedia(`${stagesBasePath}${folder}/media/`),
        gpxFile: await this.parseGpxFile(`${stagesBasePath}${folder}/tappa.gpx`),
        folderName: folder,
      }
      
      stages.push(stage)
    }
    
    return stages
  }

  private async parseMedia(basePath: string): Promise<ParsedMediaFile[]> {
    const media: ParsedMediaFile[] = []
    const files = this.getFilesInPath(basePath)
    
    // Sort files to make first one the hero image
    files.sort()
    
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const file = this.zip.file(filePath)
      
      if (!file) continue
      
      const filename = this.getFilename(filePath)
      const extension = this.getFileExtension(filename).toLowerCase()
      
      if (!this.isMediaFile(extension)) continue
      
      const buffer = await file.async('nodebuffer')
      const mimeType = this.getMimeType(extension)
      
      media.push({
        filename,
        buffer,
        mimeType,
        isHero: i === 0 && this.supportedImageTypes.includes(extension), // First image is hero
      })
    }
    
    return media
  }

  private async parseGpxFile(gpxPath: string): Promise<ParsedGpxFile | null> {
    const file = this.zip.file(gpxPath)
    if (!file) return null
    
    const buffer = await file.async('nodebuffer')
    const filename = this.getFilename(gpxPath)
    
    return {
      filename,
      buffer,
    }
  }

  private getNumberedFolders(basePath: string): string[] {
    const folders: string[] = []
    const pattern = new RegExp(`^${basePath}(\\d+)-([^/]+)/?$`)
    
    this.zip.forEach((relativePath) => {
      const match = relativePath.match(pattern)
      if (match) {
        const [, number, name] = match
        folders[parseInt(number) - 1] = `${number}-${name}`
      }
    })
    
    return folders.filter(Boolean)
  }

  private getFilesInPath(basePath: string): string[] {
    const files: string[] = []
    
    this.zip.forEach((relativePath) => {
      if (relativePath.startsWith(basePath) && !relativePath.endsWith('/')) {
        // Only direct files, not subdirectories
        const pathAfterBase = relativePath.substring(basePath.length)
        if (!pathAfterBase.includes('/')) {
          files.push(relativePath)
        }
      }
    })
    
    return files
  }

  private extractTitleFromFolder(folderName: string): string {
    // Extract title from "01-bolzano-ortisei" -> "Bolzano Ortisei"
    const match = folderName.match(/^\d+-(.+)$/)
    if (!match) return folderName
    
    return match[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private getFilename(filePath: string): string {
    return filePath.split('/').pop() || ''
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot) : ''
  }

  private isMediaFile(extension: string): boolean {
    return [...this.supportedImageTypes, ...this.supportedVideoTypes].includes(extension)
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
    }
    
    return mimeTypes[extension] || 'application/octet-stream'
  }

  // Validation methods
  validateZipStructure(): string[] {
    const errors: string[] = []
    
    // Check for viaggi.json at root or in subfolder
    let viaggiFile = this.zip.file('viaggi.json')
    if (!viaggiFile) {
      const viaggiPath = this.findViaggiJsonPath()
      if (viaggiPath) {
        viaggiFile = this.zip.file(viaggiPath)
      }
    }
    
    if (!viaggiFile) {
      errors.push('File viaggi.json mancante')
    }
    
    // Additional structure validations can be added here
    
    return errors
  }

  validateZipSize(): boolean {
    // Simplified size validation - the file size check is done at the API layer
    return true
  }
}