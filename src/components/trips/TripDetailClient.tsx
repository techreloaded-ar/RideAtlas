'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { TripChips } from '@/components/trips/TripChips'
import { TripMeta } from '@/components/trips/TripMeta'
import { UnifiedMediaGallery } from '@/components/ui/UnifiedMediaGallery'
import StageTimeline from '@/components/stages/StageTimeline'
import AccessGate from '@/components/auth/AccessGate'
import { PublishTripButton } from '@/components/trips/PublishTripButton'
import { TripValidationWarning } from '@/components/trips/TripValidationWarning'
import { GpxFile, RecommendedSeason } from '@/types/trip'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption?: string
  thumbnailUrl?: string
}

interface TripUser {
  id: string
  name: string | null
  email: string
  role: 'Ranger' | 'Sentinel' | 'Explorer'
}

interface TripStage {
  id: string
  tripId: string
  orderIndex: number
  title: string
  description?: string
  routeType?: string
  duration?: string
  media: MediaItem[]
  gpxFile: GpxFile | null
  createdAt: Date
  updatedAt: Date
}

interface TripData {
  id: string
  title: string
  summary: string
  destination: string
  duration_days: number
  theme: string
  status: string
  price: number
  characteristics: string[]
  tags: string[]
  travelDate?: Date | null
  user: TripUser
}

interface TripWithStages extends TripData {
  stages: TripStage[]
}

interface TripDetailClientProps {
  trip: TripWithStages
  isOwner: boolean
  isSentinel: boolean
  canEdit: boolean
  tripMediaItems: MediaItem[]
  allStageMediaItems: MediaItem[]
  mappedSeasons: RecommendedSeason[]
}

export function TripDetailClient({
  trip,
  isOwner,
  isSentinel,
  canEdit,
  tripMediaItems,
  allStageMediaItems,
  mappedSeasons
}: TripDetailClientProps) {
  const [hasValidationErrors, setHasValidationErrors] = useState(false)
  
  const handleValidationChange = useCallback((hasErrors: boolean) => {
    setHasValidationErrors(hasErrors)
  }, [])
  
  const isMultiStage = trip.stages?.length > 0
  const galleryMediaItems = [...tripMediaItems, ...allStageMediaItems]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-medium mb-2">{trip.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-blue-600">
                €{trip.price.toFixed(2)}
              </span>
              {trip.price === 0 && (
                <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-md">
                  Offerta IAD
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/edit-trip/${trip.id}`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Modifica
              </Link>
              <PublishTripButton
                tripId={trip.id}
                isOwner={isOwner}
                isSentinel={isSentinel}
                tripStatus={trip.status}
                isDisabled={hasValidationErrors}
              />
            </div>
          )}
        </div>

        {/* Sezione requisiti mancanti per la pubblicazione */}
        <TripValidationWarning
          tripId={trip.id}
          isOwner={isOwner}
          isSentinel={isSentinel}
          tripStatus={trip.status}
          onValidationChange={handleValidationChange}
        />
        
        <TripChips 
          duration={isMultiStage 
            ? `${trip.stages.length} giorni`
            : `${trip.duration_days} giorni`
          }
          location={trip.destination}
          terrain={trip.theme}
          seasons={mappedSeasons}
        />
        
        <TripMeta
          author={trip.user.name || trip.user.email}
          travelDate={trip.travelDate}
          authorRole={trip.user.role}
        />
      </div>

      {/* Media Gallery */}
      {galleryMediaItems.length > 0 && (
        <UnifiedMediaGallery media={galleryMediaItems} />
      )}

      {/* Description */}
      <div className="mb-8">
        <p className="leading-relaxed mb-4 text-[14px]">
          {trip.summary}
        </p>
      </div>

      {/* Caratteristiche e Tags */}
      {(trip.characteristics.length > 0 || trip.tags.length > 0) && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trip.characteristics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Caratteristiche</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.characteristics.map((characteristic: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {characteristic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {trip.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.tags.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Stages Section - Solo per viaggi multi-tappa */}
      {isMultiStage && trip.stages.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tappe del viaggio</h2>

          <AccessGate 
            tripId={trip.id} 
            premiumContentType="le tappe dettagliate del viaggio"
            showPreview={true}
          >
            <StageTimeline
              stages={trip.stages}
              isEditable={false}
            />
          </AccessGate>
        </div>
      )}
    </div>
  )
}