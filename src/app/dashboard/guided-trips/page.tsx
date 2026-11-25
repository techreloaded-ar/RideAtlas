import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import MyGuidedTripBookings from '@/components/guided-trips/MyGuidedTripBookings';
import OrganizedGuidedTrips from '@/components/guided-trips/OrganizedGuidedTrips';

export const dynamic = 'force-dynamic';

type DashboardTab = 'bookings' | 'organized';

export default async function GuidedTripsDashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string; booked?: string; saved?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const { tab, booked, saved } = await searchParams;
  const role = session.user.role as UserRole;
  const canOrganize = role === UserRole.Ranger || role === UserRole.Sentinel;
  const activeTab: DashboardTab = tab === 'bookings' || !canOrganize ? 'bookings' : 'organized';

  const tabClass = (isActive: boolean) =>
    `pb-2 -mb-px border-b-2 text-sm ${isActive ? 'border-primary-600 text-primary-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Viaggi guidati</h1>
          </div>
          {canOrganize && (
            <Link href="/dashboard/guided-trips/new" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm">
              <Plus className="w-4 h-4" aria-hidden /> Nuovo viaggio guidato
            </Link>
          )}
        </div>

        <nav className="flex gap-6 border-b border-gray-200 mt-4 mb-6" aria-label="Sezioni viaggi guidati">
          {canOrganize && (
            <Link href="/dashboard/guided-trips?tab=organized" className={tabClass(activeTab === 'organized')} aria-current={activeTab === 'organized' ? 'page' : undefined}>
              I miei viaggi guidati
            </Link>
          )}
          <Link href="/dashboard/guided-trips?tab=bookings" className={tabClass(activeTab === 'bookings')} aria-current={activeTab === 'bookings' ? 'page' : undefined}>
            Le mie prenotazioni
          </Link>
        </nav>

        {activeTab === 'organized' ? (
          <OrganizedGuidedTrips guidedTrips={await GuidedTripService.listOrganizedBy(session.user.id)} savedGuidedTripId={saved ?? null} />
        ) : (
          <MyGuidedTripBookings bookings={await GuidedTripService.listBookingsOf(session.user.id)} justBookedId={booked ?? null} />
        )}
      </div>
    </div>
  );
}
