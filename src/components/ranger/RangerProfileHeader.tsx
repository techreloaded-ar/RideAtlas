'use client';

import Image from 'next/image';
import { Instagram, Facebook, Youtube, Linkedin, Globe, ExternalLink, Bike, Shield } from 'lucide-react';
import type { RangerProfile } from '@/types/ranger';
import { UnifiedMediaGallery } from '@/components/ui/UnifiedMediaGallery';

interface RangerProfileHeaderProps {
  ranger: RangerProfile;
  tripsCount: number;
}

/**
 * Get initials from name for generated avatar
 * @param name - Full name
 * @returns 2-letter initials in uppercase
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Get icon component for social platform
 * @param platform - Platform name (lowercase)
 * @returns React icon component with correct brand icon
 */
function getSocialIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram size={18} className="text-pink-600" />;
    case 'facebook':
      return <Facebook size={18} className="text-blue-600" />;
    case 'youtube':
      return <Youtube size={18} className="text-red-600" />;
    case 'linkedin':
      return <Linkedin size={18} className="text-blue-700" />;
    case 'website':
      return <Globe size={18} className="text-gray-600" />;
    default:
      return <ExternalLink size={18} className="text-gray-600" />;
  }
}

export function RangerProfileHeader({ ranger, tripsCount }: RangerProfileHeaderProps) {
  // Trasforma bikePhotos in MediaItem per UnifiedMediaGallery
  const bikePhotosAsMedia = ranger.bikePhotos?.map((photo, index) => ({
    id: `bike-photo-${index}`,
    type: photo.type as 'image' | 'video',
    url: photo.url,
    caption: photo.caption,
  })) || [];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-gray-50 rounded-xl shadow-sm border border-gray-100">
      {/* Hero Section */}
      <div className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar - Più grande e con ring */}
          <div className="flex-shrink-0">
            {ranger.image ? (
              <div className="relative">
                <Image
                  src={ranger.image}
                  alt={ranger.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              </div>
            ) : (
              /* Generated avatar with initials - manteniamo blu come richiesto */
              <div
                className="w-30 h-30 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white"
                data-testid="generated-avatar"
              >
                {getInitials(ranger.name)}
              </div>
            )}
          </div>

          {/* Info principale */}
          <div className="flex-1 text-center md:text-left">
            {/* Nome + Badge Ranger Verificato */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{ranger.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <Shield size={14} />
                Ranger Verificato
              </span>
            </div>

            {/* Bio */}
            <p className="text-base text-gray-700 mb-4 max-w-2xl" data-testid="ranger-bio">
              {ranger.bio || 'Nessuna informazione personale'}
            </p>

            {/* Stats inline - Solo viaggi pubblicati */}
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-gray-600 mb-6">
              <span className="flex items-center gap-1.5 font-medium">
                <Bike size={18} className="text-blue-600" />
                <strong className="text-gray-900">{tripsCount}</strong>
                {tripsCount === 1 ? ' viaggio' : ' viaggi'}
              </span>
            </div>

            {/* Social Links - Con label testuali */}
            {ranger.socialLinks && Object.keys(ranger.socialLinks).length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2" data-testid="social-links">
                {Object.entries(ranger.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700 shadow-sm"
                    aria-label={`${platform} profile`}
                  >
                    {getSocialIcon(platform)}
                    <span className="capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sezione Moto - Hero Style con Gallery */}
      {ranger.bikeDescription && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Gallery Foto Moto - 70% larghezza */}
              {bikePhotosAsMedia.length > 0 && (
                <div className="lg:w-[70%]">
                  <UnifiedMediaGallery media={bikePhotosAsMedia} />
                </div>
              )}

              {/* Info Moto - 30% larghezza */}
              <div className="lg:w-[30%]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bike className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Le moto di {ranger.name}</h3>
                </div>
                <p className="text-base text-gray-700 leading-relaxed" data-testid="bike-description">
                  {ranger.bikeDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
