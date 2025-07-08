import { AWSBaseProvider } from './base/AWSBaseProvider';

/**
 * Implementazione del provider AWS S3
 * Estende AWSBaseProvider per riutilizzare la logica comune
 * Gestisce solo la generazione URL specifica per S3
 */
export class AWSS3Provider extends AWSBaseProvider {

  constructor() {
    super(); // Chiama il costruttore della classe base
  }

  /**
   * Genera l'URL pubblico per un file S3 standard
   * Override del metodo astratto della classe base
   */
  protected generatePublicUrl(key: string): string {
    if (this.config.endpoint) {
      // URL per servizi S3-compatible con endpoint personalizzato
      const cleanEndpoint = this.config.endpoint.replace(/\/$/, ''); // Rimuovi trailing slash
      return `${cleanEndpoint}/${this.config.bucket}/${key}`;
    }

    // URL standard AWS S3
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}