import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { GuidedTripService } from '@/lib/guided-trips/service';
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm';

export const dynamic = 'force-dynamic';

export default async function EditGuidedTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/guided-trips/${id}/edit`);
  const trip = await GuidedTripService.getView(id);
  if (!trip || trip.organizer.id !== session.user.id) notFound();
  if (trip.status === 'Ritirato') redirect(`/guided-trips/${id}`);
  const linkableTrips = await GuidedTripService.linkableTrips(session.user.id);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Modifica viaggio guidato</h1>
        <GuidedTripForm
          guidedTripId={trip.id}
          currentStatus={trip.status === 'Pubblicato' ? 'Pubblicato' : 'Bozza'}
          linkableTrips={linkableTrips}
          bookedSeats={trip.seats.taken}
          initial={{
            title: trip.title,
            description: trip.description,
            included: trip.included,
            startDate: trip.startDate.slice(0, 10),
            endDate: trip.endDate.slice(0, 10),
            meetingPoint: trip.meetingPoint,
            price: trip.price.toFixed(2),
            maxParticipants: String(trip.maxParticipants),
            linkedTripId: trip.linkedTrip?.id ?? '',
          }}
        />
      </div>
    </div>
  );
}
