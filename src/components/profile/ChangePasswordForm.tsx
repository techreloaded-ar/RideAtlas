'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { getPasswordRequirements } from '@/lib/auth/password-validation';

// Props interface for better type safety
interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Component for changing user password
 * Follows Single Responsibility Principle - only handles password change UI
 * 
 * @param props - Component props
 * @returns JSX.Element - Password change form
 */
export default function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  // Local state for password visibility (UI concern only)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  // Business logic delegated to custom hook
  const {
    formData,
    state,
    updateFormField,
    submitPasswordChange,
    resetForm,
  } = useChangePassword();

  // Determine if this is a password change or initial password setup
  const isPasswordChange = state.hasExistingPassword === true;
  const isInitialSetup = state.hasExistingPassword === false;
  const isLoading = state.hasExistingPassword === null;

  /**
   * Get appropriate title based on user's password status
   */
  const getTitle = (): string => {
    if (isPasswordChange) return 'Cambia Password';
    if (isInitialSetup) return 'Imposta Password';
    return 'Caricamento...';
  };

  /**
   * Get appropriate description based on user's password status
   */
  const getDescription = (): string => {
    if (isPasswordChange) return 'Aggiorna la password del tuo account per maggiore sicurezza';
    if (isInitialSetup) return 'Imposta una password per il tuo account per abilitare il login con email';
    return 'Verifica dello stato account in corso...';
  };

  /**
   * Toggles password visibility for a specific field
   * @param field - The password field to toggle
   */
  const togglePasswordVisibility = (field: keyof typeof showPasswords): void => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  /**
   * Handles form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    await submitPasswordChange();
    
    // Call success callback if provided and operation was successful
    if (state.success && onSuccess) {
      onSuccess();
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = (): void => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Renders a password input field with toggle visibility
   * @param field - Form field name
   * @param label - Field label
   * @param placeholder - Field placeholder
   * @param showPassword - Whether password is visible
   * @param onToggle - Toggle visibility function
   * @returns JSX.Element - Password input field
   */
  const renderPasswordField = (
    field: keyof typeof formData,
    label: string,
    placeholder: string,
    showPassword: boolean,
    onToggle: () => void
  ) => (
    <div>
      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={field}
          name={field}
          type={showPassword ? 'text' : 'password'}
          required
          value={formData[field]}
          onChange={(e) => updateFormField(field, e.target.value)}
          disabled={state.isLoading}
          className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={onToggle}
          disabled={state.isLoading}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );

  /**
   * Renders password requirements checklist
   * @returns JSX.Element - Password requirements
   */
  const renderPasswordRequirements = () => {
    if (!formData.newPassword) return null;

    const requirements = getPasswordRequirements();
    
    return (
      <div className="mt-2 space-y-1">
        <p className="text-xs text-gray-600 mb-1">Requisiti password:</p>
        {requirements.map((requirement: string, index: number) => {
          let isRequirementMet = false;
          
          if (requirement.includes('8 caratteri')) {
            isRequirementMet = formData.newPassword.length >= 8;
          } else if (requirement.includes('maiuscola')) {
            isRequirementMet = /[A-Z]/.test(formData.newPassword);
          } else if (requirement.includes('minuscola')) {
            isRequirementMet = /[a-z]/.test(formData.newPassword);
          } else if (requirement.includes('numero')) {
            isRequirementMet = /[0-9]/.test(formData.newPassword);
          }
          
          return (
            <div key={index} className="flex items-center text-xs">
              {isRequirementMet ? (
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={isRequirementMet ? "text-green-600" : "text-red-600"}>
                {requirement}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  // Show loading state while determining password status
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-3" />
          <span className="text-gray-600">Verifica dello stato account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Lock className="h-6 w-6 text-primary-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
          <p className="text-sm text-gray-600">
            {getDescription()}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {state.success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Password aggiornata con successo!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                La tua password è stata cambiata correttamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(state.error || state.validationErrors.length > 0) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">
            {state.error && <p className="mb-2">{state.error}</p>}
            {state.validationErrors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password - Only show if user has existing password */}
        {isPasswordChange && renderPasswordField(
          'currentPassword',
          'Password Attuale',
          'Inserisci la password attuale',
          showPasswords.current,
          () => togglePasswordVisibility('current')
        )}

        {/* New Password */}
        {renderPasswordField(
          'newPassword',
          isPasswordChange ? 'Nuova Password' : 'Password',
          isPasswordChange ? 'Inserisci la nuova password' : 'Inserisci una password sicura',
          showPasswords.new,
          () => togglePasswordVisibility('new')
        )}

        {/* Password Requirements */}
        {renderPasswordRequirements()}

        {/* Confirm Password */}
        {renderPasswordField(
          'confirmPassword',
          isPasswordChange ? 'Conferma Nuova Password' : 'Conferma Password',
          isPasswordChange ? 'Conferma la nuova password' : 'Conferma la password',
          showPasswords.confirm,
          () => togglePasswordVisibility('confirm')
        )}        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={state.isLoading || state.success}
            className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isPasswordChange ? 'Aggiornamento...' : 'Impostazione...'}
              </>
            ) : (
              isPasswordChange ? 'Aggiorna Password' : 'Imposta Password'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={state.isLoading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
