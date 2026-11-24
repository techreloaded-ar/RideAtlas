import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { formatCalendarRange } from '@/lib/guided-trips/guided-trip-rules'
import { UserPermissions } from '@/types/profile'
import {
  GUIDED_TRIP_STATUS_BADGE_CLASSES,
  GUIDED_TRIP_STATUS_LABELS,
  formatEuro,
} from '@/components/guided-trips/guided-trip-format'

export const dynamic = 'force-dynamic'

export default async function MyGuidedTripsPage() {
  const user = await currentActingUser()
  if (!user) redirect('/auth/signin?callbackUrl=/dashboard/guided-trips')
  if (!UserPermissions.canCreateTrips(user.role)) redirect('/dashboard?error=insufficient-permissions')

  const guidedTrips = await GuidedTripService.listByOrganizer(user.id)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gray-500">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link> › I miei viaggi guidati
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">I miei viaggi guidati</h1>
          <Link
            href="/dashboard/guided-trips/new"
            className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Nuovo viaggio guidato
          </Link>
        </div>

        {guidedTrips.length === 0 ? (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-600">
            Non hai ancora organizzato viaggi guidati. Crea il primo: date, posti e prezzo li decidi tu.
          </div>
        ) : (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-sm text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Viaggio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Iscritti</th>
                  <th scope="col" className="px-4 py-3 font-medium">Prezzo</th>
                  <th scope="col" className="px-4 py-3 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guidedTrips.map(trip => (
                  <tr key={trip.id}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/guided-trips/${trip.id}`} className="font-semibold text-primary-700 hover:underline">
                        {trip.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatCalendarRange(new Date(trip.departureDate), new Date(trip.returnDate))}</td>
                    <td className="px-4 py-3 text-gray-700">{trip.seats.confirmedParticipants} su {trip.maxParticipants}</td>
                    <td className="px-4 py-3 text-gray-700">{formatEuro(trip.pricePerParticipant)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${GUIDED_TRIP_STATUS_BADGE_CLASSES[trip.displayStatus]}`}>
                        {GUIDED_TRIP_STATUS_LABELS[trip.displayStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
