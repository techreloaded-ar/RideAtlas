import { useState, useCallback } from 'react';
import { SocialPlatform } from '@/lib/social-links/config';

type SocialLinks = Record<string, string>;
import { validateAndSanitizeUrl } from '@/lib/utils/url-sanitizer';

interface ValidationState {
  localErrors: Record<string, string>;
  isValidating: boolean;
}

interface ValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

/**
 * Custom hook per gestire la validazione dei social links
 * Separa la logica di validazione dai componenti UI
 */
export const useSocialLinksValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    localErrors: {},
    isValidating: false
  });

  /**
   * Valida un singolo campo social link
   */
  const validateField = useCallback((platform: SocialPlatform, value: string): ValidationResult => {
    const validation = validateAndSanitizeUrl(platform, value);
    
    if (validation.isValid) {
      // Rimuovi errore se presente
      setValidationState(prev => ({
        ...prev,
        localErrors: {
          ...prev.localErrors,
          [platform]: ''
        }
      }));
    } else {
      // Aggiungi errore
      setValidationState(prev => ({
        ...prev,
        localErrors: {
          ...prev.localErrors,
          [platform]: validation.error || 'URL non valido'
        }
      }));
    }

    return validation;
  }, []);

  /**
   * Valida tutti i social links
   */
  const validateAllFields = useCallback((socialLinks: SocialLinks): boolean => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.entries(socialLinks).forEach(([platform, url]) => {
      if (url && url.trim()) {
        const validation = validateAndSanitizeUrl(platform as SocialPlatform, url);
        if (!validation.isValid) {
          errors[platform] = validation.error || 'URL non valido';
          hasErrors = true;
        }
      }
    });

    setValidationState(prev => ({
      ...prev,
      localErrors: errors
    }));

    return !hasErrors;
  }, []);

  /**
   * Pulisce gli errori di validazione
   */
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      localErrors: {}
    }));
  }, []);

  /**
   * Imposta lo stato di validazione in corso
   */
  const setIsValidating = useCallback((isValidating: boolean) => {
    setValidationState(prev => ({
      ...prev,
      isValidating
    }));
  }, []);

  /**
   * Imposta un errore specifico per un campo
   */
  const setFieldError = useCallback((platform: SocialPlatform, error: string) => {
    setValidationState(prev => ({
      ...prev,
      localErrors: {
        ...prev.localErrors,
        [platform]: error
      }
    }));
  }, []);

  /**
   * Controlla se ci sono errori di validazione
   */
  const hasErrors = Object.values(validationState.localErrors).some(error => error && error.trim() !== '');

  return {
    localErrors: validationState.localErrors,
    isValidating: validationState.isValidating,
    hasErrors,
    validateField,
    validateAllFields,
    clearErrors,
    setIsValidating,
    setFieldError
  };
};