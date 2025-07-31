'use client'

import { useState, useEffect } from 'react'

export type CookieConsentType = 'all' | 'essential' | null

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentType>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if consent has been given
    const consentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('rideatlas-cookie-consent='))
    
    if (consentCookie) {
      const consentValue = consentCookie.split('=')[1]
      setConsent(consentValue === 'true' ? 'all' : 'essential')
    }
    
    setIsLoading(false)
  }, [])

  const hasAnalyticsConsent = (): boolean => {
    return consent === 'all'
  }

  const hasEssentialConsent = (): boolean => {
    return consent !== null
  }

  const resetConsent = (): void => {
    // Remove the consent cookie
    document.cookie = 'rideatlas-cookie-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setConsent(null)
  }

  return {
    consent,
    isLoading,
    hasAnalyticsConsent,
    hasEssentialConsent,
    resetConsent,
  }
}