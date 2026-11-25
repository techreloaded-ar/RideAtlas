import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Map as MapIcon, Pencil } from 'lucide-react';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { guidedTripPaymentMode } from '@/lib/guided-trips/guidedTripPaymentGateway';
import { formatLongDate } from '@/lib/guided-trips/guidedTripFormat';
import GuidedTripBookingPanel from '@/components/guided-trips/GuidedTripBookingPanel';

export const dynamic = 'force-dynamic';

export default async function GuidedTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const viewer = session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role as UserRole } : null;
  const guidedTrip = await GuidedTripService.getDetail(id, viewer);
  if (!guidedTrip) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-40 bg-gradient-to-r from-primary-500 to-secondary-600" aria-hidden />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Viaggio guidato</span>
              {guidedTrip.status === 'Bozza' && <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Bozza: visibile solo a te</span>}
              {guidedTrip.status === 'Annullato' && <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Annullato</span>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{guidedTrip.title}</h1>
            <p className="text-gray-600 mt-1">con <strong>{guidedTrip.organizerName}</strong> · Ranger</p>
            {guidedTrip.viewerCanManage && guidedTrip.status !== 'Annullato' && (
              <Link href={`/dashboard/guided-trips/${guidedTrip.id}/edit`} className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 mt-2">
                <Pencil className="w-4 h-4" aria-hidden /> Modifica il viaggio guidato
              </Link>
            )}
          </div>

          {guidedTrip.status === 'Annullato' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              Il ranger ha annullato questo viaggio{guidedTrip.cancellationReason ? `: «${guidedTrip.cancellationReason}»` : ''}. I partecipanti sono stati rimborsati.
            </div>
          )}

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Il viaggio</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{guidedTrip.description}</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <dt className="text-sm text-gray-500">Partenza</dt>
                <dd className="font-semibold text-gray-900">{formatLongDate(guidedTrip.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Rientro</dt>
                <dd className="font-semibold text-gray-900">{formatLongDate(guidedTrip.endDate)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Punto di ritrovo</dt>
                <dd className="font-semibold text-gray-900">{guidedTrip.meetingPoint}</dd>
              </div>
            </dl>
          </section>

          {guidedTrip.linkedTrip && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800 flex items-center gap-2">
              <MapIcon className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                Questo viaggio guidato riprende il percorso dell&apos;itinerario{' '}
                <Link href={`/trips/${guidedTrip.linkedTrip.slug}`} className="font-semibold underline">{guidedTrip.linkedTrip.title}</Link>
              </span>
            </div>
          )}
        </div>

        <aside>
          <GuidedTripBookingPanel guidedTrip={guidedTrip} isLoggedIn={Boolean(viewer)} paymentMode={guidedTripPaymentMode()} />
        </aside>
      </div>
    </div>
  );
}
