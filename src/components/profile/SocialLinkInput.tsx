/**
 * Reusable input component for individual social links
 * Handles validation, sanitization and user feedback
 */

import React, { useState, useCallback } from 'react';
import { SocialPlatform } from '@/types/user';
import { validateAndSanitizeUrl } from '@/lib/utils/url-sanitizer';
import { getPlatformConfig } from '@/lib/social-links/config';
import { useDebounce } from '@/hooks/common/useDebounce';
import { VALIDATION_CONSTANTS } from '@/constants/app-constants';
import { 
  MessageCircle, 
  Globe,
  Video,
  Users,
  Hash
} from 'lucide-react';

interface SocialLinkInputProps {
  platform: SocialPlatform;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * UI configuration for each social platform (icons and colors)
 */
const PLATFORM_UI_CONFIG = {
  [SocialPlatform.INSTAGRAM]: {
    icon: MessageCircle, // Using MessageCircle as Instagram icon replacement
    color: 'text-pink-600'
  },
  [SocialPlatform.YOUTUBE]: {
    icon: Video, // Using Video as YouTube icon replacement
    color: 'text-red-600'
  },
  [SocialPlatform.FACEBOOK]: {
    icon: Users, // Using Users as Facebook icon replacement
    color: 'text-blue-600'
  },
  [SocialPlatform.TIKTOK]: {
    icon: Hash, // Using Hash as TikTok icon replacement
    color: 'text-black'
  },
  [SocialPlatform.LINKEDIN]: {
    icon: Users, // Using Users as LinkedIn icon replacement
    color: 'text-blue-600'
  },
  [SocialPlatform.WEBSITE]: {
    icon: Globe,
    color: 'text-gray-600'
  }
} as const;

export default function SocialLinkInput({
  platform,
  value,
  onChange,
  error,
  disabled = false
}: SocialLinkInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const platformConfig = getPlatformConfig(platform);
  const uiConfig = PLATFORM_UI_CONFIG[platform];
  const IconComponent = uiConfig.icon;

  /**
   * Validation function
   */
  const validateInput = useCallback((value: string) => {
    if (!value.trim()) {
      onChange('');
      setIsValidating(false);
      return;
    }

    const result = validateAndSanitizeUrl(platform, value);
    
    if (result.isValid) {
      onChange(result.sanitizedUrl);
      setValidationError('');
    } else {
      setValidationError(result.error || 'URL non valido');
    }
    
    setIsValidating(false);
  }, [platform, onChange]);

  /**
   * Debounced validation function
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debouncedValidation = useDebounce(validateInput as any, VALIDATION_CONSTANTS.DEBOUNCE_DELAY);

  /**
   * Handles input change with debounced validation
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setValidationError('');

    // If empty, clear validation and call onChange immediately
    if (!newValue.trim()) {
      onChange('');
      setIsValidating(false);
      return;
    }

    // Start validation process
    setIsValidating(true);
    debouncedValidation(newValue);
  }, [onChange, debouncedValidation]);

  /**
   * Handles input blur to finalize validation
   */
  const handleBlur = useCallback(() => {
    if (localValue.trim()) {
      const result = validateAndSanitizeUrl(platform, localValue);
      if (result.isValid && result.sanitizedUrl !== localValue) {
        setLocalValue(result.sanitizedUrl);
      }
    }
  }, [localValue, platform]);

  // Use external error if provided, otherwise use local validation error
  const displayError = error || validationError;
  const hasError = !!displayError;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center space-x-2">
          <IconComponent className={`w-4 h-4 ${uiConfig.color}`} />
          <span>{platformConfig.label}</span>
        </div>
      </label>
      
      <div className="relative">
        <input
          type="url"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={platformConfig.placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${platform}-error` : undefined}
        />
        
        {/* Loading indicator */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p 
          id={`${platform}-error`}
          className="text-sm text-red-600 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span>{displayError}</span>
        </p>
      )}

      {/* Help text */}
      {!hasError && !isValidating && (
        <p className="text-xs text-gray-500">
          Inserisci l&apos;URL completo del tuo profilo {platformConfig.label.toLowerCase()}
        </p>
      )}
    </div>
  );
}