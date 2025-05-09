import './globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: 'RideAtlas - Itinerari in moto personalizzati',
  description: 'Piattaforma per appassionati di viaggi in moto con itinerari curati e personalizzabili, pacchetti viaggio multimediali e costruttore di percorsi assistito da AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="it">
        <body className={`${inter.variable} ${montserrat.variable} font-sans min-h-screen flex flex-col`}>
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}