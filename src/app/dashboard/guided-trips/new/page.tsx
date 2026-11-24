import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { DEFAULT_CANCELLATION_NOTICE_DAYS } from '@/lib/guided-trips/guided-trip-rules'
import { UserPermissions } from '@/types/profile'
import GuidedTripForm from '@/components/guided-trips/GuidedTripForm'

export const dynamic = 'force-dynamic'

export default async function NewGuidedTripPage() {
  const user = await currentActingUser()
  if (!user) redirect('/auth/signin?callbackUrl=/dashboard/guided-trips/new')
  if (!UserPermissions.canCreateTrips(user.role)) redirect('/dashboard?error=insufficient-permissions')

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gray-500">
          <Link href="/dashboard/guided-trips" className="hover:underline">I miei viaggi guidati</Link> › Nuovo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Nuovo viaggio guidato</h1>
        <p className="mt-1 text-gray-600">Il viaggio viene salvato come bozza: lo pubblichi tu quando è pronto.</p>
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <GuidedTripForm
            mode="create"
            initialValues={{
              title: '',
              description: '',
              program: '',
              includedServices: '',
              coverImageUrl: '',
              departureDate: '',
              returnDate: '',
              meetingPoint: '',
              maxParticipants: '8',
              pricePerParticipant: '',
              registrationDeadline: '',
              cancellationNoticeDays: String(DEFAULT_CANCELLATION_NOTICE_DAYS),
            }}
          />
        </div>
      </div>
    </main>
  )
}
