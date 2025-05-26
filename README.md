# 🏍️ RideAtlas

Piattaforma web per appassionati di viaggi in moto che offre la creazione di itinerari personalizzati con un sistema di autenticazione moderno e interfaccia intuitiva.

## 🌟 Caratteristiche Principali

- **Creazione Itinerari**: Sistema di creazione viaggi con form avanzato
- **Autenticazione Google**: Login sicuro tramite NextAuth.js v5
- **Dashboard Personalizzata**: Area utente con gestione profilo
- **Sistema di Tag**: Organizzazione viaggi per categorie e caratteristiche
- **Design Responsive**: Interfaccia ottimizzata per desktop e mobile
- **Database Robusto**: Persistenza dati con PostgreSQL e Prisma

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Autenticazione**: NextAuth.js v5 con Google OAuth
- **Styling**: TailwindCSS
- **Testing**: Jest, React Testing Library
- **TypeScript**: Tipizzazione completa

## 📥 Installazione Completa

### 1. Prerequisiti

Assicurati di avere installato:
- **Node.js** (versione 18 o superiore)
- **npm** o **yarn**
- **Git**
- **PostgreSQL** (locale o remoto)

### 2. Clonazione Repository

```bash
# Clona il repository
git clone https://github.com/tuouser/ride-atlas.git
cd RideAtlas

# Installa le dipendenze
npm install
```

### 3. Configurazione Database PostgreSQL

#### Opzione A: Database Locale
```bash
# Installa PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Crea database
createdb rideatlas_dev
```

#### Opzione B: Database Remoto (Consigliato)
Usa un servizio come:
- **Neon** (https://neon.tech) - Gratuito
- **Supabase** (https://supabase.com) - Gratuito
- **Railway** (https://railway.app) - Gratuito
- **Heroku Postgres** - A pagamento

### 4. Configurazione Google OAuth

#### Passo 1: Google Cloud Console
1. Vai a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita **Google+ API** e **Google OAuth2 API**

#### Passo 2: Credenziali OAuth
1. Vai su **APIs & Services** > **Credentials**
2. Clicca **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Seleziona **Web application**
4. Aggiungi questi URL:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (per produzione)

#### Passo 3: Ottieni le Credenziali
- Copia **Client ID** e **Client Secret**

### 5. Configurazione Variabili d'Ambiente

Crea il file `.env.local` nella root del progetto:

```bash
# Crea i file di configurazione
touch .env.local
touch .env
```

Aggiungi le seguenti variabili a `.env.local`:

```env
# =================================
# NEXTAUTH.JS CONFIGURATION
# =================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# =================================
# GOOGLE OAUTH CREDENTIALS
# =================================
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret-here

# =================================
# DATABASE CONFIGURATION
# =================================
# Formato: postgresql://username:password@host:port/database_name
DATABASE_URL=postgresql://username:password@localhost:5432/rideatlas_dev

# Esempio database remoto (Neon):
# DATABASE_URL=postgresql://username:password@ep-cool-math-123456.us-east-1.aws.neon.tech/neondb

# =================================
# DEVELOPMENT SETTINGS
# =================================
NODE_ENV=development
```

### 6. Configurazione Database

```bash
# Genera il client Prisma
npx prisma generate

# Sincronizza lo schema con il database
npx prisma db push

# (Opzionale) Visualizza il database
npx prisma studio
```

### 7. Test della Configurazione

```bash
# Test delle connessioni
npm run test

# Avvia il server di sviluppo
npm run dev
```

Visita `http://localhost:3000` per verificare che tutto funzioni.

## 🔑 Configurazione Chiavi Dettagliata

### NextAuth Secret
```bash
# Genera una chiave sicura (32+ caratteri)
openssl rand -base64 32
# Esempio output: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Google OAuth Setup Completo

1. **Crea Progetto Google Cloud**:
   ```
   Nome Progetto: RideAtlas
   Organization: (La tua organizzazione)
   ```

2. **Configura OAuth Consent Screen**:
   ```
   User Type: External
   App Name: RideAtlas
   User Support Email: tua-email@example.com
   Developer Contact: tua-email@example.com
   ```

3. **Scopes Necessari**:
   ```
   email
   profile
   openid
   ```

4. **Domini Autorizzati**:
   ```
   Development: localhost
   Production: yourdomain.com
   ```

### Database URLs Esempio

```env
# PostgreSQL Locale
DATABASE_URL=postgresql://postgres:password@localhost:5432/rideatlas

# Neon (Serverless)
DATABASE_URL=postgresql://username:password@ep-cool-math-123456.us-east-1.aws.neon.tech/neondb

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.abcdefghijklmnopqrst.supabase.co:5432/postgres

# Railway
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

## 🚀 Comandi di Sviluppo

```bash
# Sviluppo
npm run dev              # Avvia server sviluppo (localhost:3000)
npm run build           # Build produzione
npm run start           # Avvia server produzione

# Database
npx prisma generate     # Genera client Prisma
npx prisma db push      # Sincronizza schema
npx prisma studio       # Interface grafica database
npx prisma migrate dev  # Crea migration

# Testing
npm test                # Esegui test
npm run test:watch      # Test in modalità watch
npm run lint            # Controllo codice

# Debug
npm run dev -- --inspect  # Debug mode
```

## 📁 Struttura del Progetto

```
RideAtlas/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── layout.tsx          # Layout principale
│   │   ├── page.tsx           # Homepage
│   │   ├── 📁 api/            # API Routes
│   │   │   ├── 📁 auth/       # NextAuth.js endpoints
│   │   │   └── 📁 trips/      # API viaggi
│   │   ├── 📁 auth/           # Pagine autenticazione
│   │   ├── 📁 create-trip/    # Creazione viaggi
│   │   └── 📁 dashboard/      # Dashboard utente
│   ├── 📁 components/         # Componenti React
│   ├── 📁 lib/               # Utilities e configurazioni
│   └── 📁 types/             # Tipi TypeScript
├── 📁 prisma/
│   └── schema.prisma         # Schema database
├── 📁 public/               # File statici
├── 📁 tests/                # Test automatici
├── .env.local              # Variabili ambiente (locale)
├── next.config.js          # Configurazione Next.js
└── package.json           # Dipendenze e script
```

## 🔧 Risoluzione Problemi

### Error: "NEXTAUTH_SECRET is not set"
```bash
# Aggiungi a .env.local
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Error: "Google OAuth CSRF token missing"
1. Verifica che `NEXTAUTH_URL` sia impostato correttamente
2. Controlla che i redirect URI in Google Console siano corretti
3. Cancella i cookie del browser e riprova

### Error: "Database connection failed"
1. Verifica che `DATABASE_URL` sia corretto
2. Controlla che il database sia avviato e accessibile
3. Esegui `npx prisma db push` per sincronizzare lo schema

### Error: "Can't resolve next-auth"
```bash
# Reinstalla NextAuth.js
npm uninstall next-auth
npm install next-auth@5.0.0-beta.20
```

## 🌐 Deploy in Produzione

### Vercel (Raccomandato)
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura variabili ambiente su Vercel Dashboard:
# - NEXTAUTH_URL=https://your-app.vercel.app
# - NEXTAUTH_SECRET=your-production-secret
# - GOOGLE_CLIENT_ID=your-client-id
# - GOOGLE_CLIENT_SECRET=your-client-secret
# - DATABASE_URL=your-production-database-url
```

### Altre Piattaforme
- **Netlify**: Supporta Next.js con plugin
- **Railway**: Deploy automatico da GitHub
- **DigitalOcean App Platform**: Configurazione semplice

## 📝 Note Importanti

### Sicurezza
- **Mai committare** `.env.local` nel repository
- Usa **NEXTAUTH_SECRET** diversi per sviluppo e produzione
- Configura **CORS** correttamente per i domini di produzione

### Performance
- Le immagini Google vengono ottimizzate automaticamente
- Il middleware usa **Edge Runtime** per prestazioni ottimali
- Database queries sono ottimizzate con Prisma

### Sviluppo
- Usa `npm run dev` per hot reload
- I test girano automaticamente su file changes
- Prisma Studio è disponibile su `localhost:5555`

## 📞 Supporto

Per problemi tecnici:
1. Controlla la [documentazione NextAuth.js](https://next-auth.js.org)
2. Verifica la [documentazione Prisma](https://prisma.io/docs)
3. Consulta i file di documentazione nella repo:
   - `NEXTAUTH_MIGRATION_COMPLETE.md`
   - `GOOGLE_OAUTH_SETUP.md` 
   - `NEXTAUTH_TESTING_GUIDE.md`

## 📄 Licenza

Tutti i diritti riservati © 2025 RideAtlas