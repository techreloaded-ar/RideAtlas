'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Cookie } from 'lucide-react';
import { cookieConsentService, CookieCategory } from '@/lib/cookie-consent';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);
  const [consents, setConsents] = useState(cookieConsentService.getAllConsents());

  useEffect(() => {
    // Show banner only if user hasn't made a decision yet
    setShowBanner(!cookieConsentService.hasConsentBannerBeenShown());
    
    // Listen for consent changes
    const unsubscribe = cookieConsentService.onConsentChange(setConsents);
    return unsubscribe;
  }, []);

  const handleAcceptAll = () => {
    cookieConsentService.setAllConsents({
      [CookieCategory.FUNCTIONAL]: true,
      [CookieCategory.EXTERNAL_VIDEOS]: true,
      [CookieCategory.ANALYTICS]: true,
    });
    setShowBanner(false);
    setShowDetailedSettings(false);
  };

  const handleRejectNonEssential = () => {
    cookieConsentService.setAllConsents({
      [CookieCategory.FUNCTIONAL]: false,
      [CookieCategory.EXTERNAL_VIDEOS]: false,
      [CookieCategory.ANALYTICS]: false,
    });
    setShowBanner(false);
    setShowDetailedSettings(false);
  };

  const handleSaveCustomSettings = () => {
    // Consents are already updated through toggles
    setShowBanner(false);
    setShowDetailedSettings(false);
  };

  const handleToggleConsent = (category: CookieCategory, enabled: boolean) => {
    setConsents(prev => ({ ...prev, [category]: enabled }));
    cookieConsentService.setConsent(category, enabled);
  };

  const handleCloseBanner = () => {
    // Close banner without saving - equivalent to "reject non-essential"
    handleRejectNonEssential();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-black/90 backdrop-blur-sm text-white shadow-2xl">
      <div className="max-w-7xl mx-auto p-4">
        {!showDetailedSettings ? (
          // Simple Banner View
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-lg">Utilizzo dei Cookie</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Questo sito utilizza cookie per migliorare la tua esperienza di navigazione. 
                I cookie essenziali sono sempre attivi, mentre puoi gestire quelli opzionali.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <a 
                  href="/privacy-policy" 
                  className="text-blue-300 hover:text-blue-200 underline text-sm"
                >
                  Informativa Privacy
                </a>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-fit">
              <button
                onClick={() => setShowDetailedSettings(true)}
                className="px-3 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium rounded-md transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Personalizza
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-3 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium rounded-md transition-colors"
              >
                Rifiuta opzionali
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Accetta tutti
              </button>
              <button
                onClick={handleCloseBanner}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Chiudi banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Detailed Settings View
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-lg">Impostazioni Cookie</h3>
              </div>
              <button
                onClick={() => setShowDetailedSettings(false)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Torna alle opzioni base"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <h4 className="font-medium text-white">Cookie Essenziali</h4>
                  <p className="text-sm text-gray-400">
                    Necessari per il funzionamento base del sito (login, navigazione)
                  </p>
                </div>
                <div className="text-sm text-green-400 font-medium">
                  Sempre attivi
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <h4 className="font-medium text-white">Cookie Funzionali</h4>
                  <p className="text-sm text-gray-400">
                    Migliorano l&apos;esperienza utente (preferenze, impostazioni)
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents[CookieCategory.FUNCTIONAL]}
                    onChange={(e) => handleToggleConsent(CookieCategory.FUNCTIONAL, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    consents[CookieCategory.FUNCTIONAL] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                      consents[CookieCategory.FUNCTIONAL] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>

              {/* External Videos */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <h4 className="font-medium text-white">Video Esterni</h4>
                  <p className="text-sm text-gray-400">
                    Permette di visualizzare video YouTube embedded
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents[CookieCategory.EXTERNAL_VIDEOS]}
                    onChange={(e) => handleToggleConsent(CookieCategory.EXTERNAL_VIDEOS, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    consents[CookieCategory.EXTERNAL_VIDEOS] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                      consents[CookieCategory.EXTERNAL_VIDEOS] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <h4 className="font-medium text-white">Analytics</h4>
                  <p className="text-sm text-gray-400">
                    Ci aiutano a capire come migliorare il sito
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents[CookieCategory.ANALYTICS]}
                    onChange={(e) => handleToggleConsent(CookieCategory.ANALYTICS, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    consents[CookieCategory.ANALYTICS] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                      consents[CookieCategory.ANALYTICS] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={handleSaveCustomSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex-1"
              >
                Salva impostazioni
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-medium rounded-md transition-colors"
              >
                Accetta tutti
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}