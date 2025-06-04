
import { Session } from 'next-auth'

/**
 * Estrae le iniziali dell'utente dal nome o email come fallback
 * @param user - Oggetto utente della sessione NextAuth
 * @returns Stringa con le iniziali (1-2 caratteri)
 */
export function getUserInitials(user?: Session['user']): string {
  if (!user) return ''
  
  // Se c'è il nome, prende la prima lettera del nome e cognome
  if (user.name) {
    const nameParts = user.name.trim().split(' ')
    if (nameParts.length >= 2) {
      // Nome e cognome: prende prima lettera di entrambi
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    } else {
      // Solo un nome: prende la prima lettera
      return nameParts[0].charAt(0).toUpperCase()
    }
  }
  
  // Fallback: prima lettera dell'email
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  
  return ''
}

/**
 * Genera un colore di sfondo deterministico basato sull'email dell'utente
 * @param user - Oggetto utente della sessione NextAuth
 * @returns Colore esadecimale per il colore di sfondo
 */
export function getUserAvatarBgColor(user?: Session['user']): string {
  if (!user?.email) return '#6b7280' // gray-500
  
  // Genera un hash semplice dall'email per determinare il colore
  const hash = user.email.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
    '#ef4444', // red-500
    '#eab308', // yellow-500
    '#14b8a6'  // teal-500
  ]
  
  return colors[Math.abs(hash) % colors.length]
}
