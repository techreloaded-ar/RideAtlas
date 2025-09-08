/**
 * Main section component for managing all social links
 * Integrates multiple SocialLinkInput components with form state management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SocialLinks, SocialLinksSectionProps } from '@/types/social-links';
import { SocialPlatform, PLATFORM_DISPLAY_ORDER } from '@/lib/social-links/config';
import SocialLinkInput from './SocialLinkInput';
import { useSocialLinksValidation } from '@/hooks/profile/useSocialLinksValidation';

/**
 * SocialLinksSection component for managing user's social media links
 * 
 * Features:
 * - Form state management for all social fields
 * - Real-time validation for each social link
 * - Integration with multiple SocialLinkInput components
 * - Section header and description
 * 
 * Requirements: 1.1, 1.5, 1.6, 1.7
 */
export default function SocialLinksSection({
  initialData,
  onUpdate,
  isLoading = false,
  errors = {}
}: SocialLinksSectionProps) {
  // Form state management
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  
  // Use custom validation hook
  const {
    localErrors,
    validateField,
    clearErrors
  } = useSocialLinksValidation();

  /**
   * Update social links state when initialData changes
   */
  useEffect(() => {
    setSocialLinks(initialData);
    setIsDirty(false);
    clearErrors();
  }, [initialData, clearErrors]);

  /**
   * Handle individual social link changes
   */
  const handleSocialLinkChange = useCallback((platform: SocialPlatform, value: string) => {
    setSocialLinks(prev => {
      const updated = {
        ...prev,
        [platform]: value || undefined // Remove empty strings
      };
      
      // Mark as dirty if value changed
      setIsDirty(true);
      
      // Validate field using custom hook
      if (value && value.trim()) {
        validateField(platform, value);
      }
      
      return updated;
    });
  }, [validateField]);

  /**
   * Trigger update callback when form state changes
   */
  useEffect(() => {
    if (isDirty) {
      onUpdate(socialLinks);
    }
  }, [socialLinks, isDirty, onUpdate]);

  /**
   * Check if form has any validation errors
   */
  const hasErrors = Object.keys(localErrors).length > 0 || Object.keys(errors).length > 0;

  /**
   * Get error for a specific platform (external errors take precedence)
   */
  const getErrorForPlatform = (platform: SocialPlatform): string | undefined => {
    return errors[platform] || localErrors[platform];
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Link Social
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Aggiungi i tuoi profili social per condividere i tuoi canali con la community di RideAtlas.
          Tutti i campi sono opzionali.
        </p>
      </div>

      {/* Social Links Form */}
      <div className="space-y-6">
        {PLATFORM_DISPLAY_ORDER.map((platform) => (
          <SocialLinkInput
            key={platform}
            platform={platform}
            value={socialLinks[platform] || ''}
            onChange={(value) => handleSocialLinkChange(platform, value)}
            error={getErrorForPlatform(platform)}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Form Status Indicators */}
      {hasErrors && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Alcuni link non sono validi
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Controlla i link evidenziati in rosso e correggi gli errori prima di salvare.
              </p>
            </div>
          </div>
        </div>
      )}

      {isDirty && !hasErrors && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Le modifiche ai link social verranno salvate automaticamente quando salvi il profilo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>Suggerimento:</strong> Assicurati di inserire l&apos;URL completo del tuo profilo, 
          incluso https://
        </p>
        <p>
          I link social saranno visibili nel tuo profilo pubblico e potranno essere utilizzati 
          da altri utenti per seguirti sui tuoi canali.
        </p>
      </div>
    </div>
  );
}