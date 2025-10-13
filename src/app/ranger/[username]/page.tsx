// src/app/ranger/[username]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getRangerProfile } from '@/lib/actions/ranger';
import { RangerProfileHeader } from '@/components/ranger/RangerProfileHeader';
import { RangerTripsList } from '@/components/ranger/RangerTripsList';

// Set page revalidation to 1 hour for caching
export const revalidate = 3600;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const result = await getRangerProfile(decodedUsername);

  if (!result.success) {
    return {
      title: 'Profilo non trovato | RideAtlas',
      description: 'Il profilo che stai cercando non esiste o non è disponibile.',
    };
  }

  const { ranger } = result.data;

  return {
    title: `${ranger.name} - Profilo Ranger | RideAtlas`,
    description: ranger.bio
      ? `Scopri i viaggi di ${ranger.name}. ${ranger.bio.substring(0, 150)}...`
      : `Scopri tutti i viaggi pubblicati da ${ranger.name} su RideAtlas.`,
    openGraph: {
      title: `${ranger.name} - Profilo Ranger`,
      description: ranger.bio || `Viaggi di ${ranger.name}`,
      images: ranger.image ? [ranger.image] : [],
      type: 'profile',
    },
  };
}

export default async function RangerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Validate username parameter
  if (!username || typeof username !== 'string') {
    console.error('Invalid username parameter:', username);
    notFound();
  }

  // Decode username from URL
  const decodedUsername = decodeURIComponent(username);

  // Fetch ranger profile data
  const result = await getRangerProfile(decodedUsername);

  // Handle errors
  if (!result.success) {
    if (result.error.type === 'NOT_FOUND' || result.error.type === 'INVALID_ROLE') {
      notFound();
    }

    // For any other error, throw to trigger error boundary
    throw new Error(`Failed to load ranger profile: ${result.error.message}`);
  }

  const { ranger, trips } = result.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Section */}
        <div className="mb-8">
          <RangerProfileHeader ranger={ranger} tripsCount={trips.length} />
        </div>

        {/* Trips List Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <RangerTripsList rangerName={ranger.name} trips={trips} />
        </div>
      </div>
    </div>
  );
}
