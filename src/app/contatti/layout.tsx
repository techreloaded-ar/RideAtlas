import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contatti - RideAtlas',
  description: 'Contattaci per domande, suggerimenti o informazioni sui nostri itinerari in moto. Siamo qui per aiutarti a pianificare la tua prossima avventura.',
};

export default function ContattiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
