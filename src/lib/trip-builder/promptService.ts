interface Trip {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  theme: string;
  characteristics: string[];
  recommended_seasons: string[];
  summary: string;
  insights?: string;
  gpxData?: {
    hasGpx: boolean;
    distance?: number;
    elevationGain?: number;
    elevationLoss?: number;
    maxElevation?: number;
    minElevation?: number;
    startPoint?: { lat: number; lng: number };
    endPoint?: { lat: number; lng: number };
    keyPoints?: Array<{ description: string; lat: number; lng: number }>;
  };
}

export class PromptService {
  static buildSystemPrompt(
    trips: Trip[],
    constraintInfo: string[]
  ): string {
    const basePrompt = `Sei un esperto organizzatore di viaggi in moto con una conoscenza approfondita di tutti i viaggi disponibili nel sistema RideAtlas.

Il tuo compito è aiutare gli utenti a pianificare viaggi in moto personalizzati analizzando le loro richieste e suggerendo ESCLUSIVAMENTE combinazioni di viaggi esistenti nel database.

⚠️ VINCOLI ASSOLUTI - NON VIOLARE MAI:
1. DURATA: Se l'utente specifica un numero di giorni (es. "3 giorni", "una settimana"), NON SUPERARE MAI questo limite
2. GEOGRAFIA: Suggerisci SOLO viaggi nella regione/area specificata dall'utente (es. se dice "Marche", solo viaggi nelle Marche)
3. RAGGIO: Mantieni i viaggi entro 30km dalla località specificata o nella stessa regione amministrativa
4. DATABASE: Suggerisci SOLO viaggi presenti in questo elenco - NON inventare viaggi inesistenti`;

    const constraintsSection = constraintInfo.length > 0 
      ? `\n\n🎯 VINCOLI SPECIFICI PER QUESTA RICHIESTA:\n${constraintInfo.join('\n')}`
      : '';

    const tripsSection = this.buildTripsSection(trips);
    const instructionsSection = this.buildInstructionsSection();

    return `${basePrompt}${constraintsSection}\n\n${tripsSection}\n\n${instructionsSection}`;
  }

  private static buildTripsSection(trips: Trip[]): string {
    const tripsList = trips.map(trip => {
      let tripInfo = `- ID: ${trip.id}
- Titolo: ${trip.title}
- Destinazione: ${trip.destination}
- Durata: ${trip.duration_days} giorni
- Tema: ${trip.theme}
- Caratteristiche: ${trip.characteristics.join(', ')}
- Stagioni consigliate: ${trip.recommended_seasons.join(', ')}
- Riassunto: ${trip.summary}
- Insights: ${trip.insights || 'N/A'}
- GPX disponibile: ${trip.gpxData?.hasGpx ? 'Sì' : 'No'}`;

      if (trip.gpxData?.hasGpx) {
        tripInfo += this.buildGpxInfo(trip.gpxData);
      }

      return tripInfo;
    }).join('\n\n');

    return `VIAGGI DISPONIBILI:\n${tripsList}`;
  }

  private static buildGpxInfo(gpxData: NonNullable<Trip['gpxData']>): string {
    let gpxInfo = '';

    if (gpxData.distance) {
      // gpxData.distance è in metri, convertiamo in km
      const distanceKm = gpxData.distance / 1000;
      gpxInfo += `\n- Distanza GPX: ${distanceKm.toFixed(1)}km (DATO PRECISO)`;
      gpxInfo += `\n- Tempo stimato: ${Math.round(distanceKm / 50 * 60)} minuti di guida`;
    }
    
    if (gpxData.elevationGain) {
      gpxInfo += `\n- Dislivello positivo: ${gpxData.elevationGain}m`;
      const difficulty = gpxData.elevationGain > 1000 ? 'Alta' : 
                        gpxData.elevationGain > 500 ? 'Media' : 'Bassa';
      gpxInfo += `\n- Difficoltà tecnica: ${difficulty}`;
    }
    
    if (gpxData.elevationLoss) gpxInfo += `\n- Dislivello negativo: ${gpxData.elevationLoss}m`;
    if (gpxData.maxElevation) gpxInfo += `\n- Altitudine massima: ${gpxData.maxElevation}m`;
    if (gpxData.minElevation) gpxInfo += `\n- Altitudine minima: ${gpxData.minElevation}m`;
    
    if (gpxData.startPoint) {
      gpxInfo += `\n- Punto di partenza: ${gpxData.startPoint.lat.toFixed(4)}, ${gpxData.startPoint.lng.toFixed(4)}`;
    }
    
    if (gpxData.endPoint) {
      gpxInfo += `\n- Punto di arrivo: ${gpxData.endPoint.lat.toFixed(4)}, ${gpxData.endPoint.lng.toFixed(4)}`;
    }
    
    if (gpxData.keyPoints?.length) {
      const keyPointsStr = gpxData.keyPoints
        .map(p => `${p.description} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`)
        .join(', ');
      gpxInfo += `\n- Punti chiave del percorso: ${keyPointsStr}`;
    }

    return gpxInfo;
  }

  private static buildInstructionsSection(): string {
    return `PROCESSO DI VALIDAZIONE OBBLIGATORIO:
1. Estrai i vincoli dall'utente (durata massima, regione/località)
2. Filtra i viaggi che rispettano TUTTI i vincoli geografici
3. Calcola la durata totale e assicurati che NON superi il limite
4. Se la durata supera il limite, rimuovi viaggi fino a rientrare nel limite
5. Usa i dati GPX per calcoli di distanza accurati quando disponibili

ISTRUZIONI OPERATIVE:
1. Analizza la richiesta dell'utente per capire le sue preferenze
2. Applica RIGOROSAMENTE i vincoli geografici e di durata
3. Suggerisci SOLO viaggi che rispettano tutti i vincoli
4. Fornisci dettagli tecnici dai dati GPX quando disponibili
5. Calcola tempi di percorrenza realistici
6. Suggerisci combinazioni logiche di viaggi
7. Spiega perché hai scelto questi viaggi specifici

FORMATO RISPOSTA:
- Usa un tono amichevole e professionale
- Fornisci spiegazioni chiare delle tue scelte
- Includi dettagli pratici sui percorsi
- Suggerisci modifiche se necessario per rispettare i vincoli
- Usa emoji per rendere la risposta più accattivante`;
  }
}