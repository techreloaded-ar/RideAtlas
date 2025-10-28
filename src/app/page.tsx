import Link from 'next/link';
import Image from 'next/image';
import ReadyToStart from '@/components/layout/ReadyToStart';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary-900 via-secondary-800 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                Scopri itinerari in moto personalizzati con RideAtlas
              </h1>
              <p className="text-2xl font-semibold text-primary-200 italic mb-2">
                &quot;Il viaggio lo progettiamo insieme, tu guidi l&apos;avventura&quot;
              </p>
              
              {/* Badge di certificazione qualità */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-nature-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.286.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">✓ Itinerari Testati & Certificati</p>
                  <p className="text-primary-200 text-sm">Verificati dai nostri ranger esperti</p>
                </div>
              </div>              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/trips" className="btn-primary">
                  Esplora Viaggi
                </Link>
                <Link href="/trip-builder" className="bg-white text-secondary-800 hover:bg-gray-100 font-semibold py-2 px-4 rounded-md transition-colors">
                  Crea Itinerario
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-black/20 z-10 rounded-lg"></div>
              <div className="relative h-full w-full">
                {/* Placeholder per immagine hero */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-800/30 flex items-center justify-center">
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
      <section className="py-16 bg-gradient-to-b from-white to-nature-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-secondary-800">Caratteristiche Principali</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-nature-200 text-nature-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-800">Viaggi Curati & Certificati</h3>
              <p className="text-secondary-600 mb-3">Itinerari di qualità con tracce GPX <strong>testati e verificati</strong> da ranger esperti, completi di storytelling e punti di interesse.</p>
              
              {/* Indicatori di qualità */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-nature-100 text-nature-800 px-2 py-1 rounded-full font-medium">✓ Testato su strada</span>
                <span className="bg-nature-100 text-nature-800 px-2 py-1 rounded-full font-medium">✓ Verificato sicurezza</span>
                <span className="bg-nature-100 text-nature-800 px-2 py-1 rounded-full font-medium">✓ GPS certificato</span>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                COMING SOON
              </div>

              <div className="h-12 w-12 bg-primary-200 text-primary-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-800">Trip Builder con AI</h3>
              <p className="text-secondary-600 mb-3">Costruisci il tuo itinerario personalizzato inserendo date, durata, budget e preferenze con l&apos;assistenza dell&apos;intelligenza artificiale <strong>supportata dai nostri ranger esperti</strong>.</p>
              
              {/* Badge supporto umano */}
              <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50 px-3 py-2 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Supporto umano sempre disponibile</span>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-road-200 text-road-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-800">Comunità di Ranger</h3>
              <p className="text-secondary-600">Unisciti alla nostra comunità di esploratori che condividono percorsi, foto e consigli per creare esperienze uniche.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ReadyToStart />
    </main>
  );
}