---
type: domain
title: "Suggerimenti di viaggio"
description: "Chat AI ancorata al catalogo pubblicato, con vincoli geografici e di durata."
status: generated
classification: candidate
sources:
  - path: "src/app/api/trip-builder"
    role: evidence
  - path: "src/app/trip-builder/page.tsx"
    role: evidence
  - path: "src/components/trip-builder"
    role: evidence
  - path: "src/lib/trip-builder/promptService.ts"
    role: evidence
  - path: "src/lib/trips/tripAnalysisService.ts"
    role: evidence
  - path: "src/lib/validation"
    role: evidence
  - path: "src/lib/geo"
    role: evidence
  - path: "src/tests/unit/lib/geo/geoUtils.test.ts"
    role: evidence
  - path: "src/tests/unit/lib/trips/tripAnalysisService.test.ts"
    role: evidence
  - path: "src/tests/integration/tripBuilder.test.ts"
    role: evidence
issues:
  - code: AI_UI_API_ROLE_MISMATCH
    summary: "src/app/trip-builder/page.tsx ammette solo Sentinel; chat e trips API in src/app/api/trip-builder controllano soltanto autenticazione e sono fuori dai prefissi Ranger/Sentinel del middleware."
---
# Suggerimenti di viaggio

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Aiuta a scoprire itinerari già presenti. Non crea Trip, Stage o GPX. trip-builder è la capacità; geo è supporto tramite coordinate e regioni locali, non servizio geografico autonomo. Le classi di validazione sono infrastruttura/algoritmi: conta quella invocata dalla chat, ValidationService.

<!-- archetipo:wiki section=language -->

## Lessico

Richiesta, conversazione, vincoli maxDays/region/location/maxRadiusKm, viaggi validi, titoli menzionati, distanza e avvisi. La durata è un vincolo sulla selezione; coordinate approssimate e distanza geometrica non equivalgono a routing stradale.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Possiede selezione, costruzione del prompt ed estrazione delle raccomandazioni; nessun modello Prisma proprio. La UI mantiene messaggi, il server usa le ultime 10 voci ricevute come cronologia. Legge il catalogo pubblicato senza modificarlo; geografia è un dataset statico in src/lib/geo/locationData.ts.

<!-- archetipo:wiki section=contracts -->

## Contratti

POST api/trip-builder/chat riceve message e conversationHistory, richiede un ID sessione; restituisce message, tripRecommendations e distanceWarnings. GET api/trip-builder/trips richiede sessione e seleziona solo Pubblicato, con metadati GPX legacy validi. OpenRouter è chiamato via HTTP con OPENROUTER_API_KEY e modello da OPENROUTER_MODEL o default nel codice.

<!-- archetipo:wiki section=flows -->

## Flusso osservato

src/app/api/trip-builder/chat/route.ts: autenticazione e messaggio stringa → estrazione vincoli → fetch interno al catalogo propagando cookie → ValidationService.validateTrips → PromptService.buildSystemPrompt → chiamata OpenRouter → estrazione dei viaggi il cui titolo compare nella risposta. La stessa route calcola avvisi separatamente con TripAnalysisService.analyzeTrips(validTrips, message); tale ranking non coincide necessariamente con le menzioni del modello. Nessuna macchina di stati persistita.

ValidationService filtra geografia e seleziona viaggi finché la somma di duration_days entra in maxDays. Le classi ConstraintValidationService e DurationValidationService esistono, ma non sono chiamate dalla route chat letta: non attribuire automaticamente le loro regole al percorso attuale. Gli avvisi di trasferimento usano coordinate approssimate del dataset.

<!-- archetipo:wiki section=code -->

## Mappa fisica

UI src/app/trip-builder/page.tsx e componenti TripBuilderChat/SuggestedPrompts; handler src/app/api/trip-builder; prompt src/lib/trip-builder/promptService.ts; vincoli src/lib/validation/validationService.ts; scoring in src/lib/trips/tripAnalysisService.ts; distanze src/lib/geo. Configurazione in process.env letta dagli handler; .env.example non documenta tutte le variabili AI.

<!-- archetipo:wiki section=invariants -->

## Regole e limiti

Query catalogo filtra Pubblicato; handler richiede session.user.id e message stringa non vuota. Il prompt chiede risposte ancorate ai viaggi, ma non è un controllo eseguibile sulla veridicità di tutta la prosa. L’estrazione per sottostringa del titolo non è un parser di ID. La validazione delle distanze ignote non prova un raggio effettivo. UI riservata Sentinel, API non verifica quel ruolo: differenza concreta da risolvere.

<!-- archetipo:wiki section=verification -->

## Verifiche

Esaminati algoritmi e test geoUtils/tripAnalysisService; src/tests/integration/tripBuilder.test.ts contiene casi segnaposto, quindi non attesta il percorso AI completo. Nessuna richiesta a OpenRouter o valutazione delle risposte eseguita.

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
