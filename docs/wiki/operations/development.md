---
type: operations
title: "Sviluppo e operatività"
description: "Comandi locali, test, configurazione delle integrazioni e vincoli operativi osservati."
status: generated
sources:
  - path: "src/scripts"
    role: evidence
  - path: "src/tests"
    role: evidence
  - path: "src/lib/storage"
    role: evidence
  - path: "package.json"
    role: evidence
  - path: "package-lock.json"
    role: evidence
  - path: "jest.config.js"
    role: evidence
  - path: "next.config.js"
    role: evidence
  - path: "eslint.config.mjs"
    role: evidence
  - path: "tsconfig.json"
    role: evidence
  - path: ".env.example"
    role: evidence
  - path: "prisma/schema.prisma"
    role: evidence
---
# Sviluppo e operatività

## Esecuzione locale

Comandi dichiarati in package.json: `npm run dev` avvia Next; `npm run build` esegue prisma generate e next build; `npm start` avvia il build. PostgreSQL è configurato da DATABASE_URL. Il manifest usa Next 15; le indicazioni Next 14 nel README non prevalgono sul manifest. Non è stato rilevato un requisito engines nel manifest: la compatibilità Node effettiva va verificata sull’ambiente e sul lock.

`npm install` esegue postinstall con prisma generate e prisma db push; `npm run setup` include installazione e un ulteriore db push. `vercel-build` esegue anche db push prima del build. Questi comandi possono modificare il database configurato: sono documentati, non eseguiti dal bootstrap. `db:generate`, `db:push`, `db:studio`, `db:migrate` e `db:reset` esistono; la presenza di script migrazione non dimostra una cronologia migrazioni o un runbook di rilascio. Gli script in src/scripts includono create-sentinel e diagnostica Prisma/sistema.

## Configurazione e integrazioni

| Funzione | Variabili o file letti dal codice | Vincolo osservato |
|---|---|---|
| Identità | NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; src/auth.ts | Credenziali OAuth e cookie sicuro in produzione; JWT con ruolo |
| Dati | DATABASE_URL; prisma/schema.prisma | PostgreSQL e generazione Prisma client |
| Email | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM | Senza trasporto, simulazione solo development; nessuna consegna esterna provata |
| File | STORAGE_PROVIDER e BLOB_READ_WRITE_TOKEN oppure AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, endpoint e domini CloudFront | Default vercel-blob; config invalida ricade sul default; provider AWS valida configurazione/bucket |
| Pagamenti | STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET | Istanza server lazy, firma webhook; chiave pubblica richiesta nel modulo client |
| AI | OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXTAUTH_URL | Chiamata OpenRouter e fetch interno al catalogo con cookie |
| Cleanup token | CLEANUP_TOKEN | POST protetto da Bearer; GET statistiche solo development |

.env.example è un modello e non documenta tutte le opzioni presenti nel codice. Non sono stati letti o copiati valori di segreti. next.config.js attiva reactStrictMode e configura remotePatterns immagini; Tailwind/PostCSS ed ESLint sono configurazioni locali, non prove dell’ambiente distribuito.

## Verifiche applicative

`npm test`, `test:unit`, `test:integration`, `test:e2e` e `test:ci` invocano Jest. jest.config.js usa next/jest, jsdom, setup src/tests/setup/jest.setup.ts, alias @ e mock espliciti per auth e admin/users/route. Il nome e2e qui seleziona una directory Jest, non un runner browser. `npm run lint` esegue eslint src/. TypeScript ha strict/noEmit e alias @/*.

Il bootstrap ha letto test e configurazioni, senza eseguire suite, build, migrazioni o prove esterne. Per scegliere una verifica partire dalla pagina dominio e dai relativi percorsi/test, senza assumere equivalenza fra mock e integrazione reale.

## Vincoli operativi

BatchJob è persistito, ma il lavoro usa setTimeout nel processo Next e buffer ZIP in memoria: persistenza del record non garantisce ripresa dopo arresto dell’istanza. Un COMPLETED batch può includere errori. La cancellazione non ha effetto nel codice attuale. Webhook Stripe deduplica con un Set locale e può perdere la memoria al riavvio; il rate limit delle foto moto usa Map locale. Storage cleanup può fallire senza impedire cancellazione del viaggio. Non sono stati verificati deployment attivo, code di lavoro esterne, backup, ripristino o policy dei file.

Le differenze autorizzative e contabili sono descritte in [acquisti](/domains/purchases.md), le assegnazioni di stato e i contenuti inviati al client in [viaggi](/domains/trips.md). La [mappa del codice](/engineering/code-map.md) serve a trovare i test pertinenti.

## Manutenzione della Wiki

Percorso configurato docs/wiki/. Tutte le pagine create sono generated e senza review. La manutenzione automatica del workflow è attualmente disabilitata: `wiki.enabled: true` in .archetipo/config.yaml la abilita. La generazione su richiesta e la validazione restano disponibili. Il catalogo e il log sono gestiti esclusivamente dal CLI.
