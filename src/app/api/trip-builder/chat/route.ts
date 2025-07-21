// src/app/api/trip-builder/chat/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { TripAnalysisService } from '@/lib/tripAnalysisService';
import { ValidationService } from '@/lib/validationService';
import { PromptService } from '@/lib/promptService';

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

interface ChatResponse {
  message: string;
  tripRecommendations?: TripRecommendation[];
  distanceWarnings?: any[];
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request
    const { message, conversationHistory } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Processing chatbot request for user:', session.user.id);

    // Extract constraints and fetch trips
    const userConstraints = ValidationService.extractConstraints(message);
    const trips = await fetchTrips(request);
    
    // Validate trips against constraints
    const validationResult = ValidationService.validateTrips(trips, userConstraints);
    const validTrips = validationResult.validTrips;

    console.log('Extracted constraints:', userConstraints);
    if (validationResult.violations.length > 0) {
      console.log('Constraint violations found:', validationResult.violations);
    }

    // Generate AI response
    const aiMessage = await getAIResponse(message, conversationHistory, validTrips, userConstraints);

    // Extract recommendations and analyze
    const recommendations = extractTripRecommendations(aiMessage, validTrips);
    const analysisResult = TripAnalysisService.analyzeTrips(validTrips, message);

    const response: ChatResponse = {
      message: aiMessage,
      tripRecommendations: recommendations,
      distanceWarnings: analysisResult.distanceWarnings || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chatbot API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function fetchTrips(request: NextRequest) {
  const tripsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/trip-builder/trips`, {
    headers: {
      'Cookie': request.headers.get('cookie') || '',
    },
  });

  if (!tripsResponse.ok) {
    throw new Error('Failed to fetch trips data');
  }

  const tripsData = await tripsResponse.json();
  return tripsData.trips;
}

async function getAIResponse(
  message: string, 
  conversationHistory: Message[], 
  trips: any[], 
  constraints: any
): Promise<string> {
  // Generate constraint info
  const constraintInfo = [];
  if (constraints.maxDays) {
    constraintInfo.push(ValidationService.generateDurationPrompt(constraints.maxDays));
  }
  if (constraints.region || constraints.location) {
    constraintInfo.push(ValidationService.generateConstraintSummary(constraints));
  }

  // Build system prompt
  const systemPrompt = PromptService.buildSystemPrompt(trips, constraintInfo);

  // Prepare messages
  const messages: Message[] = [
    { role: 'assistant', content: systemPrompt },
    ...(conversationHistory || []).slice(-10),
    { role: 'user', content: message }
  ];

  // Call AI service
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || '',
      'X-Title': 'RideAtlas Trip Builder',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', errorText);
    throw new Error('Failed to get response from AI service');
  }

  const aiResponse = await response.json();
  const aiMessage = aiResponse.choices[0]?.message?.content;

  if (!aiMessage) {
    throw new Error('No response from AI service');
  }

  return aiMessage;
}

function extractTripRecommendations(aiMessage: string, trips: any[]): TripRecommendation[] {
  const mentionedTrips: TripRecommendation[] = [];

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

  return mentionedTrips;
}