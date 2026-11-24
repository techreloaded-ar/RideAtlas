import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { UserPermissions } from '@/types/profile'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { formatCalendarRange } from '@/lib/guided-trips/guided-trip-rules'
import { formatEuro, seatsLeftLabel } from '@/components/guided-trips/guided-trip-format'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Viaggi guidati | RideAtlas',
  description: 'Viaggi in moto a numero chiuso accompagnati dai Ranger di RideAtlas',
}

export default async function GuidedTripsPage() {
  const [guidedTrips, viewer] = await Promise.all([GuidedTripService.listPublishedUpcoming(), currentActingUser()])
  // Stessa regola della pagina Viaggi: l'invito a creare lo vede chi può organizzare.
  const canOrganize = viewer ? UserPermissions.canCreateTrips(viewer.role) : false

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-700 to-secondary-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Viaggi guidati</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Parti in gruppo, accompagnato da un Ranger. Posti limitati: scegli la data e iscriviti.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {guidedTrips.length === 0 ? (
          <div className="text-center py-20" data-testid="guided-trips-empty">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">Nessun viaggio guidato in programma</h2>
                <p className="text-gray-500">
                  Al momento non ci sono viaggi guidati con iscrizioni aperte.{canOrganize && ' Organizza tu il primo!'}
                </p>
              </div>
              {canOrganize && (
                <Link href="/dashboard/guided-trips/new" className="btn-primary inline-flex items-center gap-2">
                  <Users className="w-5 h-5" aria-hidden="true" />
                  Organizza il primo viaggio guidato
                </Link>
              )}
            </div>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="guided-trips-list">
            {guidedTrips.map(trip => {
              const soldOut = trip.seats.availableSeats <= 0
              return (
                <li key={trip.id}>
                  <Link
                    href={`/guided-trips/${trip.slug}`}
                    className="block h-full bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <div
                      className="h-36 bg-gradient-to-r from-primary-700 to-secondary-600 bg-cover bg-center"
                      style={trip.coverImageUrl ? { backgroundImage: `url("${trip.coverImageUrl}")` } : undefined}
                      aria-hidden="true"
                    />
                    <div className="p-5">
                      <span
                        className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${soldOut ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {seatsLeftLabel(trip.seats.availableSeats, trip.maxParticipants)}
                      </span>
                      <h2 className="mt-3 text-xl font-bold text-gray-900">{trip.title}</h2>
                      <p className="mt-2 flex items-center text-gray-700">
                        <CalendarDays className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                        {formatCalendarRange(new Date(trip.departureDate), new Date(trip.returnDate))}
                      </p>
                      <p className="mt-1 flex items-center text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{trip.meetingPoint}</span>
                      </p>
                      <p className="mt-1 flex items-center text-gray-700">
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                        Guidato da {trip.organizer.name ?? 'un Ranger'}
                      </p>
                      <p className="mt-4 text-2xl font-bold text-gray-900">
                        {formatEuro(trip.pricePerParticipant)} <span className="text-base font-normal text-gray-500">a partecipante</span>
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {guidedTrips.length > 0 && canOrganize && (
          <div className="mt-16 text-center" data-testid="guided-trips-organize-cta">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vuoi guidare un gruppo?</h2>
              <p className="text-gray-600 mb-6">
                Organizza un viaggio guidato a numero chiuso: scegli date, posti e prezzo e accompagna altri motociclisti
              </p>
              <Link href="/dashboard/guided-trips/new" className="btn-primary inline-flex items-center gap-2">
                <Users className="w-5 h-5" aria-hidden="true" />
                Organizza un viaggio guidato
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
