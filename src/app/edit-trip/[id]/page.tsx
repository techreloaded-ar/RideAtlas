// src/app/edit-trip/[id]/page.tsx
"use client";

import EditTripForm from '@/components/trips/EditTripForm'

interface EditTripPageProps {
  params: {
    id: string
  }
}

export default function EditTripPage({ params }: EditTripPageProps) {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <EditTripForm tripId={params.id} />
    </main>
  )
}
