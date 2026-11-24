import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { GuidedTripService, GuidedTripServiceError } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { formatCalendarDay, isoDateFromCalendarDay } from '@/lib/guided-trips/guided-trip-rules'
import {
  GUIDED_TRIP_STATUS_BADGE_CLASSES,
  GUIDED_TRIP_STATUS_LABELS,
  REGISTRATION_STATUS_BADGE_CLASSES,
  registrationStatusLabel,
} from '@/components/guided-trips/guided-trip-format'
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm'
import GuidedTripLifecycleActions from '@/components/guided-trips/GuidedTripLifecycleActions'

export const dynamic = 'force-dynamic'

export default async function ManageGuidedTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await currentActingUser()
  if (!user) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/guided-trips/${id}`)}`)

  let management
  try {
    management = await GuidedTripService.getForManagement(id, user)
  } catch (error) {
    if (error instanceof GuidedTripServiceError && error.httpStatus === 404) notFound()
    if (error instanceof GuidedTripServiceError && error.httpStatus === 403) redirect('/dashboard?error=insufficient-permissions')
    throw error
  }
  const { trip, participants } = management
  const hasRegistrations = participants.length > 0 || trip.seats.occupiedSeats > 0
  const statusSubtitle =
    trip.displayStatus === 'Pubblicato' ? (trip.registrationClosedMessage ? ` · ${trip.registrationClosedMessage.toLowerCase()}` : ' · iscrizioni aperte') : ''

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gray-500">
          <Link href="/dashboard/guided-trips" className="hover:underline">Area Ranger › I miei viaggi guidati</Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${GUIDED_TRIP_STATUS_BADGE_CLASSES[trip.displayStatus]}`} data-testid="guided-trip-status">
            {GUIDED_TRIP_STATUS_LABELS[trip.displayStatus]}{statusSubtitle}
          </span>
        </div>

        <div className="mt-4">
          <GuidedTripLifecycleActions
            guidedTripId={trip.id}
            slug={trip.slug}
            status={trip.status}
            confirmedParticipants={trip.seats.confirmedParticipants}
          />
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-[28rem] bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dati del viaggio guidato</h2>
            <GuidedTripForm
              mode="edit"
              guidedTripId={trip.id}
              priceLocked={hasRegistrations}
              readOnly={trip.status === 'Annullato'}
              initialValues={{
                title: trip.title,
                description: trip.description,
                program: trip.program,
                includedServices: trip.includedServices ?? '',
                coverImageUrl: trip.coverImageUrl ?? '',
                departureDate: isoDateFromCalendarDay(new Date(trip.departureDate)),
                returnDate: isoDateFromCalendarDay(new Date(trip.returnDate)),
                meetingPoint: trip.meetingPoint,
                maxParticipants: String(trip.maxParticipants),
                pricePerParticipant: trip.pricePerParticipant.toFixed(2),
                registrationDeadline: isoDateFromCalendarDay(new Date(trip.registrationDeadline)),
                cancellationNoticeDays: String(trip.cancellationNoticeDays),
              }}
            />
          </section>

          <section className="flex-1 bg-white border border-gray-200 rounded-xl p-6" data-testid="guided-trip-participants">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Partecipanti · {trip.seats.confirmedParticipants} confermati su {trip.maxParticipants}
            </h2>
            {participants.length === 0 ? (
              <p className="text-gray-600">Ancora nessun iscritto.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="text-sm text-gray-600 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-2 py-2 font-medium">Nome</th>
                      <th scope="col" className="px-2 py-2 font-medium">Email</th>
                      <th scope="col" className="px-2 py-2 font-medium">Iscritto il</th>
                      <th scope="col" className="px-2 py-2 font-medium">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {participants.map(participant => {
                      const inactive = participant.status !== 'CONFIRMED'
                      return (
                        <tr key={participant.registrationId} className={inactive ? 'text-gray-400' : 'text-gray-900'}>
                          <td className="px-2 py-3">{participant.name ?? '—'}</td>
                          <td className="px-2 py-3">{participant.email}</td>
                          <td className="px-2 py-3">{formatCalendarDay(new Date(participant.registeredAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className="px-2 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${REGISTRATION_STATUS_BADGE_CLASSES[participant.status]}`}>
                              {registrationStatusLabel(participant.status, participant.cancellationOrigin)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
