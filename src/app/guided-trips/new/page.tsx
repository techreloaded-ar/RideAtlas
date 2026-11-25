import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { canOrganize, GuidedTripService } from '@/lib/guided-trips/service';
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm';

export const dynamic = 'force-dynamic';

export default async function NewGuidedTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/guided-trips/new');
  if (!canOrganize(session.user.role)) redirect('/dashboard?error=insufficient-permissions');
  const linkableTrips = await GuidedTripService.linkableTrips(session.user.id);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo viaggio guidato</h1>
        <p className="mb-6 mt-1 text-gray-600">Organizza una partenza in gruppo a numero chiuso. Una volta pubblicato, il viaggio è subito prenotabile.</p>
        <GuidedTripForm linkableTrips={linkableTrips} />
      </div>
    </div>
  );
}
