import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripBookingService, GuidedTripService } from '@/lib/guided-trips/service';
import { formatLongDate, formatPrice, GUIDED_TRIP_STATUS_LABELS } from '@/lib/guided-trips/rules';
import { getPaymentMode } from '@/lib/payment/paymentMode';
import SeatIndicator from '@/components/guided-trips/SeatIndicator';
import BookingPanel, { ViewerState } from '@/components/guided-trips/BookingPanel';
import { GuidedTripCover } from '@/components/guided-trips/GuidedTripCard';

export const dynamic = 'force-dynamic';

export default async function GuidedTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const actor = session?.user?.id ? { id: session.user.id, role: session.user.role as UserRole } : null;
  const trip = await GuidedTripService.getView(id);
  if (!trip || !GuidedTripService.canView(trip, actor)) notFound();

  let viewer: ViewerState = 'anonymous';
  if (actor) {
    if (actor.id === trip.organizer.id) viewer = 'organizer';
    else viewer = (await GuidedTripBookingService.statusForUser(actor.id, trip.id)) === 'CONFIRMED' ? 'confirmed' : 'can-book';
  }
  const canManage = !!actor && (actor.id === trip.organizer.id || actor.role === UserRole.Sentinel);
  const includedItems = trip.included.split(/\n|;/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/guided-trips" className="text-sm font-medium text-primary-700 hover:underline">← Tutti i viaggi guidati</Link>
        <GuidedTripCover url={trip.coverUrl} className="mb-6 mt-3 h-56 w-full rounded-xl" />
        {trip.status !== 'Pubblicato' && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Stato: <strong>{GUIDED_TRIP_STATUS_LABELS[trip.status]}</strong> — questo viaggio non è visibile agli Explorer.
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div>
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Viaggio guidato</span>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{trip.title}</h1>
              <p className="mt-1 text-gray-600">Guidato da <span className="font-semibold text-gray-800">{trip.organizer.name}</span></p>
            </div>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Il viaggio</h2>
              <p className="whitespace-pre-line text-gray-700">{trip.description}</p>
            </section>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Cosa è compreso</h2>
              <ul className="list-disc space-y-1 pl-5 text-gray-700">
                {includedItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
            {trip.linkedTrip && (
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">Percorso</h2>
                <p className="text-gray-700">
                  Basato sull&apos;itinerario{' '}
                  <Link href={`/trips/${trip.linkedTrip.slug}`} className="font-semibold text-primary-700 hover:underline">«{trip.linkedTrip.title}» →</Link>
                </p>
              </section>
            )}
          </div>
          <aside className="h-fit rounded-xl bg-white p-5 shadow-sm" aria-label="Prenotazione">
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between gap-4 py-2"><dt className="text-gray-600">Partenza</dt><dd className="text-right font-semibold">{formatLongDate(new Date(trip.startDate))}</dd></div>
              <div className="flex justify-between gap-4 py-2"><dt className="text-gray-600">Rientro</dt><dd className="text-right font-semibold">{formatLongDate(new Date(trip.endDate))}</dd></div>
              <div className="flex justify-between gap-4 py-2"><dt className="text-gray-600">Ritrovo</dt><dd className="text-right font-semibold">{trip.meetingPoint}</dd></div>
            </dl>
            <div className="my-4"><SeatIndicator seats={trip.seats} compact /></div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Prezzo a persona</span>
              <span className="text-2xl font-bold text-gray-900" data-testid="guided-trip-price">{formatPrice(trip.price)}</span>
            </div>
            <BookingPanel
              guidedTripId={trip.id}
              title={trip.title}
              price={trip.price}
              full={trip.seats.tone === 'full'}
              open={trip.openForBooking}
              viewer={viewer}
              paymentMode={getPaymentMode()}
            />
            {canManage && (
              <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                {actor?.id === trip.organizer.id && trip.status !== 'Ritirato' && (
                  <Link href={`/guided-trips/${trip.id}/edit`} className="font-semibold text-primary-700 hover:underline">Modifica</Link>
                )}
                <Link href={`/guided-trips/${trip.id}/participants`} className="font-semibold text-primary-700 hover:underline">Partecipanti</Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
