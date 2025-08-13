import { prisma } from '@/lib/core/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Genera un token sicuro per il reset della password
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera un token di reset password e lo salva nel database
 * @param email - Email dell'utente
 * @returns Token generato o null se l'utente non esiste
 */
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  // Verifica che l'utente esista e abbia una password (non solo OAuth)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true }
  });

  if (!user || !user.password) {
    // Non rivelare se l'utente esiste o meno per sicurezza
    return null;
  }

  // Pulisci eventuali token esistenti per questa email
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  // Genera nuovo token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

  // Salva il token nel database
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt
    }
  });

  return token;
}

/**
 * Valida un token di reset password
 * @param token - Token da validare
 * @returns Email associata al token o null se non valido
 */
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { email: true, expiresAt: true }
  });

  if (!resetToken) {
    return null;
  }

  // Verifica che il token non sia scaduto
  if (resetToken.expiresAt < new Date()) {
    // Rimuovi il token scaduto
    await prisma.passwordResetToken.delete({
      where: { token }
    });
    return null;
  }

  return resetToken.email;
}

/**
 * Resetta la password dell'utente usando un token valido
 * @param token - Token di reset
 * @param newPassword - Nuova password
 * @returns true se il reset è avvenuto con successo
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const email = await validatePasswordResetToken(token);
  
  if (!email) {
    return false;
  }

  // Hash della nuova password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  try {
    // Aggiorna la password dell'utente
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Rimuovi il token utilizzato
    await prisma.passwordResetToken.delete({
      where: { token }
    });

    return true;
  } catch (error) {
    console.error('Errore durante il reset della password:', error);
    return false;
  }
}

/**
 * Pulisce i token di reset password scaduti
 * Dovrebbe essere chiamata periodicamente (es. tramite cron job)
 */
export async function cleanExpiredPasswordResetTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
}

/**
 * Verifica se un utente può richiedere un reset password
 * Implementa rate limiting: max 3 richieste per ora
 * @param email - Email dell'utente
 * @returns true se può richiedere, false se ha superato il limite
 */
export async function canRequestPasswordReset(email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentTokens = await prisma.passwordResetToken.count({
    where: {
      email,
      createdAt: {
        gte: oneHourAgo
      }
    }
  });

  return recentTokens < 3;
}

/**
 * Invalida tutti i token di reset password per un utente
 * Utile quando l'utente cambia password o per sicurezza
 * @param email - Email dell'utente
 * @returns Numero di token invalidati
 */
export async function invalidateAllPasswordResetTokens(email: string): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  return result.count;
}

/**
 * Verifica se un token è stato utilizzato di recente
 * Previene attacchi di replay
 * @param token - Token da verificare
 * @returns true se il token è sicuro da usare
 */
export async function isTokenSafeToUse(token: string): Promise<boolean> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { createdAt: true }
  });

  if (!resetToken) {
    return false;
  }

  // Il token deve essere stato creato almeno 30 secondi fa
  // per prevenire attacchi automatizzati
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  return resetToken.createdAt <= thirtySecondsAgo;
}