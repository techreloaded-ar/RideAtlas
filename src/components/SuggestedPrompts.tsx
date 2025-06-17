// src/components/SuggestedPrompts.tsx
"use client";

import { MessageSquare, MapPin, Clock, Route, Mountain } from 'lucide-react';

interface SuggestedPromptsProps {
  onPromptClick: (prompt: string) => void;
  className?: string;
}

const suggestedPrompts = [
  {
    icon: MapPin,
    title: "Viaggio in Toscana",
    prompt: "Vorrei un viaggio di 3-4 giorni in Toscana con belle strade panoramiche e borghi medievali",
    category: "Destinazione"
  },
  {
    icon: Mountain,
    title: "Avventura in montagna",
    prompt: "Cerco un itinerario di una settimana sulle Alpi o Dolomiti con curve spettacolari e paesaggi mozzafiato",
    category: "Tipo"
  },
  {
    icon: Clock,
    title: "Weekend lungo",
    prompt: "Ho un weekend lungo (3 giorni) e vorrei esplorare il centro Italia con la moto",
    category: "Durata"
  },
  {
    icon: Route,
    title: "Viaggio combinato",
    prompt: "Vorrei combinare più viaggi per creare un itinerario di 10 giorni dal Nord al Sud Italia",
    category: "Combinato"
  },
  {
    icon: MapPin,
    title: "Costa e mare",
    prompt: "Cerco un viaggio lungo la costa con belle strade panoramiche sul mare, preferibilmente in primavera",
    category: "Destinazione"
  },
  {
    icon: Mountain,
    title: "Strade sterrate",
    prompt: "Mi piacciono le avventure off-road, hai viaggi con strade sterrate e panorami selvaggi?",
    category: "Tipo"
  }
];

export default function SuggestedPrompts({ onPromptClick, className = '' }: SuggestedPromptsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Inizia con una di queste idee
        </h3>
        <p className="text-gray-600 text-sm">
          Clicca su un suggerimento per iniziare la conversazione
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestedPrompts.map((prompt, index) => {
          const IconComponent = prompt.icon;
          return (
            <button
              key={index}
              onClick={() => onPromptClick(prompt.prompt)}
              className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <IconComponent className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{prompt.title}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {prompt.prompt}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <MessageSquare className="w-4 h-4" />
          <span>Oppure scrivi la tua richiesta personalizzata qui sotto</span>
        </div>
      </div>
    </div>
  );
}
