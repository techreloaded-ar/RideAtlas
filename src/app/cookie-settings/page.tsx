'use client';

import { useState, useEffect } from 'react';
import { Cookie, Check, X, Shield, Video, BarChart3 } from 'lucide-react';
import { cookieConsentService, CookieCategory, type CookieConsentState } from '@/lib/ui/cookie-consent';

export default function CookieSettingsPage() {
  const [consents, setConsents] = useState<CookieConsentState>(cookieConsentService.getAllConsents());
  const [isClient, setIsClient] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = cookieConsentService.onConsentChange((newConsents) => {
      setConsents(newConsents);
      setHasChanges(false);
    });
    return unsubscribe;
  }, []);

  const handleToggleConsent = (category: CookieCategory, enabled: boolean) => {
    const newConsents = { ...consents, [category]: enabled };
    setConsents(newConsents);
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    Object.entries(consents).forEach(([category, enabled]) => {
      cookieConsentService.setConsent(category as CookieCategory, enabled);
    });
    setHasChanges(false);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      [CookieCategory.ESSENTIAL]: true,
      [CookieCategory.FUNCTIONAL]: true,
      [CookieCategory.EXTERNAL_VIDEOS]: true,
      [CookieCategory.ANALYTICS]: true,
    };
    setConsents(allEnabled);
    setHasChanges(true);
  };

  const handleRejectAll = () => {
    const minimalConsents = {
      [CookieCategory.ESSENTIAL]: true, // Cannot be disabled
      [CookieCategory.FUNCTIONAL]: false,
      [CookieCategory.EXTERNAL_VIDEOS]: false,
      [CookieCategory.ANALYTICS]: false,
    };
    setConsents(minimalConsents);
    setHasChanges(true);
  };

  const handleResetSettings = () => {
    cookieConsentService.resetConsents();
    setHasChanges(false);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  // Prevent hydration mismatch
  if (!isClient) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl">Caricamento...</div>;
  }

  const cookieCategories = [
    {
      id: CookieCategory.ESSENTIAL,
      name: 'Cookie Essenziali',
      description: 'Necessari per il funzionamento base del sito, inclusi login e navigazione. Non possono essere disabilitati.',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      required: true,
      details: [
        'Token di autenticazione',
        'Preferenze di sessione',
        'Protezioni CSRF',
        'Stato della navigazione'
      ]
    },
    {
      id: CookieCategory.FUNCTIONAL,
      name: 'Cookie Funzionali',
      description: 'Migliorano l\'esperienza utente salvando preferenze e impostazioni personalizzate.',
      icon: Cookie,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      required: false,
      details: [
        'Preferenze tema (chiaro/scuro)',
        'Impostazioni interfaccia',
        'Preferenze lingua',
        'Layout personalizzato'
      ]
    },
    {
      id: CookieCategory.EXTERNAL_VIDEOS,
      name: 'Video Esterni',
      description: 'Permettono di visualizzare video YouTube incorporati nei contenuti del sito.',
      icon: Video,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      required: false,
      details: [
        'Caricamento video YouTube',
        'Controlli di riproduzione',
        'Statistiche visualizzazione',
        'Cookie di YouTube'
      ]
    },
    {
      id: CookieCategory.ANALYTICS,
      name: 'Cookie Analytics',
      description: 'Ci aiutano a capire come gli utenti utilizzano il sito per migliorarne il funzionamento (funzionalità futura).',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      required: false,
      details: [
        'Statistiche pagine visitate',
        'Tempo di permanenza',
        'Interazioni utente',
        'Prestazioni sito (futuro)'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cookie className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Impostazioni Cookie</h1>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Gestisci le tue preferenze sui cookie. Puoi abilitare o disabilitare diverse categorie 
          di cookie in base alle tue preferenze di privacy. I cookie essenziali sono sempre attivi 
          per garantire il funzionamento del sito.
        </p>
      </div>

      {/* Success Message */}
      {showSavedMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Impostazioni salvate con successo!</span>
        </div>
      )}

      {/* Cookie Categories */}
      <div className="space-y-6 mb-8">
        {cookieCategories.map((category) => {
          const Icon = category.icon;
          const isEnabled = consents[category.id];
          
          return (
            <div
              key={category.id}
              className={`p-6 rounded-lg border ${category.borderColor} ${category.bgColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-white ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      {category.required && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Richiesto
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{category.description}</p>
                    
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Cosa include questa categoria
                      </summary>
                      <ul className="mt-2 ml-4 list-disc space-y-1">
                        {category.details.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <div className="flex-shrink-0">
                  {category.required ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <Check className="w-4 h-4" />
                      Sempre attivo
                    </div>
                  ) : (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggleConsent(category.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${
                        isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center p-6 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium rounded-md transition-colors"
          >
            Accetta tutti
          </button>
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-gray-600 border border-gray-600 hover:bg-gray-50 font-medium rounded-md transition-colors"
          >
            Solo essenziali
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleResetSettings}
            className="px-4 py-2 text-red-600 border border-red-600 hover:bg-red-50 font-medium rounded-md transition-colors flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            {hasChanges ? 'Salva modifiche' : 'Salvato'}
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Informazioni aggiuntive</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le impostazioni vengono salvate nel tuo browser e persistono per 365 giorni</li>
          <li>• I cookie essenziali non possono essere disabilitati per garantire il funzionamento del sito</li>
          <li>• Puoi modificare queste impostazioni in qualsiasi momento tornando su questa pagina</li>
          <li>• 
            Per maggiori informazioni consulta la nostra{' '}
            <a href="/privacy-policy" className="underline hover:text-blue-900">
              Privacy Policy
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}