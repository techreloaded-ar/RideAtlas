import { BatchProcessingResult } from '@/schemas/batch-trip'

export type ErrorCategory = 'structure' | 'content' | 'media' | 'processing'

export interface CategorizedError {
  type: ErrorCategory
  errors: BatchProcessingResult['errors']
}

export class ErrorUtils {
  static getCategorizedErrors(errors: BatchProcessingResult['errors']): CategorizedError[] {
    const categories: CategorizedError[] = [
      { type: 'structure', errors: [] },
      { type: 'content', errors: [] },
      { type: 'media', errors: [] },
      { type: 'processing', errors: [] }
    ]
    
    errors.forEach(error => {
      const message = (error.message || '').toLowerCase()
      
      if (message.includes('cartelle') || message.includes('struttura') || message.includes('viaggi.json') || message.includes('zip')) {
        categories[0].errors.push(error)
      } else if (message.includes('caratteristic') || message.includes('stagion') || message.includes('campo') || message.includes('json')) {
        categories[1].errors.push(error)
      } else if (message.includes('media') || message.includes('formato') || message.includes('jpg') || message.includes('png')) {
        categories[2].errors.push(error)
      } else {
        categories[3].errors.push(error)
      }
    })
    
    return categories.filter(cat => cat.errors.length > 0)
  }
  
  static getCategoryIcon(type: ErrorCategory): string {
    switch (type) {
      case 'structure': return '📁'
      case 'content': return '📝'
      case 'media': return '🖼️'
      case 'processing': return '⚙️'
      default: return '❌'
    }
  }
  
  static getCategoryTitle(type: ErrorCategory): string {
    switch (type) {
      case 'structure': return 'Struttura ZIP'
      case 'content': return 'Contenuto viaggi.json'
      case 'media': return 'File Media'
      case 'processing': return 'Processamento'
      default: return 'Altri Errori'
    }
  }
  
  static getErrorSuggestion(error: BatchProcessingResult['errors'][0]): string | null {
    const message = (error.message || '').toLowerCase()
    
    if (message.includes('viaggi.json non trovato')) {
      return 'Aggiungi il file viaggi.json nella cartella principale dello ZIP'
    }
    if (message.includes('caratteristiche non valide')) {
      return 'Controlla che tutte le caratteristiche siano nell\'elenco valido: Strade sterrate, Curve strette, Presenza pedaggi, etc.'
    }
    if (message.includes('stagioni non valide')) {
      return 'Usa solo: Primavera, Estate, Autunno, Inverno (maiuscole/minuscole importanti)'
    }
    if (message.includes('cartelle tappe non numerate')) {
      return 'Rinomina le cartelle delle tappe con numerazione: 01-bolzano-ortisei, 02-ortisei-cortina, etc.'
    }
    if (message.includes('formato non supportato')) {
      return 'Converti i file media in JPG, PNG (immagini) o MP4, MOV (video)'
    }
    if (message.includes('json non è un json valido')) {
      return 'Verifica la sintassi JSON: controlla virgole, parentesi e apici'
    }
    if (message.includes('campo') && message.includes('mancante')) {
      return 'Aggiungi tutti i campi obbligatori nel viaggi.json'
    }
    if (message.includes('viaggio già esistente') || message.includes('cambia titolo')) {
      return 'Modifica il titolo del viaggio nel file viaggi.json per renderlo unico'
    }
    
    return null
  }
  
  static getErrorExample(error: BatchProcessingResult['errors'][0]): string | null {
    const message = (error.message || '').toLowerCase()
    
    if (message.includes('caratteristiche non valide')) {
      return '"characteristics": ["Curve strette", "Bel paesaggio"]'
    }
    if (message.includes('stagioni non valide')) {
      return '"recommended_seasons": ["Estate", "Autunno"]'
    }
    if (message.includes('cartelle tappe')) {
      return 'tappe/01-bolzano-ortisei/\ntappe/02-ortisei-cortina/'
    }
    if (message.includes('json')) {
      return '{\n  "title": "Giro delle Dolomiti",\n  "summary": "Descrizione...",\n  ...\n}'
    }
    if (message.includes('viaggio già esistente') || message.includes('cambia titolo')) {
      return '"title": "Giro delle Dolomiti - Settembre 2024"\n(aggiungi data, versione o dettaglio specifico)'
    }
    
    return null
  }

  static enhanceErrorMessage(originalMessage: string, tripIndex?: number, tripTitle?: string): string {
    if (tripIndex === undefined) return originalMessage
    
    const tripContext = tripTitle ? `"${tripTitle}"` : `${tripIndex + 1}`
    
    if (originalMessage.includes('Caratteristiche non valide')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Verifica il campo "characteristics" nel viaggi.json.`
    }
    
    if (originalMessage.includes('Stagioni non valide')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Verifica il campo "recommended_seasons" nel viaggi.json.`
    }
    
    if (originalMessage.includes('Campo') && originalMessage.includes('mancante')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Aggiungi tutti i campi obbligatori nel viaggi.json.`
    }
    
    if (originalMessage.includes('tappa') || originalMessage.includes('Tappa')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Controlla la struttura delle cartelle tappe.`
    }
    
    if (originalMessage.includes('media') || originalMessage.includes('formato')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Verifica i file nella cartella media.`
    }
    
    if (originalMessage.includes('GPX') || originalMessage.includes('gpx')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Controlla i file GPX nelle cartelle tappe.`
    }
    
    if (originalMessage.includes('Viaggio già esistente. Cambia titolo.')) {
      return `Viaggio ${tripContext}: ${originalMessage}. Un viaggio con questo titolo esiste già nel database.`
    }
    
    return `Viaggio ${tripContext}: ${originalMessage}`
  }
  
  static enhanceGeneralErrorMessage(originalMessage: string): string {
    if (originalMessage.includes('Struttura ZIP non valida')) {
      return `${originalMessage}\n\nControlla che il tuo ZIP contenga:\n• File viaggi.json nella cartella principale\n• Cartelle tappe numerate (01-nome, 02-nome)\n• File media nei formati supportati (JPG, PNG, MP4, MOV)`
    }
    
    if (originalMessage.includes('File viaggi.json non trovato')) {
      return `${originalMessage}\n\nIl file viaggi.json deve essere presente nella cartella principale dello ZIP o in una sottocartella.`
    }
    
    if (originalMessage.includes('JSON non è un JSON valido')) {
      return `${originalMessage}\n\nControlla la sintassi del tuo file viaggi.json:\n• Verifica che tutte le parentesi e virgole siano corrette\n• Usa le virgolette doppie per le stringhe\n• Non lasciare virgole finali`
    }
    
    if (originalMessage.includes('timeout') || originalMessage.includes('Timeout')) {
      return `Processamento interrotto per timeout. Il tuo ZIP potrebbe essere troppo grande o contenere troppi file. Prova a:\n• Ridurre la dimensione delle immagini\n• Rimuovere file non necessari\n• Dividere il batch in più ZIP più piccoli`
    }
    
    if (originalMessage.includes('ZIP buffer troppo grande')) {
      return `File ZIP troppo grande (massimo 100MB). Riduci le dimensioni:\n• Comprimi le immagini mantenendo buona qualità\n• Rimuovi video molto lunghi\n• Dividi il contenuto in più ZIP separati`
    }
    
    return originalMessage
  }
  
  static extractErrorField(errorMessage: string): string | undefined {
    if (errorMessage.includes('characteristics')) return 'characteristics'
    if (errorMessage.includes('recommended_seasons')) return 'recommended_seasons'
    if (errorMessage.includes('title') || errorMessage.includes('Viaggio già esistente')) return 'title'
    if (errorMessage.includes('summary')) return 'summary'
    if (errorMessage.includes('destination')) return 'destination'
    if (errorMessage.includes('theme')) return 'theme'
    if (errorMessage.includes('stages')) return 'stages'
    if (errorMessage.includes('tappa')) return 'stages'
    if (errorMessage.includes('media')) return 'media'
    if (errorMessage.includes('GPX') || errorMessage.includes('gpx')) return 'gpxFile'
    
    return undefined
  }
}