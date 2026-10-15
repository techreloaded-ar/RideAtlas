---
type: code-map
title: "Mappa del codice"
description: "Corrispondenza fisica fra capacità, percorsi applicativi e copertura dell’ispezione."
status: generated
sources:
  - path: "src"
    role: evidence
  - path: "prisma"
    role: evidence
  - path: "package.json"
    role: evidence
  - path: "jest.config.js"
    role: evidence
  - path: "next.config.js"
    role: evidence
  - path: "src/lib/storage"
    role: evidence
  - path: "src/components/maps"
    role: evidence
coverage:
  - {"kind": "boundary", "path": ".", "status": "mapped", "pages": ["engineering/code-map"]}
  - {"kind": "boundary", "path": "src", "status": "mapped", "pages": ["engineering/code-map"]}
  - {"kind": "capability", "path": "auth", "status": "mapped", "pages": ["domains/accounts"]}
  - {"kind": "capability", "path": "batch", "status": "mapped", "pages": ["domains/trips"]}
  - {"kind": "capability", "path": "contact", "status": "mapped", "pages": ["domains/contact"]}
  - {"kind": "capability", "path": "contatti", "status": "mapped", "pages": ["domains/contact"]}
  - {"kind": "capability", "path": "geo", "status": "mapped", "pages": ["domains/recommendations"]}
  - {"kind": "capability", "path": "gpx", "status": "mapped", "pages": ["domains/trips"]}
  - {"kind": "capability", "path": "maps", "status": "partial", "note": "Mappe Leaflet condivise, senza lifecycle di dominio autonomo; collegate alla fruizione GPX dei viaggi."}
  - {"kind": "capability", "path": "payment", "status": "mapped", "pages": ["domains/purchases"]}
  - {"kind": "capability", "path": "profile", "status": "mapped", "pages": ["domains/accounts"]}
  - {"kind": "capability", "path": "purchase", "status": "mapped", "pages": ["domains/purchases"]}
  - {"kind": "capability", "path": "ranger", "status": "mapped", "pages": ["domains/accounts"]}
  - {"kind": "capability", "path": "social-link", "status": "mapped", "pages": ["domains/accounts"]}
  - {"kind": "capability", "path": "stage", "status": "mapped", "pages": ["domains/trips"]}
  - {"kind": "capability", "path": "storage", "status": "partial", "note": "Factory e provider di infrastruttura per viaggi e profili."}
  - {"kind": "capability", "path": "trip", "status": "mapped", "pages": ["domains/trips"]}
  - {"kind": "capability", "path": "trip-builder", "status": "mapped", "pages": ["domains/recommendations"]}
  - {"kind": "capability", "path": "upload", "status": "partial", "note": "Meccanismo file condiviso da viaggi, tappe e profilo."}
  - {"kind": "capability", "path": "user", "status": "mapped", "pages": ["domains/accounts"]}
  - {"kind": "capability", "path": "validation", "status": "partial", "note": "Cluster eterogeneo: algoritmi AI, validazione username e social; nessuna ownership di dominio unitaria."}
---
# Mappa del codice

<!-- archetipo:wiki section=domain-code -->

## Dai domini al codice

| Capacità | UI (entrate rappresentative) | API | Logica (rappresentativa) | Dati posseduti | Integrazioni | Test (rappresentativi) |
|---|---|---|---|---|---|---|
| [accounts](/domains/accounts.md) | `src/app/admin/users/[id]/page.tsx`; `src/app/auth/auth-error/page.tsx` | `src/app/api/admin/rangers/route.ts`; `src/app/api/admin/users/[id]/route.ts` | `src/app/ranger/[username]/not-found.tsx`; `src/auth.ts` | User Account Session VerificationToken EmailVerificationToken PasswordResetToken EmailChangeToken | Prisma, SMTP, Google, storage | `src/tests/integration/api/profile/README.md`; `src/tests/integration/api/profile/USAGE_EXAMPLES.md` |
| [trips](/domains/trips.md) | `src/app/dashboard/trips/batch/page.tsx`; `src/app/trips/[slug]/page.tsx` | `src/app/api/admin/trips/[id]/approve/route.ts`; `src/app/api/admin/trips/[id]/assign/route.ts` | `src/app/trips/TripsPageClient.tsx`; `src/hooks/stages/useStageEditor.ts` | Trip Stage BatchJob | Identità, acquisti, storage, Leaflet | `src/tests/integration/api/admin/trips/reorder.test.ts`; `src/tests/integration/trips/edit-trip-access.test.ts` |
| [purchases](/domains/purchases.md) | `src/app/purchase/[tripId]/page.tsx`; `src/components/payment/PurchasePageClient.tsx` | `src/app/api/admin/purchases/[id]/route.ts`; `src/app/api/admin/purchases/route.ts` | `src/lib/payment/purchaseService.ts`; `src/lib/payment/stripe-client.ts` | TripPurchase TripPurchaseTransaction | Identità, prezzo e pubblicazione Trip, Stripe | `src/tests/unit/api/admin/purchases/refund.test.ts`; `src/tests/unit/lib/payment/purchaseService-admin.test.ts` |
| [recommendations](/domains/recommendations.md) | `src/app/trip-builder/page.tsx`; `src/components/trip-builder/SuggestedPrompts.tsx` | `src/app/api/trip-builder/chat/route.ts`; `src/app/api/trip-builder/trips/route.ts` | `src/lib/geo/geoUtils.ts`; `src/lib/geo/locationData.ts` | Nessun modello persistito proprio; conversazione nel client | Catalogo viaggi, auth, OpenRouter, tabelle geo locali | `src/tests/unit/lib/geo/geoUtils.test.ts` |
| [contact](/domains/contact.md) | `src/app/contatti/page.tsx` | `src/app/api/contact/route.ts` | `src/app/contatti/layout.tsx` | Nessuna tabella ticket | Nodemailer SMTP | `src/tests/unit/api/contact/route.test.ts` |
| [consents](/domains/consents.md) | Vedere pagina dominio | Vedere pagina dominio | Vedere pagina dominio | Cookie rideatlas-consents; singleton client | document.cookie e UI media | Vedere pagina dominio |

Le fonti di ogni pagina dominio completano queste entrate di navigazione. `consents` è emerso dalla lettura aggiuntiva: UI in src/app/cookie-settings e src/components/ui, servizio src/lib/ui/cookie-consent.ts, test cookie-consent e UnifiedMediaGallery.gdpr. Nessuna tabella Prisma propria.

<!-- archetipo:wiki section=shared -->

## Codice condiviso

| Area fisica | Interpretazione |
|---|---|
| src/auth.ts, src/middleware.ts | Sessioni e filtri di route; leggere anche guardie dei singoli handler |
| src/lib/core | Prisma e email condivisi |
| src/lib/storage | Interfaccia IFileStorageProvider, StorageFactory, Vercel Blob, AWS S3/CloudFront, configurazione e sanitizzazione |
| src/app/api/upload, src/hooks/upload, src/components/upload | Upload immagini/GPX e riferimenti video, condivisi con profili |
| src/components/maps, src/hooks/maps | Leaflet, rendering GPX, visibilità livelli e cleanup istanza |
| src/lib/validation, src/lib/geo | Algoritmi AI e geografia statica; non dedurre che ogni classe sia nel flusso chat |
| src/lib/social-links, src/lib/utils | Sanitizzazione/validazione e utility con consumatori distinti |
| src/lib/ui, src/components/ui, src/hooks/ui | Consenso, avatar, ID temporanei, controlli e rendering condivisi |
| src/constants, src/types, src/schemas | Configurazione applicativa, contratti e parsing; tipi da soli non applicano invarianti |
| prisma/schema.prisma | Persistenza comune PostgreSQL |
| src/tests | Test unitari/integrati con mock e casi e2e Jest; non prova browser automatica |

<!-- archetipo:wiki section=unmapped -->

## Aree parziali ed escluse

Le componenti generiche di layout, stili, pagine informative/legali e script diagnostici/amministrativi sono mappate per funzione e percorso, senza analisi esaustiva di ogni ramo. Radice `.`: package.json, next-env.d.ts, eslint.config.mjs, jest.config.js, jest.setup.js, next.config.js, postcss.config.js, tailwind.config.js; ulteriori configurazioni tsconfig.json/tasks.json e modello .env.example letti per contratto. package-lock.json è lock delle dipendenze, tsconfig.tsbuildinfo cache TypeScript: non costituiscono comportamento di dominio.

Nessuna ispezione dei segreti o ambiente remoto. Inventario CLI esclude metadati repository, build/dipendenze e Wiki; segnala src come campione rappresentativo. README tecnici e helper di test sono contesto di navigazione, non garanzie applicative. Il campionamento privilegia guardie, scritture, query, chiamate, collegamenti UI e asserzioni; non è una code review completa di tutti i file.

<!-- archetipo:wiki section=coverage -->

## Copertura deterministica e riconciliazione

Il frontmatter registra ogni boundary e candidato di wiki inspect, senza omissioni.

| Candidati originali | Destinazione e motivazione |
|---|---|
| auth, profile, user, ranger, social-link | Account: User comune, credenziali e proiezioni senza lifecycle separato |
| trip, stage, batch, gpx | Viaggi: Stage figlio e BatchJob orchestratore della creazione Trip; GPX risorsa del contenuto |
| payment, purchase | Acquisti: mezzi di pagamento sullo stesso acquisto/diritto |
| trip-builder, geo | Suggerimenti: geografia locale supporta selezione e avvisi |
| contact, contatti | Contatti: API e UI dello stesso inoltro |
| maps, storage, upload, validation | partial: infrastruttura e utility condivise, con motivazione esplicita nel frontmatter |

La copertura mapped è una mappa di navigazione, non affermazione di collaudo esaustivo. [Panoramica](/overview.md) e [contesti](/architecture/context-map.md) ne precisano scopo e limiti.
