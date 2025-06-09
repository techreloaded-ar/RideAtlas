// src/app/trips/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Tag, User, Clock, Award, Route, TrendingUp } from 'lucide-react';
import { auth } from '@/auth';
import Link from 'next/link';
import { UserRole } from '@/types/profile';
import { MediaItem, GpxFile } from '@/types/trip';
import MediaGallery from '@/components/MediaGallery';
import GPXDownloadButton from '@/components/GPXDownloadButton';
import GPXAutoMapViewer from '@/components/GPXAutoMapViewer';

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

  // Convert media to MediaItem[]
  const tripMedia = (trip.media || []) as unknown as MediaItem[];

  // Cast GPX file safely
  const gpxFile = trip.gpxFile as GpxFile | null;

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
            
            {/* Multiple seasons support */}
            {trip.recommended_seasons.map((season, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Calendar className="w-3 h-3 mr-1" />
                {season}
              </span>
            ))}
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
        
        {/* GPX Section */}
        {gpxFile && gpxFile.isValid && (
          <div className="p-6 border-b">            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Route className="w-5 h-5 mr-2 text-blue-600" />
                Traccia GPX
              </h2>
              <GPXDownloadButton 
                tripId={trip.id} 
                tripTitle={trip.title}
              />
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Route className="w-4 h-4 text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Distanza</div>
                    <div className="text-lg font-semibold text-blue-800">{gpxFile.distance} km</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Waypoints</div>
                    <div className="text-lg font-semibold text-blue-800">{gpxFile.waypoints}</div>
                  </div>
                </div>
                
                {gpxFile.elevationGain && (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Dislivello positivo</div>
                      <div className="text-lg font-semibold text-blue-800">+{gpxFile.elevationGain} m</div>
                    </div>
                  </div>
                )}
              </div>
              
              {(gpxFile.duration || gpxFile.elevationLoss || gpxFile.maxElevation) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                  {gpxFile.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Durata stimata</div>
                        <div className="text-lg font-semibold text-blue-800">
                          {Math.floor(gpxFile.duration / 3600)}h {Math.floor((gpxFile.duration % 3600) / 60)}m
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {gpxFile.elevationLoss && (
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-2 transform rotate-180" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Dislivello negativo</div>
                        <div className="text-lg font-semibold text-blue-800">-{gpxFile.elevationLoss} m</div>
                      </div>
                    </div>
                  )}
                  
                  {gpxFile.maxElevation && (
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Altitudine max</div>
                        <div className="text-lg font-semibold text-blue-800">{gpxFile.maxElevation} m</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">File:</span> {gpxFile.filename}
                </div>
                {gpxFile.startTime && gpxFile.endTime && (
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">Registrato:</span> {new Date(gpxFile.startTime).toLocaleDateString('it-IT')} - {new Date(gpxFile.endTime).toLocaleDateString('it-IT')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Mappa automatica del percorso */}
            <div className="mt-6">
              <GPXAutoMapViewer 
                gpxUrl={gpxFile.url}
                tripTitle={trip.title}
              />
            </div>
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
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-3">Caratteristiche</h2>
            <div className="flex flex-wrap gap-2">              {trip.characteristics.map((characteristic: string) => (
                <span key={characteristic} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {characteristic}
                </span>
              ))}
            </div>
          </div>
        )}        
        {/* Insights - Approfondimenti */}
        {trip.insights && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-3">Approfondimenti</h2>
            <div className="prose prose-slate max-w-none">              <p className="text-gray-700 whitespace-pre-wrap">{trip.insights}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}