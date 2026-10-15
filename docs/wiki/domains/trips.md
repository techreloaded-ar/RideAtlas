---
type: domain
title: "Viaggi e contenuti"
description: "Catalogo, ciclo editoriale, tappe, GPX, media e importazione ZIP degli itinerari."
status: generated
classification: candidate
sources:
  - path: "prisma/schema.prisma"
    role: evidence
  - path: "src/app/api/trips"
    role: evidence
  - path: "src/app/api/admin/trips"
    role: evidence
  - path: "src/app/trips"
    role: evidence
  - path: "src/components/trips"
    role: evidence
  - path: "src/components/stages"
    role: evidence
  - path: "src/lib/trips/tripValidationService.ts"
    role: evidence
  - path: "src/lib/trips/trip-utils.ts"
    role: evidence
  - path: "src/lib/auth/trip-access.ts"
    role: evidence
  - path: "src/lib/stages"
    role: evidence
  - path: "src/lib/batch"
    role: evidence
  - path: "src/lib/gpx"
    role: evidence
  - path: "src/app/api/gpx/preview/route.ts"
    role: evidence
  - path: "src/app/api/upload"
    role: evidence
  - path: "src/schemas/trip.ts"
    role: evidence
  - path: "src/schemas/batch-trip.ts"
    role: evidence
  - path: "src/types/trip.ts"
    role: evidence
  - path: "src/types/gpx.ts"
    role: evidence
  - path: "src/tests/unit/api/trips"
    role: evidence
  - path: "src/tests/unit/api/admin/trips"
    role: evidence
  - path: "src/tests/integration/trips"
    role: evidence
  - path: "src/tests/unit/lib/batch"
    role: evidence
  - path: "src/tests/unit/lib/gpx"
    role: evidence
issues:
  - code: TRIP_MODELED_STATES_UNREACHABLE
    summary: "Pronto_per_revisione e Archiviato esistono nello schema e nelle etichette, ma non hanno assegnazioni nei flussi applicativi ispezionati; publish e approve scrivono direttamente Pubblicato."
  - code: PREMIUM_DATA_SENT_BEFORE_GATE
    summary: "src/app/trips/[slug]/page.tsx passa tutte le tappe e URL GPX a TripDetailClient per viaggi pubblicati prima di qualsiasi acquisto; AccessGate è client e con showPreview renderizza anche i children sfocati. Il gate non prova riservatezza dei dati."
  - code: BATCH_CANCEL_WITHOUT_EFFECT
    summary: "DELETE src/app/api/trips/batch/status/[jobId]/route.ts dichiara arresto al prossimo checkpoint, ma non scrive stato o flag e BatchProcessor non implementa quel checkpoint di cancellazione."
---
# Viaggi e contenuti

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Organizza viaggi motociclistici creati da Ranger/Sentinel, consultabili da visitatori quando pubblicati. Tappe, GPX e batch sono parti della stessa capacità editoriale: Stage appartiene a Trip, GPX è metadata JSON collegato al contenuto, BatchJob coordina la creazione degli stessi Trip. Mappe e upload sono meccanismi tecnici condivisi, non contesti commerciali autonomi.

<!-- archetipo:wiki section=language -->

## Lessico

Viaggio: titolo, sommario, destinazione, tema, tag, caratteristiche, stagioni, slug e autore. Tappa: contenuto ordinato con descrizione, durata libera, media e GPX. Bozza e Pubblicato sono stati raggiunti nel codice; Pronto_per_revisione e Archiviato sono modelli dichiarati. GPX conserva URL, distanza in metri, punti e metadati; non equivale a certificazione stradale.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Possiede Trip, Stage e BatchJob: pubblicazione, validazione editoriale, ordine, assegnazione autore e prezzo del contenuto. [Acquisti](/domains/purchases.md) possiede pagamento e diritto. Stage ha chiave univoca (tripId, orderIndex) e cancellazione Cascade con Trip; slug Trip è univoco. BatchJob ha stato e risultati persistiti, ma l’esecuzione è nel processo web, con ZIP solo in memoria.

<!-- archetipo:wiki section=contracts -->

## Contratti

API trips GET/POST e [id] GET/PUT, publish PATCH, revert-to-draft PATCH, validate GET, stages CRUD; API admin/trips per lista, prezzo, eliminazione, approvazione, riordino e assegnazione. Schemi client src/schemas/trip.ts e parsing server locali non sono identici: il server può creare senza tappe, mentre il form principale ne richiede almeno una. Batch riceve multipart ZIP, template scaricabile e polling status. GPX: upload multipart, preview da URL e download viaggio autorizzato; DTO in src/types/trip.ts, src/types/gpx.ts e src/types/api/trips.ts.

<!-- archetipo:wiki section=flows -->

## Flussi e assegnazioni di stato

| Operazione | Guardia osservata | Assegnazione effettiva e fonte |
|---|---|---|
| Creazione manuale/batch | Ruolo Ranger/Sentinel alla richiesta; dati validati | Nessun status nel create: default Bozza in prisma/schema.prisma; src/app/api/trips/route.ts e src/lib/batch/BatchProcessor.ts |
| Pubblicazione | Proprietario o Sentinel; stato esattamente Bozza; validazione superata | Bozza → Pubblicato, data.status = TripStatus.Pubblicato in src/app/api/trips/[id]/publish/route.ts |
| Approvazione amministrativa | Sentinel; stato esattamente Bozza; stessa validazione | Bozza → Pubblicato, data.status = "Pubblicato" in src/app/api/admin/trips/[id]/approve/route.ts |
| Ritorno a bozza | Ranger proprietario o Sentinel; stato diverso da Bozza | Pubblicato → Bozza; più in generale qualsiasi non-Bozza → Bozza, data.status = "Bozza" in src/app/api/trips/[id]/revert-to-draft/route.ts |

Il PUT generale non include status nello schema e non scrive stati. Nessuna assegnazione runtime trovata a Pronto_per_revisione o Archiviato: sono irraggiungibili nei percorsi ispezionati, non tappe implicite della pubblicazione. DELETE amministrativo richiede Bozza e cancella record; non è una transizione ad Archiviato (src/app/api/admin/trips/[id]/route.ts).

BatchJob: startBatchJob crea PENDING (src/lib/batch/BatchProcessor.ts); processJobAsync scrive PROCESSING per ID senza guardia sullo stato precedente, poi processZipContent sceglie COMPLETED se createdTripIds.length > 0, FAILED altrimenti, e scrive finalStatus, ancora senza guardia sullo stato persistito. Nel percorso normale quindi PENDING → PROCESSING → COMPLETED/FAILED; gli error handler scrivono FAILED senza guardia, incluso il catch del timer. Un COMPLETED può contenere errori parziali. DELETE status non assegna alcuno stato e non ferma l’esecuzione.

Consultazione: pagina catalogo filtra Pubblicato, ordina orderIndex e creazione; ricerca client AND fra parole su titolo/destinazione/tag. Dettaglio applica checkTripAccess per stato e autore; passa però tutte le tappe al client prima del gate premium. La lista API trips ha logica per ruolo, ma il middleware protegge il prefisso api/trips e blocca anonimi/Explorer salvo eccezioni nominate: non è lo stesso contratto del catalogo pubblico server.

<!-- archetipo:wiki section=code -->

## Mappa fisica

UI: src/app/trips, create-trip, edit-trip, dashboard/trips/batch e componenti trips/stages/maps/upload. Entrate: src/app/api/trips, admin/trips, upload e gpx/preview. Logica: src/lib/trips, stages, batch e gpx; permessi di lettura non pubblicati in src/lib/auth/trip-access.ts. Integrazioni: storage e Leaflet; acquisti per diritto GPX. Le mappe esportano GPXMapViewer, SafeGPXMapViewer e alias UnifiedGPXMapViewer: altri nomi nel README locale sono documentazione precedente, non componenti esportati attuali.

<!-- archetipo:wiki section=invariants -->

## Regole e fallimenti

Pubblicazione richiede titolo e sommario non vuoti, almeno una tappa e, per ogni tappa, descrizione e riferimento gpxFile truthy (TripValidationService.validateForPublication). Non riparsa il GPX e non verifica isValid o percorribilità. Creazione e modifica verificano ruolo e proprietà/Sentinel negli handler; stages verifica associazione al Trip. L’endpoint GET validate richiede sessione, ma il controllo isOwnerOrSentinel contiene `|| true`: non verifica la proprietà del viaggio (src/app/api/trips/[id]/validate/route.ts); il middleware resta un filtro di ruolo, non di titolarità. Upload immagini server ammette JPEG/PNG/WebP, massimo 5 MB; upload GPX applica massimo 20 MB, parsing e tipo; batch massimo 100 MB. Limiti UI possono essere diversi. GPX preview controlla formato URL e contenuto ma non autentica né verifica il diritto sul viaggio. Eliminazione amministrativa tenta cleanup storage e prosegue anche se fallisce. Riordino rifiuta duplicati e ID mancanti e usa transazione. Nessuna promozione di un enum a regola editoriale.

<!-- archetipo:wiki section=verification -->

## Verifiche

Letti handler e test pubblicazione, approvazione, eliminazione, accesso dettaglio/modifica, riordino, tappe, GPX, template e parsing ZIP. I test unitari documentano comportamenti con dipendenze simulate; non sono stati eseguiti, né sono stati caricati file o interrogato il database. Verifiche operative in [sviluppo](/operations/development.md).

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
