// src/app/create-trip/page.tsx
import CreateTripForm from '@/components/CreateTripForm';
import Navbar from '@/components/Navbar'; // Assumendo che Navbar sia il componente di navigazione principale
import Footer from '@/components/Footer'; // Assumendo che Footer sia il componente piè di pagina

export default function CreateTripPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <CreateTripForm />
      </main>
      <Footer />
    </div>
  );
}