// src/app/edit-trip/[id]/page.tsx
import { prisma } from '@/lib/core/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { canEditTrip } from '@/lib/auth/trip-access';
import EditTripForm from '@/components/trips/EditTripForm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface EditTripPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const session = await auth();

  // Fetch trip data to check permissions
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      user_id: true,
      title: true // Include title for better error context if needed
    }
  });

  // If trip doesn't exist, return 404
  if (!trip) {
    notFound();
  }

  // Check if user can edit this trip
  const userCanEdit = canEditTrip(
    {
      id: trip.id,
      status: trip.status,
      user_id: trip.user_id
    },
    session
  );

  // If user cannot edit, return 404 (don't reveal trip exists)
  if (!userCanEdit) {
    notFound();
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <EditTripForm tripId={id} />
    </main>
  );
}
