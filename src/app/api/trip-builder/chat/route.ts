// src/app/api/trip-builder/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { TripAnalysisService } from '@/lib/tripAnalysisService';
import { ConstraintValidationService } from '@/lib/constraintValidationService';
import { DurationValidationService } from '@/lib/durationValidationService';

export const dynamic = 'force-dynamic';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TripRecommendation {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  summary: string;
  slug: string;
}

interface DistanceWarning {
  fromTrip: string;
  toTrip: string;
  distance: number;
  message: string;
}

interface ChatResponse {
  message: string;
  tripRecommendations?: TripRecommendation[];
  distanceWarnings?: DistanceWarning[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Processing chatbot request for user:', session.user.id);

    // Extract user constraints before processing
    const userConstraints = ConstraintValidationService.extractConstraints(message);
    const durationConstraint = DurationValidationService.extractDurationConstraint(message);

    console.log('Extracted constraints:', { userConstraints, durationConstraint });

    // Fetch available trips for AI analysis
    const tripsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/trip-builder/trips`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!tripsResponse.ok) {
      throw new Error('Failed to fetch trips data');
    }

    const tripsData = await tripsResponse.json();
    let trips = tripsData.trips;

    // Pre-filter trips based on constraints
    if (userConstraints.region || userConstraints.location) {
      const constraintValidation = ConstraintValidationService.validateTripCollection(trips, userConstraints);
      trips = constraintValidation.validTrips;

      if (constraintValidation.violations.length > 0) {
        console.log('Constraint violations found:', constraintValidation.violations);
      }
    }

    // Generate dynamic constraint information
    const constraintInfo = [];
    if (durationConstraint) {
      constraintInfo.push(DurationValidationService.generateDurationPrompt(durationConstraint));
    }
    if (userConstraints.region || userConstraints.location) {
      constraintInfo.push(ConstraintValidationService.generateConstraintSummary(userConstraints));
    }

    // Prepare the system prompt with trip data and strict constraints
    const systemPrompt = `Sei un esperto organizzatore di viaggi in moto con una conoscenza approfondita di tutti i viaggi disponibili nel sistema RideAtlas.

Il tuo compito è aiutare gli utenti a pianificare viaggi in moto personalizzati analizzando le loro richieste e suggerendo ESCLUSIVAMENTE combinazioni di viaggi esistenti nel database.

⚠️ VINCOLI ASSOLUTI - NON VIOLARE MAI:
1. DURATA: Se l'utente specifica un numero di giorni (es. "3 giorni", "una settimana"), NON SUPERARE MAI questo limite
2. GEOGRAFIA: Suggerisci SOLO viaggi nella regione/area specificata dall'utente (es. se dice "Marche", solo viaggi nelle Marche)
3. RAGGIO: Mantieni i viaggi entro 30km dalla località specificata o nella stessa regione amministrativa
4. DATABASE: Suggerisci SOLO viaggi presenti in questo elenco - NON inventare viaggi inesistenti

${constraintInfo.length > 0 ? `
🎯 VINCOLI SPECIFICI PER QUESTA RICHIESTA:
${constraintInfo.join('\n')}
` : ''}

VIAGGI DISPONIBILI:
${trips.map((trip: any) => `
- ID: ${trip.id}
- Titolo: ${trip.title}
- Destinazione: ${trip.destination}
- Durata: ${trip.duration_days} giorni / ${trip.duration_nights} notti
- Tema: ${trip.theme}
- Caratteristiche: ${trip.characteristics.join(', ')}
- Stagioni consigliate: ${trip.recommended_seasons.join(', ')}
- Riassunto: ${trip.summary}
- Insights: ${trip.insights || 'N/A'}
- GPX disponibile: ${trip.gpxData?.hasGpx ? 'Sì' : 'No'}
${trip.gpxData?.hasGpx ? `- Distanza GPX: ${trip.gpxData.distance}km (DATO PRECISO)` : ''}
${trip.gpxData?.hasGpx ? `- Dislivello: ${trip.gpxData.elevationGain}m` : ''}
${trip.gpxData?.hasGpx ? `- Tempo stimato: ${Math.round((trip.gpxData.distance || 0) / 50 * 60)} minuti di guida` : ''}
${trip.gpxData?.hasGpx ? `- Difficoltà tecnica: ${trip.gpxData.elevationGain > 1000 ? 'Alta' : trip.gpxData.elevationGain > 500 ? 'Media' : 'Bassa'}` : ''}
`).join('\n')}

PROCESSO DI VALIDAZIONE OBBLIGATORIO:
1. Estrai i vincoli dall'utente (durata massima, regione/località)
2. Filtra i viaggi che rispettano TUTTI i vincoli geografici
3. Calcola la durata totale e assicurati che NON superi il limite
4. Se la durata supera il limite, rimuovi viaggi fino a rientrare nel limite
5. Usa i dati GPX per calcoli di distanza accurati quando disponibili

ISTRUZIONI OPERATIVE:
1. Analizza la richiesta dell'utente per capire le sue preferenze
2. Applica RIGOROSAMENTE i vincoli geografici e di durata
3. Suggerisci SOLO viaggi che rispettano tutti i vincoli
4. Se devi escludere viaggi per rispettare i vincoli, spiegalo chiaramente
5. Calcola distanze usando i dati GPX quando disponibili
6. Avvisa se la distanza tra viaggi supera i 30km
7. Fornisci consigli pratici basati sui dati reali dei viaggi

FORMATO RISPOSTA:
- Rispondi in italiano
- Sii specifico sui viaggi che suggerisci (usa i titoli esatti)
- Menziona sempre la durata totale e verifica che rispetti il limite
- Spiega eventuali esclusioni dovute ai vincoli
- Includi informazioni sui dati GPX quando disponibili
- Mantieni un tono professionale ma amichevole

RICORDA: È meglio suggerire meno viaggi che rispettano i vincoli piuttosto che violare i limiti dell'utente.`;

    // Prepare messages for OpenRouter
    const messages: Message[] = [
      { role: 'assistant', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Include recent conversation history
      { role: 'user', content: message }
    ];

    // Get model from environment variable with fallback
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || '',
        'X-Title': 'RideAtlas Trip Builder',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error('Failed to get response from AI service');
    }

    const aiResponse = await openRouterResponse.json();
    const aiMessage = aiResponse.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI service');
    }

    // Use enhanced trip analysis service
    const analysisResult = TripAnalysisService.analyzeTrips(trips, message);

    // Extract trip recommendations from AI response and merge with analysis
    const mentionedTrips: TripRecommendation[] = [];

    // Simple pattern matching to find mentioned trips in AI response
    trips.forEach((trip: any) => {
      if (aiMessage.toLowerCase().includes(trip.title.toLowerCase())) {
        mentionedTrips.push({
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          duration_days: trip.duration_days,
          summary: trip.summary,
          slug: trip.slug,
        });
      }
    });

    // Validate mentioned trips against constraints
    let validatedTrips = mentionedTrips;
    let validationWarnings: string[] = [];

    if (durationConstraint && mentionedTrips.length > 0) {
      const durationValidation = DurationValidationService.validateTripDuration(
        mentionedTrips.map(trip => ({
          id: trip.id,
          title: trip.title,
          duration_days: trip.duration_days,
          relevanceScore: analysisResult.recommendations.find(r => r.id === trip.id)?.relevanceScore
        })),
        durationConstraint
      );

      if (!durationValidation.isValid || durationValidation.exceedsLimit) {
        validatedTrips = durationValidation.validTrips.map(vt =>
          mentionedTrips.find(mt => mt.id === vt.id)!
        ).filter(Boolean);
        validationWarnings.push(...durationValidation.warnings);
      }
    }

    // Combine validated AI-mentioned trips with analysis recommendations
    const allRecommendations = [...validatedTrips];
    analysisResult.recommendations.forEach(rec => {
      if (!allRecommendations.find(t => t.id === rec.id)) {
        allRecommendations.push(rec);
      }
    });

    // Apply final constraint validation to all recommendations
    let finalRecommendations = allRecommendations;

    if (durationConstraint) {
      const finalValidation = DurationValidationService.validateTripDuration(
        allRecommendations.map(trip => ({
          id: trip.id,
          title: trip.title,
          duration_days: trip.duration_days,
          relevanceScore: analysisResult.recommendations.find(r => r.id === trip.id)?.relevanceScore
        })),
        durationConstraint
      );

      if (finalValidation.isValid) {
        finalRecommendations = finalValidation.validTrips.map(vt =>
          allRecommendations.find(ar => ar.id === vt.id)!
        ).filter(Boolean);
        validationWarnings.push(...finalValidation.warnings);
      }
    }

    // Limit to top recommendations
    finalRecommendations = finalRecommendations.slice(0, 5);

    // If multiple trips, optimize the order for better travel flow
    if (finalRecommendations.length > 1) {
      // Convert to the format expected by optimizeTripOrder
      const tripsForOptimization = finalRecommendations.map(trip => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        duration_days: trip.duration_days,
        summary: trip.summary,
        slug: trip.slug
      }));

      const optimizedOrder = TripAnalysisService.optimizeTripOrder(tripsForOptimization);
      finalRecommendations = optimizedOrder.map(id =>
        finalRecommendations.find(trip => trip.id === id)!
      ).filter(Boolean);
    }

    // Append validation warnings to AI message if any
    let finalMessage = aiMessage;
    if (validationWarnings.length > 0) {
      finalMessage += '\n\n⚠️ ' + validationWarnings.join('\n⚠️ ');
    }

    const response: ChatResponse = {
      message: finalMessage,
      tripRecommendations: finalRecommendations.length > 0 ? finalRecommendations : undefined,
      distanceWarnings: analysisResult.distanceWarnings.length > 0 ? analysisResult.distanceWarnings : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chatbot API:', error);
    return NextResponse.json(
      { 
        message: 'Mi dispiace, si è verificato un errore tecnico. Riprova tra qualche momento.',
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
