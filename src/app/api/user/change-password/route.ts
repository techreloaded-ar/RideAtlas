import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { passwordSchema } from '@/lib/auth/password-validation';
import { 
  UserPasswordData, 
  ValidationResult, 
  ChangePasswordRequest, 
  SetInitialPasswordRequest 
} from '@/types/user';

// Schema di validazione per il cambio password (utenti con password esistente)
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: passwordSchema,
});

// Schema di validazione per l'impostazione password iniziale (utenti OAuth)
const setInitialPasswordSchema = z.object({
  newPassword: passwordSchema,
});

/**
 * Validates if the current password matches the stored hash
 * @param currentPassword - Plain text current password
 * @param storedHash - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 */
async function validateCurrentPassword(currentPassword: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(currentPassword, storedHash);
}

/**
 * Checks if the new password is different from the current one
 * @param newPassword - Plain text new password
 * @param currentHash - Current hashed password
 * @returns Promise<boolean> - True if passwords are the same
 */
async function isPasswordUnchanged(newPassword: string, currentHash: string): Promise<boolean> {
  return bcrypt.compare(newPassword, currentHash);
}

/**
 * Hashes the new password with secure salt rounds
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
async function hashNewPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Updates user password in the database
 * @param userId - User ID
 * @param hashedPassword - New hashed password
 * @returns Promise<void>
 */
async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

/**
 * Retrieves user data needed for password change
 * @param userId - User ID
 * @returns Promise<User | null> - User with password data or null
 */
async function getUserForPasswordChange(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password: true }
  });
}

/**
 * Abstract Strategy for password operations with generics
 * Follows Strategy Pattern for different password scenarios
 */
abstract class PasswordOperationStrategy<T> {
  abstract validate(body: unknown): ValidationResult<T>;
  abstract execute(user: UserPasswordData, validatedData: T): Promise<void>;
  abstract getSuccessMessage(): string;
}

/**
 * Strategy for users with existing password (change password)
 */
class ChangePasswordStrategy extends PasswordOperationStrategy<ChangePasswordRequest> {
  validate(body: unknown): ValidationResult<ChangePasswordRequest> {
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        error: 'Dati non validi per cambio password'
      };
    }
    return { success: true, data: result.data };
  }

  async execute(user: UserPasswordData, validatedData: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = validatedData;

    if (!user.password) {
      throw new Error('Password non impostata per questo utente');
    }

    // Validate current password
    const isCurrentPasswordValid = await validateCurrentPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Password attuale non corretta');
    }

    // Ensure new password is different
    const isSamePassword = await isPasswordUnchanged(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('La nuova password deve essere diversa da quella attuale');
    }

    // Update password
    const hashedNewPassword = await hashNewPassword(newPassword);
    await updateUserPassword(user.id, hashedNewPassword);
  }

  getSuccessMessage(): string {
    return 'Password aggiornata con successo';
  }
}

/**
 * Strategy for users without password (set initial password)
 */
class SetInitialPasswordStrategy extends PasswordOperationStrategy<SetInitialPasswordRequest> {
  validate(body: unknown): ValidationResult<SetInitialPasswordRequest> {
    const result = setInitialPasswordSchema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        error: 'Dati non validi per impostazione password'
      };
    }
    return { success: true, data: result.data };
  }

  async execute(user: UserPasswordData, validatedData: SetInitialPasswordRequest): Promise<void> {
    const { newPassword } = validatedData;

    // Set initial password
    const hashedNewPassword = await hashNewPassword(newPassword);
    await updateUserPassword(user.id, hashedNewPassword);
  }

  getSuccessMessage(): string {
    return 'Password impostata con successo per il tuo account';
  }
}

/**
 * Factory Method for creating appropriate strategy
 * Follows Factory Pattern for strategy instantiation
 */
function createPasswordStrategy(hasExistingPassword: boolean): ChangePasswordStrategy | SetInitialPasswordStrategy {
  return hasExistingPassword 
    ? new ChangePasswordStrategy() 
    : new SetInitialPasswordStrategy();
}

export async function POST(request: NextRequest) {
  try {
    // Authentication: Ensure user is logged in
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Input validation: Parse and validate request body
    const body = await request.json();
    const user = await getUserForPasswordChange(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }    // Factory Method: Create strategy instance
    const passwordStrategy = createPasswordStrategy(!!user.password);

    // Strategy execution: Validate and execute with proper type checking
    const validationResult = passwordStrategy.validate(body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(
        { error: validationResult.error || 'Dati non validi' },
        { status: 400 }
      );
    }

    // Type-safe execution using strategy pattern
    if (passwordStrategy instanceof ChangePasswordStrategy) {
      await passwordStrategy.execute(user, validationResult.data as ChangePasswordRequest);
    } else if (passwordStrategy instanceof SetInitialPasswordStrategy) {
      await passwordStrategy.execute(user, validationResult.data as SetInitialPasswordRequest);
    }

    // Audit log
    console.log(`✅ Password aggiornata per utente: ${user.email}`);

    return NextResponse.json(
      { 
        success: true,
        message: passwordStrategy.getSuccessMessage()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante il cambio password:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
