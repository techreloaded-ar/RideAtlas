'use client';

import { useState } from 'react';
import { Shield, Settings, ExternalLink } from 'lucide-react';
import { cookieConsentService, CookieCategory } from '@/lib/ui/cookie-consent';

interface VideoConsentBannerProps {
  thumbnailUrl: string;
  videoTitle?: string;
  onAccept: () => void;
  onManagePreferences?: () => void;
  className?: string;
}

export function VideoConsentBanner({
  thumbnailUrl,
  videoTitle,
  onAccept,
  onManagePreferences,
  className = ''
}: VideoConsentBannerProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptAndPlay = async () => {
    setIsAccepting(true);
    
    // Grant consent for external videos
    cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);
    
    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onAccept();
    setIsAccepting(false);
  };

  const handleAcceptOnce = () => {
    // Don't save consent, just play this video
    onAccept();
  };

  return (
    <div 
      className={`relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      {/* Background thumbnail (blurred) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm opacity-50"
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      
      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4">
        <div className="text-center space-y-4 max-w-sm">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full">
            <Shield className="w-6 h-6 text-white" />
          </div>
          
          {/* Title */}
          <h3 className="text-white font-semibold text-lg">
            Consenso richiesto
          </h3>
          
          {/* Description */}
          <p className="text-white/90 text-sm leading-relaxed">
            Questo video YouTube richiede il caricamento di contenuti esterni 
            che potrebbero tracciare la tua attività.
          </p>
          
          {/* Video title if provided */}
          {videoTitle && (
            <p className="text-white/80 text-xs italic">
              &ldquo;{videoTitle}&rdquo;
            </p>
          )}
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptAndPlay}
              disabled={isAccepting}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {isAccepting ? 'Caricamento...' : 'Accetta per tutti i video'}
            </button>
            
            <button
              onClick={handleAcceptOnce}
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-medium rounded-lg transition-colors"
            >
              Solo questo video
            </button>
          </div>
          
          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 text-xs text-white/70 pt-2">
            <button
              onClick={onManagePreferences}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Settings className="w-3 h-3" />
              Gestisci preferenze
            </button>
            
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Privacy YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}