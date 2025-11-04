// src/hooks/useToast.ts
'use client'

import { useCallback } from 'react'

// Questo sarà un semplice gestore di eventi per i toast
// In un'app più complessa, useresti un context provider
export function useToast() {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Per ora, usiamo un semplice alert
    // In futuro, questo sarà collegato al ToastProvider
    
    
    // Mostra un alert temporaneo
    // const alertType = type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'
    if (window) {
      // Crea un toast personalizzato usando DOM
      const toast = document.createElement('div')
      toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
      }`
      toast.textContent = message
      document.body.appendChild(toast)
      
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)'
        toast.style.opacity = '0'
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 3000)
    }
  }, [])

  return {
    showSuccess: (message: string) => showToast(message, 'success'),
    showError: (message: string) => showToast(message, 'error'),
    showWarning: (message: string) => showToast(message, 'warning'),
    showInfo: (message: string) => showToast(message, 'info'),
  }
}
