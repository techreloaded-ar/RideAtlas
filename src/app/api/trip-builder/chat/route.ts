// src/app/api/trip-builder/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { TripAnalysisService } from '@/lib/tripAnalysisService';

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
    const trips = tripsData.trips;

    // Prepare the system prompt with trip data
    const systemPrompt = `Sei un esperto organizzatore di viaggi in moto con una conoscenza approfondita di tutti i viaggi disponibili nel sistema RideAtlas. 

Il tuo compito è aiutare gli utenti a pianificare viaggi in moto personalizzati analizzando le loro richieste e suggerendo combinazioni di viaggi esistenti.

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
${trip.gpxData?.hasGpx ? `- Distanza GPX: ${trip.gpxData.distance}km` : ''}
${trip.gpxData?.hasGpx ? `- Dislivello: ${trip.gpxData.elevationGain}m` : ''}
`).join('\n')}

ISTRUZIONI:
1. Analizza la richiesta dell'utente per capire le sue preferenze (destinazione, durata, tipo di esperienza, stagione, ecc.)
2. Suggerisci viaggi specifici che corrispondono alle sue esigenze
3. Se possibile, crea itinerari collegando più viaggi
4. Calcola le distanze approssimative tra le destinazioni dei viaggi
5. IMPORTANTE: Avvisa sempre l'utente quando la distanza tra due viaggi supera i 30km
6. Fornisci consigli pratici e personalizzati
7. Mantieni un tono amichevole ed esperto

FORMATO RISPOSTA:
- Rispondi in italiano
- Sii specifico sui viaggi che suggerisci
- Includi sempre i titoli esatti dei viaggi
- Menziona le caratteristiche rilevanti (curve, sterrato, paesaggio, ecc.)
- Se suggerisci più viaggi, spiega come collegarli logicamente

Rispondi sempre come un esperto motociclista che conosce perfettamente tutti questi itinerari.`;

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

    // Combine AI-mentioned trips with analysis recommendations
    const allRecommendations = [...mentionedTrips];
    analysisResult.recommendations.forEach(rec => {
      if (!allRecommendations.find(t => t.id === rec.id)) {
        allRecommendations.push(rec);
      }
    });

    // Limit to top recommendations and optimize order
    let finalRecommendations = allRecommendations.slice(0, 5);

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

    const response: ChatResponse = {
      message: aiMessage,
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
