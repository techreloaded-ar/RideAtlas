'use client';

import { useState } from 'react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { ChevronDown, ChevronUp, Lock, User, Settings, Loader2, Bike } from 'lucide-react';
import ChangePasswordForm from './ChangePasswordForm';
import SocialLinksSection from './SocialLinksSection';
import BikePhotosUpload from './BikePhotosUpload';
import { SocialLinks } from '@/types/user';
import { useProfile } from '@/hooks/profile/useProfile';
import { UserRole, type MediaItem } from '@/types/profile';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsSection({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children
}: SettingsSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const { profile, isLoading: isLoadingProfile, error: profileError, refetch } = useProfile();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    security: false,
    personal: false,
    motorcycle: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    socialLinks: {} as SocialLinks,
  });

  // Motorcycle-specific state
  const [bikeDescription, setBikeDescription] = useState('');
  const [bikePhotos, setBikePhotos] = useState<MediaItem[]>([]);
  const [isSavingBike, setIsSavingBike] = useState(false);
  const [bikeSuccess, setBikeSuccess] = useState(false);
  const [bikeError, setBikeError] = useState('');

  // Aggiorna i dati del form quando il profilo viene caricato
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        socialLinks: profile.socialLinks || {},
      });
      setBikeDescription(profile.bikeDescription || '');
      setBikePhotos(profile.bikePhotos || []);
    }
  }, [profile]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Reset success/error states
    setUpdateSuccess(false);
    setUpdateError('');
  };

  const handleSocialLinksChange = (socialLinks: SocialLinks) => {
    setFormData(prev => ({
      ...prev,
      socialLinks
    }));
    // Reset success/error states
    setUpdateSuccess(false);
    setUpdateError('');
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          bikeDescription, // Include bikeDescription to prevent overwriting
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      // Aggiorna la sessione con i nuovi dati
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: data.user.name,
          }
        });
      }

      // Ricarica il profilo per avere i dati aggiornati
      await refetch();

      setUpdateSuccess(true);

      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveBikeDescription = async () => {
    setIsSavingBike(true);
    setBikeError('');
    setBikeSuccess(false);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData, // Include name, bio, and socialLinks to prevent overwriting
          bikeDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      // Ricarica il profilo per avere i dati aggiornati
      await refetch();

      setBikeSuccess(true);
      setTimeout(() => setBikeSuccess(false), 3000);
    } catch (error) {
      setBikeError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
    } finally {
      setIsSavingBike(false);
    }
  };

  if (!session?.user) return null;

  // Mostra loading durante il caricamento iniziale del profilo
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span className="text-gray-600">Caricamento profilo...</span>
        </div>
      </div>
    );
  }

  // Mostra errore se il caricamento del profilo fallisce
  if (profileError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Errore nel caricamento del profilo</h3>
            <p className="text-sm text-red-700 mt-1">{profileError}</p>
            <button
              onClick={refetch}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Impostazioni Profilo</h2>
            <p className="text-sm text-gray-600">
              Gestisci le impostazioni del tuo account e le preferenze
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Personal Information Section */}
          <SettingsSection
            title="Informazioni Personali"
            description="Modifica le tue informazioni personali"
            icon={<User className="w-5 h-5 text-blue-600" />}
            isOpen={openSections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <div className="space-y-4">
              {/* Messaggi di feedback */}
              {updateSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-800">Profilo aggiornato con successo!</p>
                  </div>
                </div>
              )}

              {updateError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-800">{updateError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Il tuo nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;email non può essere modificata
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biografia
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Racconta qualcosa di te..."
                />
                <p className={`text-xs mt-1 ${
                  formData.bio.length > 1000 ? 'text-red-600' :
                  formData.bio.length > 900 ? 'text-yellow-600' :
                  'text-gray-500'
                }`}>
                  {formData.bio.length}/1000 caratteri
                </p>
              </div>

              {/* Social Links Section */}
              <div className="pt-6 border-t border-gray-200">
                <SocialLinksSection
                  initialData={formData.socialLinks}
                  onUpdate={handleSocialLinksChange}
                  isLoading={isUpdating}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection
            title="Sicurezza"
            description="Gestisci la sicurezza del tuo account"
            icon={<Lock className="w-5 h-5 text-red-600" />}
            isOpen={openSections.security}
            onToggle={() => toggleSection('security')}
          >
            <div className="bg-gray-50 rounded-lg p-4">
              <ChangePasswordForm
                onSuccess={() => {
                  // Opzionalmente chiudi la sezione dopo il successo
                  setTimeout(() => {
                    toggleSection('security');
                  }, 3000);
                }}
              />
            </div>
          </SettingsSection>

          {/* Motorcycle Information Section - Only for Ranger users */}
          {(session.user.role === UserRole.Ranger || 
          session.user.role === UserRole.Sentinel) && (
            <SettingsSection
              title="Informazioni Motociclistiche"
              description="Descrizione e foto della tua moto"
              icon={<Bike className="w-5 h-5 text-orange-600" />}
              isOpen={openSections.motorcycle}
              onToggle={() => toggleSection('motorcycle')}
            >
              <div className="space-y-6">
                {/* Success/Error Messages */}
                {bikeSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-800">Salvato con successo!</p>
                    </div>
                  </div>
                )}

                {bikeError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800">{bikeError}</p>
                    </div>
                  </div>
                )}

                {/* Bike Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione della tua moto
                  </label>
                  <textarea
                    value={bikeDescription}
                    onChange={(e) => setBikeDescription(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Es: BMW R1250GS Adventure, personalizzata per lunghi viaggi..."
                  />
                  <p className={`text-xs mt-1 ${
                    bikeDescription.length > 500 ? 'text-red-600' :
                    bikeDescription.length > 450 ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {bikeDescription.length}/500 caratteri
                  </p>

                  <button
                    onClick={handleSaveBikeDescription}
                    disabled={isSavingBike}
                    className="mt-3 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingBike ? 'Salvataggio...' : 'Salva Descrizione'}
                  </button>
                </div>

                {/* Bike Photos */}
                <div className="pt-6 border-t border-gray-200">
                  <BikePhotosUpload
                    photos={bikePhotos}
                    onPhotosChange={setBikePhotos}
                  />
                </div>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}
