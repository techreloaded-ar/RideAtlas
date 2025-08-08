// src/components/TripBuilderChat.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Route, AlertTriangle } from 'lucide-react';
import TripRecommendationCard from '@/components/trips/TripRecommendationCard';
import DistanceWarningCard from '@/components/ui/DistanceWarningCard';
import SuggestedPrompts from '@/components/trip-builder/SuggestedPrompts';
import ItineraryDisplay from '@/components/trips/ItineraryDisplay';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tripRecommendations?: TripRecommendation[];
  distanceWarnings?: DistanceWarning[];
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

export default function TripBuilderChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente esperto per la pianificazione di viaggi in moto. Ho accesso a tutti i viaggi e le tracce GPX del sistema RideAtlas. Dimmi dove vorresti andare, quanto tempo hai a disposizione e che tipo di esperienza stai cercando, e ti aiuterò a creare l\'itinerario perfetto!',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageToSend?: string) => {
    const message = messageToSend || inputMessage.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/trip-builder/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        tripRecommendations: data.tripRecommendations || [],
        distanceWarnings: data.distanceWarnings || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova tra qualche momento.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
    handleSendMessage(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="bg-primary-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">Trip Builder AI</h2>
            <p className="text-primary-100 text-sm">
              Esperto in viaggi motociclistici • Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {message.role === 'assistant' ? (
                  <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <MarkdownRenderer content={message.content} />
                  
                  {/* Trip Recommendations */}
                  {message.tripRecommendations && message.tripRecommendations.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.tripRecommendations.length > 1 ? (
                        // Show as connected itinerary if multiple trips
                        <ItineraryDisplay
                          trips={message.tripRecommendations}
                          distanceWarnings={message.distanceWarnings}
                        />
                      ) : (
                        // Show individual trip cards if single trip
                        <>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Route className="w-4 h-4" />
                            Viaggio Consigliato:
                          </h4>
                          <div className="grid gap-3">
                            {message.tripRecommendations.map((trip) => (
                              <TripRecommendationCard key={trip.id} trip={trip} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Distance Warnings */}
                  {message.distanceWarnings && message.distanceWarnings.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        Avvisi Distanza:
                      </h4>
                      <div className="space-y-2">
                        {message.distanceWarnings.map((warning, index) => (
                          <DistanceWarningCard key={index} warning={warning} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-xs ${message.role === 'user' ? 'text-primary-200' : 'text-gray-500'} text-right`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Show suggested prompts only when there's just the initial message */}
        {messages.length === 1 && !isLoading && (
          <div className="mt-6">
            <SuggestedPrompts onPromptClick={handlePromptClick} />
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">L&apos;AI sta pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Descrivi il tuo viaggio ideale... (es: 'Vorrei un viaggio di 3 giorni in Toscana con belle curve')"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Premi Invio per inviare, Shift+Invio per andare a capo
        </p>
      </div>
    </div>
  );
}
