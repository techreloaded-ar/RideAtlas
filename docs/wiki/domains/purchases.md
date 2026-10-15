---
type: domain
title: "Acquisti e accesso premium"
description: "Pagamenti per viaggio, storico delle transazioni, omaggi, rimborsi locali e controllo del diritto."
status: generated
classification: candidate
sources:
  - path: "src/lib/payment"
    role: evidence
  - path: "src/app/api/payments"
    role: evidence
  - path: "src/app/api/webhooks/stripe/route.ts"
    role: evidence
  - path: "src/app/api/admin/purchases"
    role: evidence
  - path: "src/app/api/trips/[id]/purchase/route.ts"
    role: evidence
  - path: "src/app/api/trips/[id]/access/route.ts"
    role: evidence
  - path: "src/app/api/trips/[id]/gpx/route.ts"
    role: evidence
  - path: "src/app/purchase"
    role: evidence
  - path: "src/components/payment"
    role: evidence
  - path: "prisma/schema.prisma"
    role: evidence
  - path: "src/tests/unit/lib/payment"
    role: evidence
  - path: "src/tests/unit/api/admin/purchases/refund.test.ts"
    role: evidence
issues:
  - code: PAYMENT_AUTHORIZATION_GAPS
    summary: "payments/mock richiede solo sessione e accetta purchaseId senza titolarità o vincolo NODE_ENV; confirm-payment confronta metadata.purchaseId ma non purchase.userId o importo. Questi percorsi non supportano la garanzia uniforme di autorizzazione dell’acquirente."
  - code: ENTITLEMENT_READ_DIVERGENCE
    summary: "PurchaseService.hasPurchasedTrip cerca qualsiasi COMPLETED; getTripWithPurchaseInfo considera solo l’ultimo acquisto. Il gate access e il download possono dare diritti diversi se un record successivo non è COMPLETED."
---
# Acquisti e accesso premium

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Consente all’acquirente autenticato di ottenere il diritto sui contenuti di un viaggio; Sentinel consulta, regala e rimborsa amministrativamente. payment e purchase sono uniti perché Stripe/mock sono mezzi del medesimo ciclo di TripPurchase, senza proprietà di dominio separata.

<!-- archetipo:wiki section=language -->

## Lessico

Acquisto è TripPurchase; tentativo/storico è TripPurchaseTransaction. PENDING attende esito; COMPLETED concede diritto; FAILED e REFUNDED non sono un completamento. Omaggio admin_gift e gratuità free creano diritti a importo zero. Il rimborso admin_refund registra uno stato locale e non invoca un rimborso monetario Stripe.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Possiede acquisti e transazioni, importo fissato alla creazione, esiti e letture del diritto. Legge autore, prezzo e stato da Trip. Non esiste vincolo univoco (userId, tripId): lo schema ammette riacquisti dopo rimborso; il servizio controlla un COMPLETED esistente prima di creare, senza unicità che renda quel controllo una garanzia concorrente.

<!-- archetipo:wiki section=contracts -->

## Contratti

POST trips/[id]/purchase crea o riusa; GET ritorna informazioni. POST payments/stripe/create-payment-intent e confirm-payment collegano Stripe; POST payments/mock simula esito. POST webhooks/stripe verifica firma e gestisce successo, fallimento e cancellazione Stripe. API user/purchases, admin/purchases e PATCH admin/purchases/[id] espongono lista, omaggio e rimborso. GET trips/[id]/access applica owner || hasPurchased || Sentinel; download gpx usa canAccessPremiumContent più Sentinel.

<!-- archetipo:wiki section=flows -->

## Scritture e guardie effettive

Tutte le scritture di acquisto seguenti sono in src/lib/payment/purchaseService.ts.

| Metodo | Guardia | Assegnazione |
|---|---|---|
| createPurchase | Utente e viaggio esistenti, non proprietario, viaggio Pubblicato, nessun COMPLETED attivo | Se prezzo <= 0 crea COMPLETED con purchasedAt; altrimenti riusa PENDING esistente o crea PENDING |
| completePurchase | Acquisto esistente; rifiuta solo stato già COMPLETED | PENDING/FAILED/REFUNDED → COMPLETED; scrive anche pagamento e purchasedAt, con transazione storica |
| failPurchase | Acquisto esistente, senza guardia sullo stato precedente | Qualsiasi stato → FAILED, anche COMPLETED/REFUNDED, con transazione storica |
| refundPurchase | Stato esattamente COMPLETED | COMPLETED → REFUNDED, con storico admin_refund e motivo |
| giftTrip | Trip Pubblicato, destinatario non proprietario, nessun COMPLETED attivo | Crea nuovo COMPLETED con importo zero e storico admin_gift |

Le operazioni di completamento/fallimento/rimborso scrivono aggiornamento e storico in transazione. Creazione ordinaria, omaggio e storico della gratuità non sono tutti nello stesso blocco atomico. Non si assume una macchina PENDING → COMPLETED/FAILED con soli archi ideali: i metodi consentono le guardie più deboli sopra.

StripeService crea PaymentIntent dai dati server e metadata; create-payment-intent verifica purchase.userId === session.user.id. confirm-payment verifica succeeded e metadata.purchaseId, poi completePurchase. Webhook firma il corpo e usa i metadata; deduplicazione Set locale, massimo 1000 eventi, nessuna memoria distribuita. Canceled Stripe chiama failPurchase: il target locale è FAILED, non uno stato cancellato.

<!-- archetipo:wiki section=code -->

## Mappa fisica

UI in src/app/purchase/[tripId], PurchasePageClient e StripePaymentForm; servizi in src/lib/payment/purchaseService.ts e stripeService.ts; configurazione lazy server/client in stripe-server.ts e stripe-client.ts. Dati in prisma/schema.prisma; accesso client in hooks/trips/useTripAccess e AccessGate. [Viaggi](/domains/trips.md) trasmette contenuti ed espone download.

<!-- archetipo:wiki section=invariants -->

## Regole e limiti

Il prezzo del client non fissa l’importo di createPurchase. Il proprio viaggio e un non pubblicato non sono acquistabili tramite createPurchase. Un acquisto PENDING non basta per l’accesso. hasPurchasedTrip cerca qualsiasi COMPLETED, mentre getTripWithPurchaseInfo considera solo il record più recente: i due contratti possono divergere. La verifica premium del servizio non controlla lo stato Trip; la pagina dettaglio verifica separatamente la pubblicazione. Lo storage restituisce URL e il download autorizzato redirige: non prova un vincolo sui successivi accessi diretti al file. Nessuna liquidazione agli autori osservata.

<!-- archetipo:wiki section=verification -->

## Verifiche

Letti test purchaseService, purchaseService-admin e refund API con Prisma/Stripe simulati; nessun addebito, rimborso finanziario o chiamata a provider eseguito. Non si deduce affidabilità distribuita dal solo Set di eventi o dal successo di un metodo.

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
