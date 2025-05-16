import Link from 'next/link';
import Image from 'next/image';
import ReadyToStart from '@/components/ReadyToStart';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                Scopri itinerari in moto personalizzati con RideAtlas
              </h1>
              <p className="text-xl">
                Pacchetti viaggio multimediali e costruttore di percorsi assistito da AI per gli appassionati di viaggi in moto.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/pacchetti" className="btn-primary">
                  Esplora Pacchetti
                </Link>
                <Link href="/trip-builder" className="bg-white text-primary-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-md transition-colors">
                  Crea Itinerario
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-black/20 z-10 rounded-lg"></div>
              <div className="relative h-full w-full">
                {/* Placeholder per immagine hero */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30 flex items-center justify-center">
                  <Image
                    src="/panoramica-moto.jpg"
                    alt="Moto panoramica con vista sulle colline"
                    fill
                    className="object-cover rounded-lg"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Caratteristiche Principali</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="h-12 w-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Pacchetti Viaggio Curati</h3>
              <p className="text-gray-600">Itinerari di qualità con tracce GPX esplorate da ranger esperti, completi di storytelling e punti di interesse.</p>
            </div>
            
            <div className="card">
              <div className="h-12 w-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Trip Builder con AI</h3>
              <p className="text-gray-600">Costruisci il tuo itinerario personalizzato inserendo date, durata, budget e preferenze con l'assistenza dell'intelligenza artificiale.</p>
            </div>
            
            <div className="card">
              <div className="h-12 w-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Comunità di Ranger</h3>
              <p className="text-gray-600">Unisciti alla nostra comunità di esploratori che condividono percorsi, foto e consigli per creare esperienze uniche.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ReadyToStart />
    </main>
  );
}