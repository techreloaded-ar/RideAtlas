# Migrazione da Supabase a Prisma ORM

## Modifiche Effettuate

### 1. Installazione di Prisma
- Aggiunto `prisma` e `@prisma/client` alle dipendenze
- Rimosso `@supabase/supabase-js`

### 2. Configurazione Database
- Creato `prisma/schema.prisma` con lo schema del database
- Configurato PostgreSQL come database provider
- Definiti modelli per `Profile` e `Trip` con enum per `TripStatus` e `RecommendedSeason`

### 3. Client Prisma
- Creato `src/lib/prisma.ts` per la gestione del client Prisma
- Implementato pattern singleton per evitare multiple connessioni in sviluppo

### 4. Aggiornamento Tipi
- Modificato `src/types/trip.ts` per usare i tipi generati da Prisma
- Creato `src/types/profile.ts` per i tipi del profilo utente
- Mantenuti i file Supabase come backup (.backup)

### 5. API Route
- Aggiornato `src/app/api/trips/route.ts` per usare Prisma invece di Supabase
- Rimossa la gestione del token Supabase
- Implementata gestione errori Prisma (codice P2002 per duplicati)

### 6. Form Component
- Aggiornato `src/components/CreateTripForm.tsx` per usare gli enum Prisma
- Corretti i valori delle opzioni nel select della stagione

### 7. Script npm
Aggiunti nuovi script per Prisma:
- `npm run db:push` - Sincronizza schema con database
- `npm run db:generate` - Genera client Prisma
- `npm run db:studio` - Apre Prisma Studio
- `npm run db:migrate` - Crea e applica migrazioni
- `npm run db:reset` - Reset database

## Database Schema

### Tabella `profiles`
- `id` - Identificatore unico (CUID)
- `user_id` - ID utente di Clerk (unico)
- `full_name` - Nome completo
- `avatar_url` - URL avatar (opzionale)
- `role` - Ruolo utente (default: "user")
- `bio` - Biografia (opzionale)
- `created_at`, `updated_at` - Timestamp automatici

### Tabella `trips`
- `id` - Identificatore unico (CUID)
- `title` - Titolo del viaggio
- `summary` - Sommario descrittivo
- `destination` - Destinazione
- `duration_days`, `duration_nights` - Durata in giorni e notti
- `tags` - Array di tag
- `theme` - Tema del viaggio
- `recommended_season` - Stagione raccomandata (enum)
- `slug` - Slug unico per URL
- `status` - Status del viaggio (enum, default: "Bozza")
- `user_id` - Collegamento al profilo utente
- `created_at`, `updated_at` - Timestamp automatici

## Comandi Utili

```bash
# Generare il client Prisma dopo modifiche allo schema
npm run db:generate

# Sincronizzare lo schema con il database (development)
npm run db:push

# Creare una migrazione (production)
npm run db:migrate

# Aprire Prisma Studio per visualizzare dati
npm run db:studio

# Reset completo del database
npm run db:reset
```

## Vantaggi della Migrazione

1. **Type Safety**: Tipi TypeScript generati automaticamente
2. **Relazioni**: Gestione nativa delle relazioni tra tabelle
3. **Migrazioni**: Sistema di migrazioni integrato
4. **Prestazioni**: Query ottimizzate e connection pooling
5. **Sviluppo**: Prisma Studio per debug visuale
6. **Flessibilità**: Non legato a un provider specifico

## File Backup
- `src/lib/supabase.ts.backup` - Client Supabase originale
- `src/types/supabase.ts.backup` - Tipi Supabase originali

Questi file possono essere rimossi una volta confermato che tutto funziona correttamente.
