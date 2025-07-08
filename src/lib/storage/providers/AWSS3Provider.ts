import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { IFileStorageProvider } from '../interfaces/IFileStorageProvider';
import { UploadResult, UploadOptions } from '../types/storage';

/**
 * Configurazione interna per AWS S3
 */
interface AWSS3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // Per servizi S3-compatible (MinIO, DigitalOcean Spaces, etc.)
}

/**
 * Implementazione del provider AWS S3
 * Gestisce internamente la configurazione specifica di AWS S3
 */
export class AWSS3Provider implements IFileStorageProvider {
  private config: AWSS3Config;
  private s3Client: S3Client;
  private bucketInitialized: boolean = false;
  
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    this.s3Client = this.createS3Client();
    // L'inizializzazione del bucket verrà fatta lazy al primo upload
  }
  
  /**
   * Carica la configurazione AWS dalle variabili d'ambiente
   */
  private loadConfiguration(): AWSS3Config {
    const config: AWSS3Config = {
      region: process.env.AWS_REGION || '',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT, // Opzionale per servizi S3-compatible
    };
    
    return config;
  }
  
  /**
   * Valida che tutte le configurazioni richieste siano presenti
   */
  private validateConfiguration(): void {
    const { region, bucket, accessKeyId, secretAccessKey } = this.config;
    
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Configurazione AWS S3 incompleta. Verificare le variabili d\'ambiente: ' +
        'AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'
      );
    }
    
    console.log(`AWSS3Provider: Configurazione caricata per bucket '${bucket}' in regione '${region}'`);
  }
  
  /**
   * Crea il client S3 con la configurazione caricata
   */
  private createS3Client(): S3Client {
    const clientConfig: S3ClientConfig = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };
    
    // Supporto per endpoint personalizzati (MinIO, DigitalOcean Spaces, etc.)
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = true; // Necessario per alcuni servizi S3-compatible
      console.log(`AWSS3Provider: Usando endpoint personalizzato: ${this.config.endpoint}`);
    }
    
    return new S3Client(clientConfig);
  }
  
  /**
   * Inizializza il provider verificando l'accesso al bucket (lazy initialization)
   */
  private async ensureBucketInitialized(): Promise<void> {
    if (this.bucketInitialized) {
      return;
    }
    
    try {
      // Verifica che il bucket sia accessibile
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
      console.log(`AWSS3Provider: Connessione al bucket '${this.config.bucket}' verificata`);
      this.bucketInitialized = true;
    } catch (error) {
      console.error(`AWSS3Provider: Errore verifica bucket '${this.config.bucket}':`, error);
      throw new Error(`Bucket S3 '${this.config.bucket}' non accessibile. Verificare credenziali e permessi.`);
    }
  }
  
  /**
   * Carica un file su AWS S3
   */
  async uploadFile(
    file: File, 
    fileName: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Verifica l'accesso al bucket al primo upload
      await this.ensureBucketInitialized();
      
      const key = this.generateS3Key(fileName, options);
      
      // Converte il File in Buffer per S3
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      const putCommand = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
        ContentLength: file.size,
        // Rimosso ACL per compatibilità con bucket che hanno ACL disabilitati
        // L'accesso pubblico deve essere configurato tramite Bucket Policy
        // Metadata opzionali
        Metadata: {
          'original-filename': file.name,
          'upload-timestamp': Date.now().toString(),
        },
      });
      
      await this.s3Client.send(putCommand);
      
      const url = this.generatePublicUrl(key);
      console.log(`File caricato su AWS S3: ${url}`);
      
      return {
        url,
        publicId: key, // Usiamo solo la key S3 come publicId
        fileName: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Errore upload AWS S3:', error);
      throw new Error('Errore durante l\'upload del file su AWS S3');
    }
  }
  
  /**
   * Elimina un file da AWS S3
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: publicId, // publicId è la key S3
      });
      
      await this.s3Client.send(deleteCommand);
      console.log(`File eliminato da AWS S3: ${publicId}`);
    } catch (error) {
      console.error('Errore eliminazione file AWS S3:', error);
      throw new Error('Errore durante l\'eliminazione del file da AWS S3');
    }
  }
  
  /**
   * Ottiene l'URL pubblico di un file
   */
  getFileUrl(publicId: string): string {
    return this.generatePublicUrl(publicId);
  }
  
  /**
   * Valida un file prima dell'upload
   */
  async validateFile(file: File): Promise<boolean> {
    // Validazioni tecniche specifiche per S3
    console.log(`Validazione file AWS S3: ${file.name}, dimensione: ${file.size} bytes`);
    
    // S3 ha un limite di 5TB per file singolo, ma per ora non implementiamo multipart
    const maxSingleUploadSize = 5 * 1024 * 1024 * 1024; // 5GB (limite pratico per singolo upload)
    
    if (file.size > maxSingleUploadSize) {
      console.warn(`File troppo grande per upload singolo S3: ${file.size} bytes`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Genera la key S3 per il file mantenendo la struttura compatibile con Vercel
   */
  private generateS3Key(fileName: string, options: UploadOptions): string {
    if (options.folder && options.userId) {
      // Struttura per file con cartelle (es. GPX) - identica a Vercel
      const timestamp = Date.now();
      const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${options.userId}-${timestamp}-${sanitizedFilename}`;
      return `${options.folder}/${options.userId}/${filename}`;
    }
    
    // Struttura per media generici - identica a Vercel
    return fileName;
  }
  
  /**
   * Genera l'URL pubblico per un file S3
   */
  private generatePublicUrl(key: string): string {
    if (this.config.endpoint) {
      // URL per servizi S3-compatible con endpoint personalizzato
      const cleanEndpoint = this.config.endpoint.replace(/\/$/, ''); // Rimuovi trailing slash
      return `${cleanEndpoint}/${this.config.bucket}/${key}`;
    }
    
    // URL standard AWS S3
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
} 