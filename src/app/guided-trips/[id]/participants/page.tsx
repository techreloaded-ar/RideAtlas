import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripError, GuidedTripService } from '@/lib/guided-trips/service';
import { formatLongDate, formatShortDate } from '@/lib/guided-trips/rules';
import SeatIndicator from '@/components/guided-trips/SeatIndicator';

export const dynamic = 'force-dynamic';

export default async function GuidedTripParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/guided-trips/${id}/participants`);
  const actor = { id: session.user.id, role: session.user.role as UserRole };
  const trip = await GuidedTripService.getView(id);
  if (!trip) notFound();
  let participants;
  try {
    participants = await GuidedTripService.participants(actor, id);
  } catch (error) {
    if (error instanceof GuidedTripError && error.status === 403) redirect('/dashboard?error=insufficient-permissions');
    throw error;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/guided-trips/${trip.id}`} className="text-sm font-medium text-primary-700 hover:underline">← {trip.title}</Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Partecipanti</h1>
        <p className="mb-4 mt-1 text-gray-600">{trip.title} · partenza {formatLongDate(new Date(trip.startDate))}</p>
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm"><SeatIndicator seats={trip.seats} /></div>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {participants.length === 0 ? (
            <p className="p-6 text-center text-gray-600">Nessun posto ancora confermato.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Confermato il</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.user.name || '—'}</td>
                    <td className="px-4 py-3"><a href={`mailto:${p.user.email}`} className="text-primary-700 hover:underline">{p.user.email}</a></td>
                    <td className="px-4 py-3 text-gray-600">{p.confirmedAt ? formatShortDate(p.confirmedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
