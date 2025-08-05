import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import PurchasePageClient from '@/components/PurchasePageClient';
import { PurchaseService } from '@/lib/purchaseService';

export const dynamic = 'force-dynamic';

interface PurchasePageProps {
  params: { tripId: string };
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=' + encodeURIComponent(`/purchase/${params.tripId}`));
  }

  const trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
    select: {
      id: true,
      title: true,
      summary: true,
      destination: true,
      duration_days: true,
      duration_nights: true,
      theme: true,
      price: true,
      status: true,
      user_id: true,
      slug: true,
      media: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!trip) {
    notFound();
  }

  if (trip.status !== 'Pubblicato') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-lg font-semibold text-yellow-800 mb-2">
              Viaggio non disponibile
            </h1>
            <p className="text-yellow-700">
              Questo viaggio non è ancora disponibile per l&apos;acquisto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (trip.user_id === session.user.id) {
    redirect(`/trips/${trip.slug}`);
  }

  const hasPurchased = await PurchaseService.hasPurchasedTrip(session.user.id, trip.id);
  
  if (hasPurchased) {
    redirect(`/trips/${trip.slug}?purchased=true`);
  }

  const tripData = {
    id: trip.id,
    title: trip.title,
    summary: trip.summary,
    destination: trip.destination,
    duration_days: trip.duration_days,
    duration_nights: trip.duration_nights,
    theme: trip.theme,
    price: Number(trip.price),
    slug: trip.slug,
    media: trip.media,
    creator: {
      name: trip.user.name || trip.user.email
    }
  };

  return <PurchasePageClient trip={tripData} />;
}