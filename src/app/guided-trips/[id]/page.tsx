import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin } from 'lucide-react';
import { auth } from '@/auth';
import { getGuidedTripDetail } from '@/lib/guided-trips/guidedTripService';
import { durationInDays, formatStoredDay } from '@/lib/guided-trips/guidedTripRules';
import GuidedTripBookingPanel from '@/components/guided-trips/GuidedTripBookingPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Viaggio guidato | RideAtlas' };

export default async function GuidedTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const viewer = session?.user?.id ? { id: session.user.id, role: session.user.role } : null;
  const guidedTrip = await getGuidedTripDetail(id, viewer);
  if (!guidedTrip) notFound();

  const days = durationInDays(new Date(guidedTrip.startDate), new Date(guidedTrip.endDate));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/guided-trips" className="text-sm font-medium text-primary-700 hover:underline">← Tutti i viaggi guidati</Link>
        <div className="relative mt-4 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-primary-300 via-primary-700 to-primary-900 sm:h-56">
          {guidedTrip.coverImageUrl && <Image src={guidedTrip.coverImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Viaggio guidato</span>
              {guidedTrip.status === 'Bozza' && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Bozza · visibile solo a te</span>}
              {guidedTrip.status === 'Annullato' && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Annullato</span>}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{guidedTrip.title}</h1>
            <p className="mt-1 text-gray-600">
              Dal {formatStoredDay(guidedTrip.startDate)} al {formatStoredDay(guidedTrip.endDate)} · {days} {days === 1 ? 'giorno' : 'giorni'} · guidato da{' '}
              <span className="font-semibold text-primary-700">{guidedTrip.organizer.name}</span>
            </p>
            {guidedTrip.viewerCanManage && (
              <Link href={`/dashboard/guided-trips/${guidedTrip.id}`} className="mt-3 inline-block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Gestisci viaggio e iscritti
              </Link>
            )}

            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Il programma</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-gray-700">{guidedTrip.description}</p>
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Ritrovo</h2>
              <p className="mt-2 flex items-start gap-2 text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" aria-hidden />
                <span>{guidedTrip.meetingPoint} · {formatStoredDay(guidedTrip.startDate, { day: 'numeric', month: 'long' })}</span>
              </p>
            </section>

            {guidedTrip.linkedTrip && (
              <section className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">Itinerario collegato</h2>
                <div className="mt-2 flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <CalendarDays className="h-8 w-8 flex-shrink-0 text-blue-600" aria-hidden />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{guidedTrip.linkedTrip.title}</p>
                    <p className="text-xs text-gray-600">
                      {guidedTrip.linkedTrip.stagesCount > 0 ? `${guidedTrip.linkedTrip.stagesCount} tappe · ` : ''}
                      {guidedTrip.linkedTrip.durationDays} giorni
                    </p>
                  </div>
                  <Link href={`/trips/${guidedTrip.linkedTrip.slug}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Vedi tappe →
                  </Link>
                </div>
              </section>
            )}
          </div>

          <aside>
            <GuidedTripBookingPanel guidedTrip={guidedTrip} isLoggedIn={viewer !== null} />
          </aside>
        </div>
      </div>
    </div>
  );
}
