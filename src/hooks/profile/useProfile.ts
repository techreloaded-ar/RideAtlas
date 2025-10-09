import { useState, useEffect } from 'react';
import { SocialLinks } from '@/types/user';
import type { MediaItem } from '@/types/profile';

interface ProfileData {
  id: string;
  name: string;
  bio: string | null;
  email: string;
  socialLinks: SocialLinks;
  role: string;
  bikeDescription?: string | null;
  bikePhotos?: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

interface UseProfileReturn {
  profile: ProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento del profilo');
      }

      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setProfile(null); // Reset profile in caso di errore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile
  };
}