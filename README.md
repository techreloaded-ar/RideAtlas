# RideAtlas

Piattaforma web + mobile in abbonamento per appassionati di viaggi in moto che offre pacchetti viaggio multimediali e un costruttore di percorsi assistito da AI.

## Caratteristiche Principali

- **Pacchetti Viaggio Curati**: Itinerari di qualità con tracce GPX esplorate da ranger esperti
- **Trip Builder con AI**: Costruisci itinerari personalizzati inserendo date, durata, budget e preferenze
- **Comunità di Ranger**: Condivisione di percorsi, foto e consigli per creare esperienze uniche
- **Prenotazione Alloggi**: Integrazione con servizi di prenotazione per un'esperienza completa

## Stack Tecnologico

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Supabase (PostgreSQL, API realtime, storage)
- **Autenticazione**: Clerk (email, Apple/Google login, ACL)
- **Mappe**: React Map GL (Mapbox)

## Installazione

```bash
# Clona il repository
git clone https://github.com/tuouser/ride-atlas.git
cd ride-atlas

# Installa le dipendenze
npm install

# Crea un file .env.local con le variabili d'ambiente necessarie
touch .env.local

# Avvia il server di sviluppo
npm run dev
```

## Variabili d'Ambiente

Crea un file `.env.local` nella root del progetto con le seguenti variabili:

```
# NextAuth.js (Autenticazione)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase (Database e Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database
DATABASE_URL=your-database-url

# Mapbox (Mappe)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

## Struttura del Progetto

```
/src
  /app             # Pagine e layout dell'applicazione Next.js
  /components      # Componenti React riutilizzabili
  /lib             # Librerie e configurazioni (Supabase, Clerk, ecc.)
  /types           # Definizioni TypeScript
  /utils           # Funzioni di utilità
/public            # File statici
/tests             # Test automatici
```

## Sviluppo

```bash
# Avvia il server di sviluppo
npm run dev

# Esegui i test
npm test

# Esegui i test in modalità watch
npm run test:watch

# Esegui il linter
npm run lint
```

## Licenza

Tutti i diritti riservati © 2023 RideAtlas