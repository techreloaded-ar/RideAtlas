import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm';

export const dynamic = 'force-dynamic';

export default async function NewGuidedTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  const role = session.user.role as UserRole;
  if (role !== UserRole.Ranger && role !== UserRole.Sentinel) redirect('/dashboard?error=insufficient-permissions');

  const linkableTrips = await GuidedTripService.listLinkableTrips();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/guided-trips?tab=organized" className="text-sm text-gray-500 hover:text-gray-700">← I miei viaggi guidati</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuovo viaggio guidato</h1>
        <p className="text-gray-600 text-sm mb-5">Lo salvi come bozza e lo pubblichi quando è pronto.</p>
        <GuidedTripForm
          mode="create"
          status="Bozza"
          occupiedSeats={0}
          linkableTrips={linkableTrips}
          initialValues={{ title: '', description: '', startDate: '', endDate: '', meetingPoint: '', pricePerPerson: 0, maxParticipants: 8, linkedTripId: null }}
        />
      </div>
    </div>
  );
}
