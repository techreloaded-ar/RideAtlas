import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm';

export const dynamic = 'force-dynamic';

export default async function EditGuidedTripPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  const { id } = await params;

  const guidedTrip = await GuidedTripService.getForEditing(id, { id: session.user.id, role: session.user.role as UserRole });
  if (!guidedTrip || guidedTrip.status === 'Annullato') notFound();
  const linkableTrips = await GuidedTripService.listLinkableTrips();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/guided-trips?tab=organized" className="text-sm text-gray-500 hover:text-gray-700">← I miei viaggi guidati</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-5">Modifica viaggio guidato</h1>
        <GuidedTripForm
          mode="edit"
          guidedTripId={guidedTrip.id}
          status={guidedTrip.status}
          occupiedSeats={guidedTrip.occupiedSeats}
          linkableTrips={linkableTrips}
          initialValues={{
            title: guidedTrip.title,
            description: guidedTrip.description,
            startDate: guidedTrip.startDate,
            endDate: guidedTrip.endDate,
            meetingPoint: guidedTrip.meetingPoint,
            pricePerPerson: guidedTrip.pricePerPerson,
            maxParticipants: guidedTrip.maxParticipants,
            linkedTripId: guidedTrip.linkedTripId,
          }}
        />
      </div>
    </div>
  );
}
