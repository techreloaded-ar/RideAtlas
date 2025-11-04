// src/lib/batch/ZipParser.ts
import JSZip from 'jszip'
import { BatchUpload, isSingleTripBatch, isMultipleTripsBatch, BatchTrip } from '@/schemas/batch-trip'
import { 
  VALID_CHARACTERISTICS, 
  VALID_SEASONS, 
  SUPPORTED_IMAGE_TYPES, 
  SUPPORTED_VIDEO_TYPES, 
  SYSTEM_FILES_TO_IGNORE 
} from './BatchConstants'

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
  private basePath: string = '' // Will be set if files are in a subfolder

  constructor() {
    this.zip = new JSZip()
  }

  /**
   * Check if a file should be ignored (system files, temp files, etc.)
   */
  private shouldIgnoreFile(filePath: string): boolean {
    const fileName = this.getFilename(filePath).toLowerCase()
    const pathSegments = filePath.toLowerCase().split('/')
    
    // Check if any path segment or filename matches system files to ignore
    for (const segment of pathSegments) {
      if (SYSTEM_FILES_TO_IGNORE.includes(segment)) {
        return true
      }
    }
    
    // Check if filename matches system files to ignore
    if (SYSTEM_FILES_TO_IGNORE.includes(fileName)) {
      return true
    }
    
    // Check for common patterns
    if (fileName.startsWith('.')) {
      return true // Hidden files
    }
    
    if (fileName.endsWith('.tmp') || fileName.endsWith('.temp')) {
      return true // Temporary files
    }
    
    return false
  }

  async loadZip(zipBuffer: Buffer): Promise<void> {
    try {
      
      
      if (zipBuffer.length === 0) {
        throw new Error('ZIP buffer è vuoto')
      }
      
      if (zipBuffer.length > 100 * 1024 * 1024) { // 100MB
        throw new Error('ZIP buffer troppo grande')
      }
      
      this.zip = await JSZip.loadAsync(zipBuffer, {
        checkCRC32: true,
        createFolders: false
      })
      
      
      
      // Log system files that will be ignored
      const ignoredFiles: string[] = []
      this.zip.forEach((relativePath) => {
        if (this.shouldIgnoreFile(relativePath)) {
          ignoredFiles.push(relativePath)
        }
      })
      
      if (ignoredFiles.length > 0) {
        
      }
    } catch (error) {
      console.error('Error loading ZIP file:', error)
      if (error instanceof Error) {
        throw new Error(`Errore caricamento ZIP: ${error.message}`)
      }
      throw new Error('Errore sconosciuto durante il caricamento del ZIP')
    }
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
      console.error('viaggi.json file not found in ZIP')
      throw new Error('File viaggi.json non trovato nel ZIP. Assicurati che sia presente nella cartella principale o in una sottocartella.')
    }

    try {
      const content = await viaggiFile.async('text')
      
      
      if (!content || content.trim().length === 0) {
        throw new Error('File viaggi.json è vuoto. Aggiungi i metadati del viaggio nel formato JSON richiesto.')
      }
      
      const parsed = JSON.parse(content)
      
      
      // Validate content after parsing
      this.validateViaggiJsonContent(parsed)
      
      return parsed
    } catch (error) {
      console.error('Error parsing viaggi.json:', error)
      if (error instanceof SyntaxError) {
        throw new Error(`File viaggi.json non è un JSON valido. Errore: ${error.message}. Controlla la sintassi JSON.`)
      }
      throw error
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
    
    // Filter out system files and sort remaining files to make first one the hero image
    const validFiles = files.filter(filePath => !this.shouldIgnoreFile(filePath))
    validFiles.sort()
    
    for (let i = 0; i < validFiles.length; i++) {
      const filePath = validFiles[i]
      const file = this.zip.file(filePath)
      
      if (!file) continue
      
      const filename = this.getFilename(filePath)
      const extension = this.getFileExtension(filename).toLowerCase()
      
      if (!this.isMediaFile(extension)) continue
      
      let buffer: Buffer
      try {
        buffer = await file.async('nodebuffer')
      } catch (error) {
        console.warn(`Failed to extract buffer for media file ${filename}:`, error)
        continue
      }
      
      if (!buffer || buffer.length === 0) {
        console.warn(`Empty buffer for media file ${filename}, skipping`)
        continue
      }
      
      const mimeType = this.getMimeType(extension)
      
      media.push({
        filename,
        buffer,
        mimeType,
        isHero: i === 0 && SUPPORTED_IMAGE_TYPES.includes(extension), // First image is hero
      })
    }
    
    return media
  }

  private async parseGpxFile(gpxPath: string): Promise<ParsedGpxFile | null> {
    const file = this.zip.file(gpxPath)
    if (!file) return null
    
    let buffer: Buffer
    try {
      buffer = await file.async('nodebuffer')
    } catch (error) {
      console.error(`Failed to extract buffer for GPX file ${gpxPath}:`, error)
      throw new Error(`Errore estrazione file GPX: ${gpxPath}`)
    }
    
    if (!buffer || buffer.length === 0) {
      console.warn(`Empty buffer for GPX file ${gpxPath}`)
      return null
    }
    
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
      // Skip system files
      if (this.shouldIgnoreFile(relativePath)) {
        return
      }
      
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
    return [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES].includes(extension)
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

  // Enhanced content validation for viaggi.json
  private validateViaggiJsonContent(data: unknown): void {
    // First check if data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Il file viaggi.json deve contenere un oggetto JSON valido.')
    }
    
    const dataObj = data as Record<string, unknown>
    
    // Check if it's single trip or multiple trips format
    if ('viaggi' in dataObj) {
      // Multiple trips format
      if (!Array.isArray(dataObj.viaggi)) {
        throw new Error('Il campo "viaggi" deve essere un array nel formato batch multipli.')
      }
      
      dataObj.viaggi.forEach((trip: Record<string, unknown>, index: number) => {
        this.validateSingleTripData(trip, `Viaggio ${index + 1}`)
      })
    } else {
      // Single trip format
      this.validateSingleTripData(dataObj, 'Viaggio')
    }
  }
  
  private validateSingleTripData(trip: Record<string, unknown>, context: string): void {
    // Validate required fields
    const requiredFields = ['title', 'summary', 'destination', 'theme']
    for (const field of requiredFields) {
      if (!trip[field] || typeof trip[field] !== 'string' || trip[field].trim() === '') {
        throw new Error(`${context}: Campo "${field}" mancante o vuoto. È obbligatorio.`)
      }
    }
    
    // Validate characteristics
    if (trip.characteristics) {
      if (!Array.isArray(trip.characteristics)) {
        throw new Error(`${context}: Il campo "characteristics" deve essere un array.`)
      }
      
      const invalidCharacteristics = trip.characteristics.filter(
        (char: string) => !(VALID_CHARACTERISTICS as readonly string[]).includes(char)
      )
      
      if (invalidCharacteristics.length > 0) {
        throw new Error(
          `${context}: Caratteristiche non valide: [${invalidCharacteristics.join(', ')}]. ` +
          `Valori consentiti: [${VALID_CHARACTERISTICS.join(', ')}]`
        )
      }
    }
    
    // Validate recommended_seasons
    if (trip.recommended_seasons) {
      if (!Array.isArray(trip.recommended_seasons)) {
        throw new Error(`${context}: Il campo "recommended_seasons" deve essere un array.`)
      }
      
      if (trip.recommended_seasons.length === 0) {
        throw new Error(`${context}: Il campo "recommended_seasons" deve contenere almeno una stagione.`)
      }
      
      const invalidSeasons = trip.recommended_seasons.filter(
        (season: string) => !(VALID_SEASONS as readonly string[]).includes(season)
      )
      
      if (invalidSeasons.length > 0) {
        throw new Error(
          `${context}: Stagioni non valide: [${invalidSeasons.join(', ')}]. ` +
          `Valori consentiti: [${VALID_SEASONS.join(', ')}]`
        )
      }
    } else {
      throw new Error(`${context}: Campo "recommended_seasons" mancante. Devi specificare almeno una stagione.`)
    }
    
    // Note: Stages validation is done during parsing, not during JSON validation
    // This allows for titles to be extracted from folder names when not provided
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
      errors.push('File viaggi.json mancante. Aggiungi il file nella root dello ZIP.')
    }
    
    // Validate folder structure for stages
    this.validateStagesFolderStructure(errors)
    
    // Validate media file formats
    this.validateMediaFileFormats(errors)
    
    return errors
  }
  
  private validateStagesFolderStructure(errors: string[]): void {
    const stageFolders: string[] = []
    const stagesPath = `${this.basePath}tappe/`
    
    this.zip.forEach((relativePath) => {
      if (relativePath.startsWith(stagesPath) && relativePath.includes('/') && relativePath !== stagesPath) {
        // Skip system files when looking for stage folders
        if (this.shouldIgnoreFile(relativePath)) {
          return
        }
        
        const folderName = relativePath.substring(stagesPath.length).split('/')[0]
        if (!stageFolders.includes(folderName)) {
          stageFolders.push(folderName)
        }
      }
    })
    
    // Check if stage folders follow numbering convention
    const invalidFolders = stageFolders.filter(folder => {
      return !folder.match(/^\d{2}-.+/)
    })
    
    if (invalidFolders.length > 0) {
      errors.push(
        `Cartelle tappe non numerate correttamente: [${invalidFolders.join(', ')}]. ` +
        `Usa il formato: 01-nome, 02-nome, etc.`
      )
    }
  }
  
  private validateMediaFileFormats(errors: string[]): void {
    const invalidFiles: string[] = []
    
    this.zip.forEach((relativePath) => {
      if (relativePath.includes('/media/') && !relativePath.endsWith('/')) {
        // Skip system files
        if (this.shouldIgnoreFile(relativePath)) {
          return
        }
        
        const filename = this.getFilename(relativePath)
        const extension = this.getFileExtension(filename).toLowerCase()
        
        if (extension && !this.isMediaFile(extension)) {
          // Check if it's a supported format according to documentation
          const supportedFormats = ['.jpg', '.jpeg', '.png', '.mp4', '.mov']
          if (!supportedFormats.includes(extension)) {
            invalidFiles.push(`${filename} (${extension})`)
          }
        }
      }
    })
    
    if (invalidFiles.length > 0) {
      errors.push(
        `File media in formato non supportato: [${invalidFiles.join(', ')}]. ` +
        `Formati supportati: JPG, PNG, MP4, MOV`
      )
    }
  }

  validateZipSize(): boolean {
    // Simplified size validation - the file size check is done at the API layer
    return true
  }
}