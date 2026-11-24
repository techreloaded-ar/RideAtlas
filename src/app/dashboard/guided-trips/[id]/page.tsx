import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { GuidedTripError, getGuidedTripManagementView, listLinkableTrips } from '@/lib/guided-trips/guidedTripService';
import { formatEuro, type GuidedTripBookingStatusValue } from '@/lib/guided-trips/guidedTripRules';
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm';
import GuidedTripLifecycleActions from '@/components/guided-trips/GuidedTripLifecycleActions';

export const dynamic = 'force-dynamic';

const STATUS_BADGES = {
  Bozza: 'bg-gray-200 text-gray-700',
  Pubblicato: 'bg-green-100 text-green-800',
  Annullato: 'bg-red-100 text-red-800',
} as const;

function participantStatus(status: GuidedTripBookingStatusValue, cancelledByUser: boolean): { label: string; className: string } {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confermato', className: 'bg-green-100 text-green-800' };
    case 'REFUNDED':
      return { label: cancelledByUser ? 'Disdetto · rimborsato' : 'Rimborsato', className: 'bg-gray-200 text-gray-700' };
    case 'REFUND_PENDING':
      return { label: 'Da rimborsare', className: 'bg-amber-100 text-amber-800' };
    case 'REFUND_FAILED':
      return { label: cancelledByUser ? 'Disdetto · rimborso in verifica' : 'Rimborso in verifica', className: 'bg-red-100 text-red-800' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-700' };
  }
}

export default async function ManageGuidedTripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  const { id } = await params;
  const { created } = await searchParams;

  let view;
  try {
    view = await getGuidedTripManagementView({ id: session.user.id, role: session.user.role }, id);
  } catch (error) {
    if (error instanceof GuidedTripError && error.httpStatus === 403) redirect('/dashboard?error=insufficient-permissions');
    throw error;
  }
  if (!view) notFound();
  const linkableTrips = await listLinkableTrips();
  const { guidedTrip } = view;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-sm font-medium text-primary-700 hover:underline">← Dashboard</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{guidedTrip.title}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[guidedTrip.status]}`}>{guidedTrip.status}</span>
          {guidedTrip.status !== 'Bozza' && (
            <Link href={`/guided-trips/${guidedTrip.id}`} className="text-sm font-medium text-primary-700 hover:underline">Vedi la pagina pubblica →</Link>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">Viaggio guidato organizzato da {guidedTrip.organizerName}</p>
        {created && <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">Bozza salvata. Pubblicala quando è pronta.</p>}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-gray-900">Dati del viaggio</h2>
            {guidedTrip.status === 'Annullato' && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Il viaggio è stato annullato e non può più essere modificato.</p>
            )}
            <GuidedTripForm
              guidedTripId={guidedTrip.id}
              readOnly={guidedTrip.status === 'Annullato'}
              linkableTrips={linkableTrips}
              initialValues={{
                title: guidedTrip.title,
                description: guidedTrip.description,
                startDate: guidedTrip.startDate,
                endDate: guidedTrip.endDate,
                meetingPoint: guidedTrip.meetingPoint,
                pricePerPerson: String(guidedTrip.pricePerPerson),
                maxParticipants: String(guidedTrip.maxParticipants),
                freeCancellationUntil: guidedTrip.freeCancellationUntil,
                linkedTripId: guidedTrip.linkedTripId ?? '',
              }}
            />
            <p className="text-xs text-gray-500">Un nuovo prezzo vale solo per le prenotazioni future; il massimo dei partecipanti non può scendere sotto i posti già occupati.</p>
            <GuidedTripLifecycleActions guidedTripId={guidedTrip.id} status={guidedTrip.status} confirmedCount={view.confirmedCount} />
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-gray-900">Iscritti</h2>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Iscritti</dt>
                <dd className="text-xl font-bold text-gray-900" data-testid="guided-trip-confirmed-count">{view.confirmedCount} / {guidedTrip.maxParticipants}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Incassato</dt>
                <dd className="text-xl font-bold text-gray-900">{formatEuro(view.collectedAmount)}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Disdette</dt>
                <dd className="text-xl font-bold text-gray-900">{view.userCancellations}</dd>
              </div>
            </dl>
            {view.participants.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">Ancora nessun iscritto.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                      <th scope="col" className="px-3 py-2 font-semibold">Partecipante</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Prenotato il</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.participants.map(participant => {
                      const badge = participantStatus(participant.status as GuidedTripBookingStatusValue, participant.cancelledByUserAt !== null);
                      return (
                        <tr key={participant.bookingId} className="border-b border-gray-100">
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-gray-900">{participant.name}</p>
                            <p className="text-xs text-gray-500">{participant.email}</p>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">
                            {new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Rome' }).format(new Date(participant.bookedAt))}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {guidedTrip.status === 'Pubblicato' && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Se annulli il viaggio, gli iscritti lo vedranno come «Annullato» e un Sentinel eseguirà i rimborsi.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
