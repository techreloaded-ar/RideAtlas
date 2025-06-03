// src/app/edit-trip/[id]/page.tsx
import EditTripForm from '@/components/EditTripForm'

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

export async function generateMetadata() {
  return {
    title: 'Modifica Viaggio - RideAtlas',
    description: 'Modifica le informazioni del tuo viaggio'
  }
}
