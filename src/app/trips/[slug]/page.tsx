// src/app/trips/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Tag, User, Clock, Award } from 'lucide-react';
import { auth } from '@/auth';
import Link from 'next/link';
import { UserRole } from '@/types/profile';
import { MediaItem } from '@/types/trip';
import MediaGallery from '@/components/MediaGallery';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Funzione per formattare la data
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export default async function TripDetailPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const trip = await prisma.trip.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!trip) {
    notFound();
  }

  // Converti i media da JsonValue a MediaItem[]
  const tripMedia = (trip.media || []) as unknown as MediaItem[];

  // Controlla se l'utente è il creatore o un Sentinel
  const isOwner = session?.user?.id === trip.user_id;
  const isSentinel = session?.user?.role === UserRole.Sentinel;
  const canEdit = isOwner || isSentinel;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">{trip.title}</h1>
            {canEdit && (
              <div className="flex space-x-3">
                <Link
                  href={`/edit-trip/${trip.id}`}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  Modifica
                </Link>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Clock className="w-3 h-3 mr-1" />
              {trip.duration_days} giorni / {trip.duration_nights} notti
            </span>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <MapPin className="w-3 h-3 mr-1" />
              {trip.destination}
            </span>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Award className="w-3 h-3 mr-1" />
              {trip.theme}
            </span>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Calendar className="w-3 h-3 mr-1" />
              {trip.recommended_season}
            </span>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Creato da: {trip.user.name || trip.user.email}
            </div>
            <div>Pubblicato il: {formatDate(trip.created_at)}</div>
          </div>
        </div>
        
        {/* Media Gallery */}
        {tripMedia.length > 0 && (
          <div className="p-6 border-b">
            <MediaGallery media={tripMedia} />
          </div>
        )}
        
        {/* Summary */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-3">Sommario</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{trip.summary}</p>
        </div>
        
        {/* Tags */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-3">Tag</h2>
          <div className="flex flex-wrap gap-2">
            {trip.tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Characteristics */}
        {trip.characteristics.length > 0 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Caratteristiche</h2>
            <div className="flex flex-wrap gap-2">
              {trip.characteristics.map((characteristic: string) => (
                <span key={characteristic} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {characteristic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
