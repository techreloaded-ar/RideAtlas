# Configurazione Google OAuth per RideAtlas

Questa guida ti aiuterà a configurare l'autenticazione Google OAuth per l'applicazione RideAtlas.

## 1. Creare un Progetto Google Cloud

1. Vai alla [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona un progetto esistente
3. Assicurati che il progetto sia selezionato nel menu a tendina in alto

## 2. Attivare l'API Google+ 

1. Vai a "API e servizi" > "Libreria"
2. Cerca "Google+ API" e attivala
3. Cerca "Google Identity API" e attivala (se disponibile)

## 3. Configurare la schermata di consenso OAuth

1. Vai a "API e servizi" > "Schermata di consenso OAuth"
2. Seleziona "Esterno" come tipo di utente (a meno che tu non abbia un account Google Workspace)
3. Compila i campi obbligatori:
   - Nome dell'applicazione: "RideAtlas"
   - Email di supporto utente: la tua email
   - Domini autorizzati: il tuo dominio (se ne hai uno)
   - Email di contatto dello sviluppatore: la tua email
4. Aggiungi gli scope necessari (puoi lasciare quelli di default)
5. Salva e continua

## 4. Creare le credenziali OAuth

1. Vai a "API e servizi" > "Credenziali"
2. Clicca su "Crea credenziali" > "ID client OAuth 2.0"
3. Seleziona "Applicazione web" come tipo di applicazione
4. Aggiungi i seguenti URI di reindirizzamento autorizzati:
   - Per sviluppo: `http://localhost:3000/api/auth/callback/google`
   - Per produzione: `https://tuodominio.com/api/auth/callback/google`
5. Clicca "Crea"

## 5. Configurare le variabili d'ambiente

Copia l'ID client e il segreto client dalla schermata delle credenziali e aggiungili al tuo file `.env.local`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=un-segreto-molto-lungo-e-casuale-per-produzione
```

## 6. Generare NEXTAUTH_SECRET

Per generare una chiave segreta sicura, puoi usare:

```bash
openssl rand -base64 32
```

O visitare: https://generate-secret.vercel.app/32

## 7. Test dell'autenticazione

1. Avvia il server di sviluppo: `npm run dev`
2. Vai su `http://localhost:3000`
3. Clicca su "Accedi" e prova l'autenticazione con Google
4. Dovresti essere reindirizzato alla dashboard dopo l'accesso

## 8. Produzione

Per il deploy in produzione:

1. Aggiorna `NEXTAUTH_URL` con il tuo dominio di produzione
2. Aggiungi l'URI di callback di produzione nelle credenziali Google
3. Assicurati che tutte le variabili d'ambiente siano configurate correttamente
4. Considera di spostare il progetto Google Cloud in modalità "In produzione" nella schermata di consenso OAuth

## Troubleshooting

### Errore "redirect_uri_mismatch"
- Verifica che l'URI di reindirizzamento nelle credenziali Google corrisponda esattamente a quello usato dall'applicazione
- Il formato corretto è: `http://localhost:3000/api/auth/callback/google`

### Errore "invalid_client"
- Verifica che `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` siano corretti
- Assicurati che non ci siano spazi extra nelle variabili d'ambiente

### L'utente non viene creato nel database
- Verifica che la connessione al database funzioni
- Controlla i log del server per errori Prisma
- Assicurati che le migrazioni del database siano state applicate

## Link utili

- [Google Cloud Console](https://console.cloud.google.com/)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Documentazione OAuth 2.0 di Google](https://developers.google.com/identity/protocols/oauth2)
