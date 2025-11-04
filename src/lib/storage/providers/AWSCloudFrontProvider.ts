import { AWSBaseProvider } from './base/AWSBaseProvider';

/**
 * Implementazione del provider AWS CloudFront
 * Estende AWSBaseProvider per riutilizzare la logica comune di upload/delete
 * Gestisce la generazione URL specifica per CloudFront CDN
 *
 * Vantaggi CloudFront:
 * - Cache globale per performance ottimali
 * - Latenza ridotta tramite edge locations
 * - Costi ottimizzati per il traffico
 * - SSL/TLS automatico
 * - Protezione DDoS integrata
 */
export class AWSCloudFrontProvider extends AWSBaseProvider {
  private cloudfrontConfig: {
    cloudfrontDomain: string;
    customDomain?: string;
  } = { cloudfrontDomain: '' }; // Inizializzazione di default

  constructor() {
    super(); // Chiama il costruttore della classe base
    // Carica configurazione specifica CloudFront dopo l'inizializzazione base
    this.loadCloudFrontConfiguration();
    this.validateCloudFrontConfiguration();
  }

  /**
   * Carica la configurazione specifica CloudFront
   */
  private loadCloudFrontConfiguration(): void {
    const cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN || '';
    const customDomain = process.env.AWS_CLOUDFRONT_CUSTOM_DOMAIN;

    // Configurazione specifica CloudFront separata dalla base
    this.cloudfrontConfig = {
      cloudfrontDomain,
      customDomain,
    };
  }
  
  /**
   * Valida la configurazione specifica CloudFront
   */
  private validateCloudFrontConfiguration(): void {
    const { cloudfrontDomain } = this.cloudfrontConfig;

    if (!cloudfrontDomain) {
      throw new Error(
        'Configurazione AWS CloudFront incompleta. Verificare la variabile d\'ambiente: ' +
        'AWS_CLOUDFRONT_DOMAIN'
      );
    }

    

    if (this.cloudfrontConfig.customDomain) {
      
    }
  }
  
  /**
   * Genera l'URL pubblico per un file tramite CloudFront CDN
   * Override del metodo astratto della classe base
   *
   * Priorità URL:
   * 1. Custom Domain (se configurato): https://cdn.rideatlas.com/path/file.ext
   * 2. CloudFront Domain: https://d1234567890.cloudfront.net/path/file.ext
   */
  protected generatePublicUrl(key: string): string {
    // Usa il dominio personalizzato se configurato, altrimenti il dominio CloudFront
    const domain = this.cloudfrontConfig.customDomain || this.cloudfrontConfig.cloudfrontDomain;

    // Assicura che il dominio abbia il protocollo HTTPS
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    // Rimuovi trailing slash dal dominio
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Genera l'URL finale
    return `${cleanBaseUrl}/${key}`;
  }
}
