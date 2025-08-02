import './globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: 'RideAtlas - Itinerari in moto personalizzati',
  description: 'Piattaforma per appassionati di viaggi in moto con itinerari curati e personalizzabili, viaggi multimediali e costruttore di percorsi assistito da AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.variable} ${montserrat.variable} font-sans min-h-screen flex flex-col`}>
        <SessionProvider 
          refetchInterval={0}
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
          <CookieBanner />
        </SessionProvider>
      </body>
    </html>
  );
}