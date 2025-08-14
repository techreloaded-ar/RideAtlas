// src/app/edit-trip/[id]/page.tsx
"use client";

import EditTripForm from '@/components/trips/EditTripForm'
import { use } from 'react'

interface EditTripPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditTripPage({ params }: EditTripPageProps) {
  const { id } = use(params)
  
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <EditTripForm tripId={id} />
    </main>
  )
}
