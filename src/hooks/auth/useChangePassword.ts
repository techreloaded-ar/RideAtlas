import { useState, useEffect } from 'react';
import { validatePasswordComplexity } from '@/lib/auth/password-validation';
import { useSession } from 'next-auth/react';

// Types for better type safety and intention revealing
interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  validationErrors: string[];
  hasExistingPassword: boolean | null; // null = loading, true/false = determined
}

interface ChangePasswordHook {
  formData: ChangePasswordForm;
  state: ChangePasswordState;
  updateFormField: (field: keyof ChangePasswordForm, value: string) => void;
  validateForm: (requireCurrentPassword: boolean) => boolean;
  submitPasswordChange: () => Promise<void>;
  resetForm: () => void;
}

// Initial state constants for better maintainability
const INITIAL_FORM_DATA: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const INITIAL_STATE: ChangePasswordState = {
  isLoading: false,
  error: null,
  success: false,
  validationErrors: [],
  hasExistingPassword: null,
};

/**
 * Custom hook for managing password change functionality
 * Follows Single Responsibility Principle and Command-Query Separation
 * 
 * @returns ChangePasswordHook - Object containing form state and actions
 */
export function useChangePassword(): ChangePasswordHook {
  const [formData, setFormData] = useState<ChangePasswordForm>(INITIAL_FORM_DATA);
  const [state, setState] = useState<ChangePasswordState>(INITIAL_STATE);
  const { data: session } = useSession();
  /**
   * Check if user has existing password on component mount
   */  useEffect(() => {
    const checkUserPasswordStatus = async () => {
      if (!session?.user?.id) {
        // If no session, reset password status to initial state
        setState(prev => ({
          ...prev,
          hasExistingPassword: null
        }));
        return;
      }

      try {
        // Use a HEAD request to check password status without exposing data
        const response = await fetch('/api/user/password-status', {
          method: 'HEAD',
        });
        
        // If response is 200, user has password; if 404, user has no password
        setState(prev => ({
          ...prev,
          hasExistingPassword: response.status === 200
        }));
      } catch (error) {
        console.error('Error checking password status:', error);
        // Default to assuming user has password for security
        setState(prev => ({
          ...prev,
          hasExistingPassword: true
        }));
      }
    };

    checkUserPasswordStatus();
  }, [session]);

  /**
   * Updates a specific form field
   * @param field - The field to update
   * @param value - The new value
   */
  const updateFormField = (field: keyof ChangePasswordForm, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear previous errors when user starts typing
    if (state.error || state.validationErrors.length > 0) {
      setState(prev => ({
        ...prev,
        error: null,
        validationErrors: []
      }));
    }
  };  /**
   * Validates the entire form
   * @param requireCurrentPassword - Whether current password is required
   * @returns boolean - True if form is valid
   */
  const validateForm = (requireCurrentPassword: boolean): boolean => {
    const errors: string[] = [];

    // Validate current password only if required (user has existing password)
    if (requireCurrentPassword && !formData.currentPassword.trim()) {
      errors.push('Password attuale richiesta');
    }

    if (!formData.newPassword.trim()) {
      errors.push('Nuova password richiesta');
    }

    if (!formData.confirmPassword.trim()) {
      errors.push('Conferma password richiesta');
    }

    // Validate password complexity
    if (formData.newPassword) {
      const passwordComplexityErrors = validatePasswordComplexity(formData.newPassword);
      errors.push(...passwordComplexityErrors);
    }

    // Validate password confirmation
    if (formData.newPassword && formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        errors.push('Le password non coincidono');
      }
    }

    // Validate password is different (only if we have both passwords and current password is required)
    if (requireCurrentPassword && formData.currentPassword && formData.newPassword) {
      if (formData.currentPassword === formData.newPassword) {
        errors.push('La nuova password deve essere diversa da quella attuale');
      }
    }

    // Update state synchronously for immediate UI feedback
    setState(prev => ({
      ...prev,
      validationErrors: errors
    }));

    return errors.length === 0;
  };
  /**
   * Submits the password change request
   * Follows Command pattern - performs an action
   */  const submitPasswordChange = async (): Promise<void> => {
    // Determine if current password is required
    const requireCurrentPassword = state.hasExistingPassword === true;
    
    // Pre-validation
    if (!validateForm(requireCurrentPassword)) {
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false
    }));    try {
      // Prepare request body based on whether user has existing password
      const requestBody = requireCurrentPassword 
        ? {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }
        : {
            newPassword: formData.newPassword,
          };      
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il cambio password');
      }

      // Success state
      setState(prev => ({
        ...prev,
        isLoading: false,
        success: true,
        error: null,
        validationErrors: []
      }));

      // Reset form on success
      setFormData(INITIAL_FORM_DATA);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        success: false
      }));
    }
  };

  /**
   * Resets the form and state to initial values
   * Follows Command pattern - performs an action
   */
  const resetForm = (): void => {
    setFormData(INITIAL_FORM_DATA);
    setState(INITIAL_STATE);
  };

  return {
    formData,
    state,
    updateFormField,
    validateForm,
    submitPasswordChange,
    resetForm,
  };
}
