import { notFound } from 'next/navigation'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { formatCalendarDay, formatCalendarRange, programDays } from '@/lib/guided-trips/guided-trip-rules'
import { formatEuro, seatsLeftLabel } from '@/components/guided-trips/guided-trip-format'
import GuidedTripBookingPanel from '@/components/guided-trips/GuidedTripBookingPanel'

export const dynamic = 'force-dynamic'

export default async function GuidedTripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await currentActingUser()
  const result = await GuidedTripService.getPublicBySlug(slug, viewer)
  if (!result) notFound()

  const { trip, viewerRegistration, viewerIsOrganizer } = result
  const departure = new Date(trip.departureDate)
  const days = programDays(trip.program)
  const seatsTaken = trip.maxParticipants - trip.seats.availableSeats
  const occupiedPercent = Math.min(100, Math.round((seatsTaken / trip.maxParticipants) * 100))
  const cancelled = trip.status === 'Annullato'

  return (
    <main className="min-h-screen bg-gray-50">
      <section
        className="relative bg-gradient-to-r from-primary-800 to-secondary-600 bg-cover bg-center text-white"
        style={trip.coverImageUrl ? { backgroundImage: `linear-gradient(rgba(20,83,45,.75), rgba(75,85,99,.75)), url("${trip.coverImageUrl}")` } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <span
            className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${cancelled ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}
            data-testid="guided-trip-hero-badge"
          >
            {cancelled
              ? 'Viaggio annullato'
              : trip.status === 'Bozza'
                ? 'Bozza · visibile solo a te'
                : `Viaggio guidato · ${seatsLeftLabel(trip.seats.availableSeats, trip.maxParticipants)}`}
          </span>
          <h1 className="mt-4 text-4xl font-display font-bold">{trip.title}</h1>
          <p className="mt-2 text-lg text-white/90">
            {formatCalendarRange(departure, new Date(trip.returnDate))} · Ritrovo: {trip.meetingPoint}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6 order-2 lg:order-1">
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Il viaggio</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{trip.description}</p>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Programma</h2>
            <ol className="divide-y divide-gray-100">
              {days.map((day, index) => (
                <li key={index} className="flex gap-4 py-3">
                  <span className="font-semibold text-primary-700 min-w-[5rem]">Giorno {index + 1}</span>
                  <span className="text-gray-800">{day}</span>
                </li>
              ))}
            </ol>
          </section>

          {trip.includedServices && (
            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cosa è incluso</h2>
              <p className="text-gray-700 whitespace-pre-line">{trip.includedServices}</p>
            </section>
          )}
        </div>

        <aside className="w-full lg:w-96 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 bg-white border-2 border-primary-600 rounded-2xl p-6" data-testid="guided-trip-booking-box">
            <p className="text-3xl font-bold text-gray-900">
              {formatEuro(trip.pricePerParticipant)} <span className="text-base font-normal text-gray-500">a partecipante</span>
            </p>

            {!cancelled && (
              <>
                <div
                  className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={trip.maxParticipants}
                  aria-valuenow={seatsTaken}
                  aria-label="Posti occupati"
                >
                  <div className="h-full bg-amber-500" style={{ width: `${occupiedPercent}%` }} />
                </div>
                <p className="mt-2 font-semibold text-amber-800" data-testid="guided-trip-seats">
                  {seatsLeftLabel(trip.seats.availableSeats, trip.maxParticipants)}
                </p>
              </>
            )}

            <dl className="mt-4 divide-y divide-gray-100 text-base">
              <div className="flex justify-between py-2">
                <dt className="text-gray-600">Date</dt>
                <dd className="font-semibold text-gray-900">{formatCalendarRange(departure, new Date(trip.returnDate))}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-600">Iscrizioni entro</dt>
                <dd className="font-semibold text-gray-900">{formatCalendarDay(new Date(trip.registrationDeadline))}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-600">Disdetta gratuita</dt>
                <dd className="font-semibold text-gray-900">fino al {formatCalendarDay(new Date(trip.selfCancellationLastDay))}</dd>
              </div>
            </dl>

            <GuidedTripBookingPanel
              guidedTripId={trip.id}
              slug={trip.slug}
              isAuthenticated={viewer !== null}
              viewerIsOrganizer={viewerIsOrganizer}
              closedMessage={trip.registrationClosedMessage}
              viewerRegistration={viewerRegistration}
            />

            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              Puoi disdire fino a {trip.cancellationNoticeDays} giorni prima della partenza: il posto torna libero e il
              rimborso viene eseguito dallo staff RideAtlas.
            </p>

            <div className="mt-4 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold" aria-hidden="true">
                {(trip.organizer.name ?? 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{trip.organizer.name ?? 'Ranger'}</p>
                <p className="text-sm text-gray-500">Ranger · organizzatore</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
