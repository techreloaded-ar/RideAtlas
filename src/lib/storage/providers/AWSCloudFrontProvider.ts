import { AWSBaseProvider, AWSBaseConfig } from './base/AWSBaseProvider';

/**
 * Configurazione specifica per AWS CloudFront
 */
interface AWSCloudFrontConfig extends AWSBaseConfig {
  cloudfrontDomain: string;
  customDomain?: string;
}

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
  protected config: AWSCloudFrontConfig;
  
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
    
    // Estende la configurazione base con parametri CloudFront
    this.config = {
      ...this.config,
      cloudfrontDomain,
      customDomain,
    } as AWSCloudFrontConfig;
  }
  
  /**
   * Valida la configurazione specifica CloudFront
   */
  private validateCloudFrontConfiguration(): void {
    const { cloudfrontDomain } = this.config;
    
    if (!cloudfrontDomain) {
      throw new Error(
        'Configurazione AWS CloudFront incompleta. Verificare la variabile d\'ambiente: ' +
        'AWS_CLOUDFRONT_DOMAIN'
      );
    }
    
    console.log(`AWSCloudFrontProvider: Configurazione CloudFront caricata per dominio '${cloudfrontDomain}'`);
    
    if (this.config.customDomain) {
      console.log(`AWSCloudFrontProvider: Dominio personalizzato configurato: '${this.config.customDomain}'`);
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
    const domain = this.config.customDomain || this.config.cloudfrontDomain;
    
    // Assicura che il dominio abbia il protocollo HTTPS
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // Rimuovi trailing slash dal dominio
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    // Genera l'URL finale
    return `${cleanBaseUrl}/${key}`;
  }
}
