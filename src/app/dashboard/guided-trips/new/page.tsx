import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { canOrganizeGuidedTrips, listLinkableTrips } from '@/lib/guided-trips/guidedTripService';
import GuidedTripForm, { EMPTY_GUIDED_TRIP_FORM } from '@/components/guided-trips/GuidedTripForm';

export const dynamic = 'force-dynamic';

export default async function NewGuidedTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  if (!canOrganizeGuidedTrips({ id: session.user.id, role: session.user.role })) redirect('/dashboard?error=insufficient-permissions');
  const linkableTrips = await listLinkableTrips();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-sm font-medium text-primary-700 hover:underline">← Dashboard</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Nuovo viaggio guidato</h1>
        <p className="mt-1 text-sm text-gray-600">Salva la bozza, poi pubblicala quando è pronta: da quel momento gli utenti possono prenotare e pagare.</p>
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <GuidedTripForm initialValues={EMPTY_GUIDED_TRIP_FORM} linkableTrips={linkableTrips} />
        </div>
      </div>
    </div>
  );
}
