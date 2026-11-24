import { notFound, redirect } from 'next/navigation'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser } from '@/lib/guided-trips/guided-trip-api'
import { formatCalendarDay, formatCalendarRange } from '@/lib/guided-trips/guided-trip-rules'
import { resolvePaymentMode } from '@/lib/payment/payment-mode'
import GuidedTripCheckout from '@/components/guided-trips/GuidedTripCheckout'

export const dynamic = 'force-dynamic'

export default async function GuidedTripRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await currentActingUser()
  if (!viewer) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/guided-trips/${slug}/iscrizione`)}`)

  const result = await GuidedTripService.getPublicBySlug(slug, viewer)
  if (!result) notFound()
  const { trip, viewerRegistration, viewerIsOrganizer } = result
  if (viewerIsOrganizer || viewerRegistration?.status === 'CONFIRMED') redirect(`/guided-trips/${slug}`)

  return (
    <GuidedTripCheckout
      paymentMode={resolvePaymentMode()}
      trip={{
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        dates: formatCalendarRange(new Date(trip.departureDate), new Date(trip.returnDate)),
        meetingPoint: trip.meetingPoint,
        price: trip.pricePerParticipant,
        organizerName: trip.organizer.name ?? 'Ranger',
        cancellationNoticeDays: trip.cancellationNoticeDays,
        selfCancellationLastDay: formatCalendarDay(new Date(trip.selfCancellationLastDay)),
        closedMessage: viewerRegistration?.status === 'PENDING_PAYMENT' ? null : trip.registrationClosedMessage,
      }}
    />
  )
}
