# RideAtlas — Documento dei requisiti di prodotto (PRD)

**Autore:** ARchetipo  
**Data:** 10 marzo 2025  
**Versione:** 1.0  
**Tipo:** PRD retrospettivo del prodotto esistente, con evoluzioni separate  
**Riferimento del codice:** commit `5d708c6`, versione applicativa `0.1.0-dev`  
**Stato del documento:** ricostruito da evidenze locali; ipotesi commerciali e decisioni aperte da validare

---

## Presentazione sintetica

<!-- archetipo:prd section=elevator_pitch required=true -->

> RideAtlas aiuta i motoviaggiatori a trovare itinerari raccontati da altri motociclisti, valutarne tappe e caratteristiche, acquistare i contenuti di dettaglio e scaricare le tracce GPX. I Ranger preparano i viaggi; i Sentinel amministrano contenuti, utenti e acquisti. Un assistente AI facilita la scoperta dei viaggi pubblicati.
>
> Per i **motoviaggiatori, con attenzione al segmento over 50 poco incline alla pianificazione tecnica**, che hanno il problema di **trasformare informazioni sparse e tracce GPS in un viaggio comprensibile e utilizzabile**, **RideAtlas** è una **piattaforma web di itinerari motociclistici** che **riunisce scoperta, contenuti per tappa e accesso alle tracce**. Rispetto alla **ricerca manuale tra racconti, social e raccolte di GPX**, il prodotto collega il viaggio al suo autore e offre un percorso unico dalla consultazione all'acquisto.

---

## Visione

<!-- archetipo:prd section=vision required=true -->

Ridurre lo sforzo necessario per organizzare un viaggio in moto, rendendo riutilizzabile l'esperienza dei Ranger attraverso itinerari strutturati, descrizioni, media e GPX. La promessa storica «Noi lo facciamo per te. Tu guidi l'avventura» orienta la semplicità d'uso; certificazione dei percorsi, prenotazioni e itinerari generati su misura restano ambizioni da distinguere dalle capacità attuali.

### Elemento distintivo del prodotto

L'unità di valore è il viaggio completo, attribuito a un Ranger e articolato in tappe, con informazioni pratiche e tracce. Il catalogo pubblico permette di valutarlo prima dell'acquisto; il profilo dell'autore sostiene la fiducia. Il Trip Builder usa i contenuti già pubblicati come base per suggerimenti conversazionali.

L'effettiva percorrenza da parte del Ranger è una promessa della visione storica: lo schema attuale consente una data del viaggio, ma non dimostra una certificazione indipendente né controlli sul campo. Non è quindi presentata come garanzia tecnica acquisita.

### Metodo e attendibilità della ricostruzione

Questo documento fotografa il repository al 15 ottobre 2026. Non descrive una nuova inception con interviste e non certifica il comportamento dell'ambiente di produzione.

| Livello di evidenza | Fonte locale | Utilizzo nel PRD |
|---|---|---|
| Implementazione | `src/app/`, `src/components/`, `src/lib/`, `prisma/schema.prisma` | Capacità e regole presenti nel codice; eventuali limiti esplicitati |
| Contratti di prodotto | `.archetipo/backlog.yaml`, `.archetipo/specs/US-075.yaml`–`US-101.yaml` | Intenzioni, perimetro delle storie e riferimenti per la tracciabilità |
| Visione preesistente | `requirements.md`, «Visione di Prodotto v0.4» | Target over 50, problema, proposta di valore e ambizioni storiche |
| Configurazione | `package.json`, `package-lock.json`, `next.config.js`, `jest.config.js` | Stack, versioni risolte e comandi disponibili |
| Test esistenti | `src/tests/` | Esempi di comportamento atteso; presenza e limiti della verifica |
| Documentazione tecnica | `README.md`, `docs/react-leaflet-strict-mode-decision.md` | Indicazioni operative e scelta documentata per le mappe |

Le storie US-075–US-099 risultano `DONE` nel backlog; le note di importazione indicano un aggiornamento storico degli stati su richiesta dell'utente. Lo stato amministrativo non sostituisce la verifica del codice o l'esecuzione delle dimostrazioni. US-100 e US-101 risultano `TODO`. Le divergenze rilevate sono mantenute visibili, senza modificare backlog o stati.

La Wiki automatica è disabilitata dalla configurazione ARchetipo. Le pagine esistenti non sono state usate come fonte né modificate.

### Risultati e indicatori di valore

Il risultato centrale per l'Explorer è passare da un bisogno di viaggio a un itinerario comprensibile e a una traccia scaricabile. Per il Ranger è pubblicare contenuti riutilizzabili; per il Sentinel è governare catalogo e accessi.

| Indicatore proposto | Definizione operativa | Stato |
|---|---|---|
| Conversione all'acquisto | Utenti che completano un acquisto / utenti autenticati che iniziano l'acquisto, nel periodo | Strumentazione e obiettivo da definire |
| Attivazione dopo l'acquisto | Acquirenti con almeno un download GPX riuscito / acquirenti, entro 7 giorni | Strumentazione e obiettivo da definire |
| Tempo al primo download | Tempo tra avvio dell'acquisto e primo download riuscito | Misura proposta, non rilevata |
| Offerta utilizzabile | Numero di itinerari pubblicati con tappe descritte e GPX disponibili | Definizione da verificare sui dati reali |
| Qualità percepita | Esito di prove con utenti del target e richieste di assistenza per acquisto/download | Ricerca da svolgere |

I traguardi storici di 10.000 registrati, 3.000 abbonati, ARPU superiore a 9 €/mese, NPS almeno 50 e 300 percorsi certificati provengono da `requirements.md`. Non sono risultati osservati né obiettivi riconfermati: alcuni presuppongono un modello ad abbonamento assente dal codice attuale.

---

## Profili degli utenti

<!-- archetipo:prd section=user_personas required=true -->

I nomi e i dettagli personali seguenti sono archetipi progettuali, coerenti con il lessico del backlog. Non rappresentano persone intervistate.

### Persona 1: Marco, l'Explorer

**Ruolo:** fruitore e acquirente di itinerari; ruolo applicativo `Explorer`.  
**Età:** 50–60 anni, fascia indicativa della visione storica.  
**Contesto:** motoviaggiatore che organizza uscite e vacanze, spesso con amici, e preferisce usare contenuti già preparati.

**Obiettivi:** trovare un viaggio adatto a destinazione e tempo disponibile; capire cosa comprende; ottenere le tracce senza gestire numerosi strumenti.

**Difficoltà:** racconti e GPX distribuiti su canali diversi; incertezza su completezza e autore; poca familiarità con download, pagamenti e importazione sul navigatore.

**Comportamenti e strumenti:** consulta il sito anche da smartphone, confronta schede e immagini, usa un navigatore o un'app esterna per il GPX. L'installazione sul dispositivo non è automatizzata dal prodotto.

**Motivazioni:** dedicare più tempo all'esperienza e meno alla preparazione; sentirsi autonomo senza dover diventare esperto di cartografia.  
**Competenza digitale:** bassa o intermedia; richiede etichette esplicite e conferme comprensibili.

#### Percorso d'uso — Marco

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Scoperta | Apre il catalogo da un link o dalla homepage | «Troverò qualcosa per il prossimo viaggio?» | Curiosità | Catalogo pubblico senza registrazione obbligatoria |
| Valutazione | Cerca una destinazione e apre una scheda | «Durata, tappe e contenuti valgono il prezzo?» | Interesse con prudenza | Anteprima chiara, autore riconoscibile, prezzo visibile |
| Primo utilizzo | Si registra o usa Google, acquista e scarica | «Ho pagato? Dove trovo la traccia?» | Possibile incertezza | Esito del pagamento, area acquisti e download riconoscibili |
| Uso ricorrente | Riapre i viaggi acquistati e cerca nuove proposte | «Posso ritrovare quello che mi serve?» | Fiducia se l'accesso funziona | Dashboard e biblioteca degli acquisti |
| Passaparola | Consiglia il sito o invia il link della scheda | «Lo consiglierei anche ai miei amici» | Soddisfazione | URL pubblico stabile; condivisione esterna manuale |

### Persona 2: Giulia, la Ranger

**Ruolo:** autrice di itinerari; ruolo applicativo `Ranger`, assegnato amministrativamente.  
**Età:** adulta; nessuna fascia validata nelle fonti.  
**Contesto:** motociclista esperta che conserva tracce e racconti dei propri viaggi e vuole renderli utili ad altri.

**Obiettivi:** trasformare GPX, foto e descrizioni in itinerari leggibili; mantenere aggiornate le tappe; costruire reputazione attraverso il profilo pubblico.

**Difficoltà:** materiali eterogenei, errori nei file, ripetizione dei caricamenti, incertezza sui contenuti necessari per pubblicare.

**Comportamenti e strumenti:** prepara materiali su computer, usa il modulo di creazione e modifica, carica GPX e immagini, inserisce video esterni; per quantità maggiori usa l'importazione ZIP.

**Motivazioni:** condividere esperienza e rendere riconoscibile la propria competenza. La remunerazione è un'intenzione storica; non esiste evidenza di un flusso di liquidazione ai Ranger.  
**Competenza digitale:** intermedia; comprende tracce e contenuti, ma beneficia di validazioni e messaggi contestuali.

#### Percorso d'uso — Giulia

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Scoperta | Consulta il sito e il profilo di un Ranger | «Posso valorizzare anche i miei viaggi?» | Interesse | Esempi di itinerari e identità dell'autore |
| Valutazione | Ottiene il ruolo e prepara i materiali | «Che cosa devo caricare?» | Aspettativa | Requisiti editoriali e formati espliciti |
| Primo utilizzo | Salva una bozza, aggiunge tappe e GPX, pubblica | «Il viaggio è completo?» | Incertezza, poi soddisfazione | Validazione prima della pubblicazione con errori per campo |
| Uso ricorrente | Aggiorna contenuti e importa più viaggi | «Come evito attività ripetitive?» | Efficienza | Gestione tappe, riordino e monitoraggio batch |
| Passaparola | Condivide il proprio profilo pubblico | «I lettori riconoscono il mio contributo» | Orgoglio | Biografia, link social e viaggi pubblicati associati |

### Utente operativo: Sentinel

Il Sentinel amministra utenti e ruoli, modera e gestisce viaggi, imposta prezzi e ordinamento, consulta gli acquisti ed esegue operazioni amministrative come omaggi e registrazione di rimborsi. Ha anche le capacità editoriali del Ranger. Non sono modellati ruoli distinti per assistenza, amministrazione finanziaria o redazione.

### Accessibilità e inclusione

Il target richiede testi leggibili, controlli con etichette comprensibili, feedback persistenti e un percorso utilizzabile anche senza interazioni precise sulla mappa. Errori, consenso e acquisti devono essere gestibili da tastiera; informazioni su accesso e stati non devono dipendere solo dal colore. Il riordino delle tappe e le mappe richiedono verifiche specifiche. Queste sono esigenze di prodotto: non è stata effettuata una verifica completa di accessibilità o una prova con utenti.

---

## Risultati dell'esplorazione di prodotto

<!-- archetipo:prd section=brainstorming_insights required=true -->

> Analisi retrospettiva delle scelte e delle alternative, condotta sulle fonti del repository. Le domande seguenti sono tecniche di verifica delle ipotesi, non risposte attribuite all'utente.

### Ipotesi messe alla prova

**Tecnica 1 — Contestazione delle assunzioni, a cura di Costanza.** «E se l'utente cercasse soprattutto una traccia affidabile, senza voler pagare per un abbonamento?» Il codice offre già acquisti per viaggio e prezzo per itinerario. Ne deriva una proposta centrata sul valore del singolo contenuto; la disponibilità a pagare e il bisogno di ricorrenza rimangono da verificare. Il listino predefinito di 5,00 nello schema non costituisce una strategia di prezzo approvata.

**Tecnica 2 — Problema inverso, a cura di Costanza e Livia.** «Come renderemmo frustrante il primo viaggio a un utente poco tecnologico?» Nascondendo cosa è incluso, confondendo accesso e acquisto, mostrando errori tecnici e lasciando il GPX difficile da trovare. Le opportunità ricavate sono: anteprima comprensibile, stati di pagamento chiari, acquisti ritrovabili, spiegazioni del download e recupero dagli errori.

**Tecnica 3 — Cambio di pubblico.** «Che cosa cambia se il fruitore è un ciclista?» Il backlog recente richiede classificazione Moto/Bicicletta e ricerca per MTB, Gravel e Stradale. Il codice e il prompt AI restano orientati alla moto: l'estensione non può essere dedotta dalla sola compatibilità tecnica del formato GPX.

### Direzioni emerse

- Consolidare il percorso catalogo → dettaglio → acquisto → download come esperienza centrale.
- Rendere esplicito il rapporto tra esperienza dell'autore, validazione dei dati e promessa di affidabilità.
- Mantenere il Trip Builder come assistente di scoperta finché non esistono contratti e verifiche per generare itinerari nuovi.
- Trattare il supporto alla bicicletta come estensione esplicita della classificazione e del catalogo, conservando il perimetro delle storie già presenti.

### Assunzioni da validare e domande aperte

| ID | Assunzione o domanda | Evidenza e decisione da ottenere |
|---|---|---|
| A-01 | Il pubblico primario resta il motoviaggiatore over 50 con competenza digitale contenuta? | Target in `requirements.md`; manca ricerca utenti recente |
| A-02 | Il modello economico di riferimento è l'acquisto per singolo itinerario? | Implementato; confermare il rapporto con abbonamenti e gratuità storici |
| A-03 | Chi verifica che un Ranger abbia percorso davvero il viaggio e quanto vale la parola «certificato»? | Nessun processo indipendente dimostrato nel codice |
| A-04 | La pubblicazione autonoma del proprietario deve restare consentita? | È il comportamento corrente; una revisione Sentinel obbligatoria sarebbe una modifica di prodotto |
| A-05 | Che cosa accade ai diritti degli acquirenti quando un viaggio torna in bozza, viene archiviato o eliminato? | Controllo dello stato e diritto premium sono separati; serve un contratto uniforme |
| A-06 | Rimborso significa solo revoca amministrativa o anche restituzione del denaro tramite Stripe? | Il servizio attuale registra `REFUNDED`, senza invocare un rimborso Stripe |
| A-07 | Come vengono remunerati i Ranger e quali contenuti possono vendere? | Aspettativa nella visione; payout e ripartizione ricavi non rilevati |
| A-08 | Dove sono eseguiti oggi hosting, database, storage e invio email? | README con note AWS e alternative; ambiente attivo non ispezionato |
| A-09 | Dove si inseriscono e modificano i tipi di bicicletta? | US-101 li richiede; US-100 al momento descrive solo il mezzo |
| A-10 | Quali soglie di successo, carico e accessibilità devono essere vincolanti? | KPI storici non riconfermati; mancano misure e obiettivi operativi |

### Rischi principali

| Rischio | Implicazione per il prodotto | Risposta proposta |
|---|---|---|
| Offerta insufficiente o poco differenziata | Il catalogo e l'AI non soddisfano le richieste | Verificare copertura e completezza prima di ampliare la promessa |
| Bassa conversione o difficoltà nel GPX | Il valore non si realizza dopo l'acquisto | Prove del percorso completo con utenti del target |
| Fiducia superiore alle verifiche effettive | «Certificato» suggerisce controlli non dimostrati | Definire responsabilità e processo editoriale |
| Controlli premium distribuiti | Accesso UI, API e URL dei file possono divergere | Verificare i dati inviati al client e l'accesso diretto allo storage |
| Pagamenti di prova e autorizzazioni | L'endpoint mock è presente e richiede autenticazione, senza un vincolo d'ambiente visibile | Riesaminare uso in produzione e titolarità dell'acquisto prima dell'operatività commerciale |
| Rimborso solo contabile | Stato locale e movimento monetario possono non coincidere | Definire rimborso finanziario e riconciliazione |
| Suggerimenti AI non verificati integralmente | Vincoli cumulativi o trasferimenti possono essere incoerenti | Verifiche deterministiche sull'insieme proposto e prove di integrazione reali |
| Batch dentro il processo applicativo | Il completamento può dipendere dal ciclo di vita dell'istanza | Verificare compatibilità dell'hosting e recupero dei job interrotti |

---

## Perimetro del prodotto

<!-- archetipo:prd section=product_scope required=true -->

### MVP — Prodotto minimo utilizzabile

Nel PRD retrospettivo, MVP indica il nucleo funzionale ricostruito, non una nuova promessa di rilascio né una certificazione di tutte le storie `DONE`.

| Capacità | Perimetro osservato | Riferimenti backlog |
|---|---|---|
| Account e autorizzazioni | Registrazione e verifica email, Google e credenziali, recupero password, cambio email, ruoli | US-075–US-078 |
| Produzione degli itinerari | Creazione e modifica, tappe ordinate, GPX e media, validazione prima della pubblicazione | US-079–US-084 |
| Accesso ai contenuti | Separazione tra pubblicati e non pubblicati; accesso premium per proprietario, Sentinel o acquisto completato | US-085, US-091 |
| Scoperta | Catalogo pubblico, ricerca testuale, dettaglio con mappe e media | US-087, US-088 |
| Acquisto | Prezzo per viaggio, acquisto, integrazione Stripe e webhook, biblioteca personale | US-089, US-090 |
| Identità dell'autore | Profilo personale e pagina pubblica Ranger | US-092, US-093 |
| Operatività | Gestione viaggi, utenti, ruoli, prezzi, vetrina e acquisti | US-094–US-096 |
| Consenso e contatto | Preferenze cookie, blocco video esterni, pagine informative e modulo contatti | US-097, US-098 |

### Funzionalità di crescita successive al nucleo MVP

**Già presenti nel codice:** importazione massiva ZIP con job e avanzamento (US-086); assistente AI di scoperta del catalogo (US-099, classificata `Growth` nel backlog). La collocazione qui è una lettura del valore di prodotto e non modifica lo scope registrato nelle storie.

**Previste e non implementate nel codice osservato:** classificazione del mezzo Moto/Bicicletta (US-100); filtri per mezzo e tipo di bicicletta, etichette pubbliche e combinazione con la ricerca testuale (US-101). Entrambe sono `TODO` e attualmente classificate `MVP` nel backlog dell'estensione ciclistica. La selezione di più tipi associati a un viaggio richiede di chiarire il contratto editoriale mancante in US-100.

**Da riconciliare:** filtri separati per durata, area geografica e stagione previsti da US-087. Il catalogo corrente usa una ricerca testuale su titolo, destinazione e tag; non sono stati rilevati i controlli separati descritti dalla storia.

### Visione futura

Le seguenti capacità appartengono alla visione storica o a possibili direzioni successive e richiedono decisioni e specifiche dedicate:

- Abbonamenti, periodo iniziale gratuito e segmento commerciale «Explorer Pro»; `Explorer Pro` non è un ruolo applicativo attuale.
- Generazione di nuovi itinerari e GPX, composizione modificabile di POI e segmenti, limiti giornalieri e routing stradale verificato.
- Prenotazioni di strutture e servizi, pagamenti e liquidazioni ai Ranger.
- Applicazioni native, navigazione durante il viaggio e pacchetti offline PDF/ZIP completi.
- Certificazione indipendente dei percorsi, programmazione della pubblicazione e funzioni social dedicate.

Queste capacità non sono requisiti consegnati dalla baseline. L'estensione ciclistica non include conversione automatica dei GPX, difficoltà specifica, fondo, nuove tariffe o adattamento dell'AI, coerentemente con le esclusioni delle storie esistenti.

---

## Architettura tecnica

<!-- archetipo:prd section=technical_architecture required=true -->

> **Ricostruita da:** Leonardo, architetto. Le scelte riportate descrivono il repository; non introducono una migrazione tecnologica.

### Architettura del sistema

**Modello architetturale:** monolite web Next.js con App Router, componenti server e client, Route Handlers e servizi applicativi organizzati per capacità. PostgreSQL conserva gli aggregati; i file risiedono su storage esterno.

Il browser apre le pagine server e usa componenti interattivi per ricerca, editor, upload, pagamenti e chat. Le operazioni passano dalle API e dai servizi; Prisma interroga PostgreSQL. NextAuth gestisce l'identità. Stripe restituisce l'esito del pagamento al client e invia webhook al server. La chat interroga OpenRouter utilizzando un insieme di viaggi pubblicati e vincoli estratti dal testo.

**Componenti principali:**

- **Account:** NextAuth, Google e credenziali, sincronizzazione utente, verifica email e token di recupero/cambio email.
- **Itinerari:** `Trip` e `Stage`, editor, validazione, autorizzazioni e gestione del ciclo di vita.
- **Catalogo:** rendering dei pubblicati, ricerca nel client, pagine di dettaglio e profili Ranger.
- **Acquisti:** `TripPurchase` e `TripPurchaseTransaction`, servizi di acquisto, Stripe e autorizzazione premium.
- **File e geografia:** astrazione storage, upload, parsing GPX, Leaflet e servizi geografici.
- **Operatività:** pannello Sentinel, importazione batch, SMTP e contatti.
- **Trip Builder:** selezione dei pubblicati, estrazione dei vincoli, prompt e raccomandazioni conversazionali.

### Stack tecnologico

Le versioni risolte provengono da `package-lock.json`, non da un ambiente distribuito ispezionato.

| Livello | Tecnologia | Versione risolta o dichiarata | Motivazione ricostruita |
|---|---|---|---|
| Linguaggio | TypeScript | 5.8.3 risolta; `^5.3.3` dichiarata | Tipi condivisi tra UI, API e dominio |
| Backend e routing | Next.js | 15.5.12 risolta; `^15.4.6` dichiarata | Pagine server e API nella stessa applicazione |
| Frontend | React / React DOM | 18.3.1 risolta; `^18.2.0` dichiarata | Componenti, form e interazioni |
| Stili | Tailwind CSS | 3.4.17 risolta | Layout e presentazione responsive |
| Database | PostgreSQL | Versione server non rilevata | Persistenza relazionale e transazioni |
| ORM | Prisma / Prisma Client | 6.8.2 risolta | Modello dati e accesso tipizzato |
| Autenticazione | NextAuth e adapter Prisma | NextAuth 5.0.0-beta.30 | Google OAuth, credenziali e sessioni JWT |
| Validazione e form | Zod, React Hook Form | Zod `^3.25.76`; RHF `^7.62.0` dichiarati | Validazioni e gestione dei moduli |
| Mappe | Leaflet, componente DirectLeafletMap | Leaflet 1.9.4 risolta | Visualizzazione GPX con gestione esplicita del ciclo di vita |
| Pagamenti | Stripe, Stripe.js e React Stripe.js | SDK server Stripe 18.4.0 risolto | PaymentIntent, modulo carta e webhook |
| Storage | Vercel Blob, AWS S3, CloudFront | SDK indicati in `package.json` | Provider selezionabile con `STORAGE_PROVIDER` |
| AI | OpenRouter via HTTP | `OPENROUTER_MODEL` configurabile | Accesso al modello per la scoperta conversazionale |
| Email | Nodemailer / SMTP | `^7.0.11` dichiarata | Verifica account, recupero e messaggi |
| Test | Jest e Testing Library | Jest 29.7.0 risolta | Test di servizi, API e componenti |

React-Leaflet e Mapbox sono tra le dipendenze, ma la scelta documentata per il ciclo di vita delle mappe è DirectLeafletMap. Supabase e Clerk appartengono alla visione originaria e non descrivono autenticazione e accesso ai dati implementati.

### Struttura del progetto

**Modello organizzativo:** cartelle per capacità e livelli applicativi, con schema dati centrale e test separati per tipologia.

```text
RideAtlas/
├── src/
│   ├── app/                    # Pagine App Router e API
│   ├── components/             # UI per itinerari, profilo, mappe, admin e acquisto
│   ├── hooks/                  # Stato e interazioni del client
│   ├── lib/                    # Servizi di dominio e integrazioni
│   ├── schemas/                # Schemi Zod
│   ├── types/                  # Contratti TypeScript
│   ├── tests/                  # Unitari, integrazione e cartella e2e
│   ├── auth.ts                 # Configurazione NextAuth
│   └── middleware.ts           # Protezione e instradamento delle richieste
├── prisma/schema.prisma        # Modello PostgreSQL
├── docs/PRD.md                 # Questo documento
├── requirements.md             # Visione storica
└── .archetipo/                 # Configurazione e backlog esistente
```

**Modello dati essenziale:** `User` possiede viaggi e acquisti; `Trip` contiene `Stage` ordinate e un autore; `TripPurchase` registra l'acquisto di un viaggio e possiede uno storico `TripPurchaseTransaction`. `BatchJob` rappresenta importazioni per utente. Token e account OAuth gestiscono i flussi di identità. Ruoli: `Explorer`, `Ranger`, `Sentinel`. Non sono modellati entità POI autonome, abbonamenti, prenotazioni, payout o mezzo di trasporto.

### Ambiente di sviluppo

**Strumenti richiesti:** Node.js e npm, PostgreSQL raggiungibile, configurazione OAuth per i test Google, credenziali dei provider da provare. Non è presente una versione Node fissata verificata da questo lavoro.

Comandi esistenti: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:ci` e i comandi `db:*`. Lo script `test:e2e` esegue Jest nella cartella omonima: non dimostra da solo test browser completi.

La configurazione richiede almeno connessione database e autenticazione (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`), Google per OAuth, SMTP per invio reale, Stripe per pagamenti, storage per i file e OpenRouter per l'AI. Il modello AI di fallback nel codice è `anthropic/claude-3.5-sonnet`; è una configurazione osservata, non una raccomandazione aggiornata.

Gli script `postinstall` e `setup` includono `prisma db push`: l'installazione può quindi sincronizzare lo schema del database configurato. Le procedure di ambiente devono tenerne conto. Nessuna connessione, migrazione o modifica ai dati è stata eseguita per scrivere questo PRD.

### CI/CD e distribuzione

**Strumento di compilazione:** `npm run build`, che esegue `prisma generate && next build`.

**Pipeline:** sono presenti comandi di lint, test e build, ma non sono stati trovati workflow `.github/` o un file `amplify.yml` versionato. Una pipeline raccomandata per il consolidamento esegue tali controlli su database di prova e verifica la configurazione prima del rilascio; non è presentata come pipeline già operativa.

**Distribuzione:** il README documenta AWS Amplify Hosting con RDS PostgreSQL e discute anche Vercel. Il servizio effettivamente attivo, le impostazioni di rete e la configurazione runtime non sono verificati.

**Infrastruttura di riferimento:** runtime Next.js con supporto alle API server, PostgreSQL, storage selezionato, SMTP, Stripe e OpenRouter. Il provider storage predefinito nel codice è `vercel-blob`; AWS S3 e CloudFront sono alternative implementate. Per i job batch va verificato che l'hosting consenta il completamento dell'elaborazione avviata nel processo applicativo.

### Decisioni architetturali (ADR)

| Decisione | Stato e motivazione | Conseguenza |
|---|---|---|
| Monolite Next.js e Prisma | Ricostruita dal codice | Confini applicativi da mantenere nei servizi, senza presumere microservizi |
| Sessioni JWT con NextAuth | Esplicita in `src/auth.ts` | Distinguere sessione, ruolo nel token e autorizzazione sulla singola risorsa |
| DirectLeafletMap con Strict Mode attivo | Documentata in `docs/react-leaflet-strict-mode-decision.md` | Conservare inizializzazione e cleanup controllati senza disabilitare Strict Mode |
| Provider storage astratto | Esplicita in `src/lib/storage/` | Stesse operazioni logiche con credenziali e policy differenti per provider |
| Acquisti con transazioni e stati | Esplicita nello schema e nel servizio | Diritti basati su acquisti completati; rimborso e omaggio registrati separatamente |
| AI ancorata al catalogo | Esplicita nel prompt e nelle API | Suggerimenti sui pubblicati; nessuna garanzia di generazione o navigabilità di nuove tracce |

**Verifica di realizzabilità, a cura di Costanza:** prima di affidare modifiche a un agente vanno precisati accesso pubblico/premium, transizioni degli stati, significato dei rimborsi e inserimento dei tipi di bicicletta. Questi contratti sono più vincolanti della scelta di nuove librerie. Gli ADR ricostruiti in tabella non sono nuovi file ADR approvati.

---

## Requisiti funzionali

<!-- archetipo:prd section=functional_requirements required=true -->

Gli identificatori FR sono locali al PRD e non sostituiscono i codici US. **Presente** significa individuato nel codice, non collaudato in produzione. **Parziale** segnala un contratto solo parzialmente realizzato o una divergenza. **Previsto** indica comportamento di backlog non implementato. Ogni riga include un esito osservabile per successive dimostrazioni.

### Account e permessi

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-001 | Registrare un account email/password, rifiutare indirizzi già usati e consentire il login con credenziali solo dopo verifica email. Un token invalido o scaduto produce un esito comprensibile e non verifica l'account. | Presente; US-075; `src/app/api/auth/register/`, `verify-email/`, `resend-verification/`, `src/auth.ts` |
| FR-002 | Consentire l'accesso con Google o credenziali e la disconnessione. L'identità risultante ha un ID utente e un ruolo applicativo. | Presente; US-076; `src/auth.ts`, `src/app/auth/` |
| FR-003 | Consentire recupero, impostazione e cambio password, oltre al cambio email tramite verifica. Operazioni invalide non aggiornano le credenziali. | Presente; US-077; `src/app/api/auth/`, `src/app/api/user/change-password/`, `src/app/api/profile/change-email/`, `verify-email-change/` |
| FR-004 | Applicare i permessi Explorer/Ranger/Sentinel. L'Explorer fruisce dei contenuti; Ranger e Sentinel creano; solo Sentinel usa le operazioni amministrative. Richieste senza identità o autorizzazione vengono rifiutate. | Presente con verifica trasversale da completare; US-078; `src/middleware.ts`, controlli nei Route Handlers |

### Creazione, contenuti e ciclo di vita

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-005 | Creare una bozza con titolo, sommario, destinazione, durata giorni/notti, tema, tag, caratteristiche e stagioni; attribuirla all'autore con slug univoco. Il salvataggio rende il viaggio ritrovabile tra i propri contenuti. | Presente; US-079; `src/app/api/trips/route.ts`, `src/schemas/trip.ts` |
| FR-006 | Consentire al proprietario o al Sentinel di modificare l'itinerario e gestire tappe con ordine, titolo, descrizione, tipo di percorso e durata. Dopo il salvataggio e la riapertura i dati mantengono l'ordine. | Presente; US-080; `src/app/api/trips/[id]/route.ts`, `stages/` |
| FR-007 | Caricare e analizzare GPX del viaggio e delle tappe, mostrare la traccia e i metadati disponibili, segnalare file non accettati. L'endpoint di upload GPX impone il limite di 20 MB. | Presente; US-081; `src/app/api/upload/gpx/`, `src/lib/gpx/`, `src/components/maps/` |
| FR-008 | Associare media a viaggio e tappe e gestirne la rimozione. Il caricamento ordinario di immagini usa i tipi ammessi e il limite di 5 MB; i video esterni seguono il percorso previsto dalla UI. | Presente; US-082; `src/app/api/upload/`, `src/components/upload/`, `src/lib/services/storageCleanup.ts` |
| FR-009 | Pubblicare una bozza su iniziativa del proprietario o del Sentinel, dopo validazione; consentire le operazioni amministrative di ritorno a bozza e gestione stato. Il viaggio pubblicato appare nel catalogo. | Presente con transizioni da uniformare; US-083, US-094; `publish/`, `revert-to-draft/`, `src/app/api/admin/trips/` |
| FR-010 | Bloccare la pubblicazione se mancano titolo, sommario, almeno una tappa o, per una tappa, descrizione e riferimento GPX. L'errore elenca le carenze e il viaggio resta in bozza. Questa verifica non equivale alla certificazione del tracciato. | Presente; US-084; `src/lib/trips/tripValidationService.ts` |
| FR-011 | Mostrare i non pubblicati solo al proprietario e al Sentinel nelle pagine che ne controllano lo stato. Un visitatore o altro autore non può consultarne il dettaglio ordinario. | Presente; US-085; `src/lib/auth/trip-access.ts`, `src/app/trips/[slug]/page.tsx` |
| FR-012 | Importare un archivio ZIP fino a 100 MB con `viaggi.json` e materiali secondo il modello scaricabile. Restituire un job consultabile con avanzamento, risultati ed errori; verificare il recupero dopo interruzioni in ambiente reale. | Presente; US-086; `src/app/api/trips/batch/`, `src/lib/batch/` |

**Contratto di stato osservato:** lo schema ammette `Bozza`, `Pronto_per_revisione`, `Pubblicato`, `Archiviato`. Gli endpoint di pubblicazione e approvazione esaminati passano direttamente da `Bozza` a `Pubblicato`. Non si assume un passaggio obbligatorio attraverso `Pronto_per_revisione`. La storia US-083 prevede anche l'archiviazione amministrativa; una matrice completa di transizioni richiede verifica dedicata.

### Scoperta e consultazione

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-013 | Mostrare pubblicamente solo i viaggi `Pubblicato`, con ordinamento di vetrina e data di creazione, schede e collegamento al dettaglio. Una bozza non appare nel catalogo. | Presente; US-087; `src/app/trips/page.tsx`, `src/components/trips/TripGrid.tsx` |
| FR-014 | Cercare senza distinzione maiuscole/minuscole su titolo, destinazione e tag. Tutte le parole devono corrispondere ad almeno un campo; la ricerca vuota ripristina l'elenco. Segnalare input non valido e assenza di risultati. | Presente; US-087; `src/lib/utils/searchUtils.ts`, `src/hooks/useTripFilters.ts` |
| FR-015 | Combinare filtri separati di durata, area e stagione con la ricerca, come richiesto dal contratto esistente. La loro rimozione ripristina l'insieme corrispondente ai controlli rimasti. | Previsto dalla US-087 `DONE`, controlli non rilevati nella UI attuale; divergenza da riconciliare |
| FR-016 | Aprire il dettaglio tramite slug con informazioni del viaggio, autore, media e visualizzazione delle tracce disponibili. Distinguere anteprima e tappe soggette al controllo premium. | Presente con protezione dei dati da consolidare; US-088, US-091; `src/app/trips/[slug]/page.tsx`, `src/components/trips/TripDetailClient.tsx` |

### Acquisti e diritti di accesso

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-017 | Avviare un acquisto per un viaggio acquistabile usando il prezzo sul server. Gestire l'eventuale gratuità con un diritto registrato; impedire acquisti attivi duplicati e l'acquisto del proprio viaggio. | Presente; US-089; `src/lib/payment/purchaseService.ts`, `src/app/api/trips/[id]/purchase/` |
| FR-018 | Gestire PaymentIntent Stripe, conferma del pagamento e webhook firmati; aggiornare l'acquisto e lo storico in base all'esito. Un pagamento fallito non concede l'accesso. Verificare eventi ripetuti e corrispondenza tra utente, importo e acquisto. | Presente con verifica completa di riconciliazione da svolgere; US-090; `src/app/api/payments/stripe/`, `src/app/api/webhooks/stripe/` |
| FR-019 | Concedere accesso premium al proprietario, al Sentinel o a chi possiede un acquisto `COMPLETED`; mostrare agli altri l'invito ad autenticarsi o acquistare. Il solo stato `PENDING` non concede il diritto. | Presente nelle funzioni di accesso e nella UI; copertura del confine server da verificare; US-091; `src/app/api/trips/[id]/access/`, `src/components/auth/AccessGate.tsx` |
| FR-020 | Rendere disponibile il download GPX autorizzato, con esiti distinti per assenza file, mancati permessi e indisponibilità storage. Il percorso corrente verifica il file e redirige al relativo URL. | Presente; US-081, US-091; `src/app/api/trips/[id]/gpx/route.ts`; accesso ai singoli file di tappa e policy storage da verificare |
| FR-021 | Mostrare all'utente i viaggi acquistati e consentire di riaprirli. Un nuovo acquisto dopo un rimborso conserva la storia precedente. | Presente; US-089, US-091; `src/app/api/user/purchases/`, `src/components/trips/PurchasedTrips.tsx`, `src/lib/payment/purchaseService.ts` |

### Profili e amministrazione

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-022 | Gestire il profilo personale con nome, biografia, avatar, social e, per le capacità previste, informazioni e foto della moto. Validare i dati e conservare gli aggiornamenti alla riapertura. | Presente; US-092; `src/app/api/profile/`, `src/app/api/user/avatar/`, `bike-photos/`, `src/schemas/profile.ts` |
| FR-023 | Rendere pubblico il profilo di un Ranger con biografia, collegamenti e viaggi pubblicati; gestire identità non trovate o ruoli non ammessi. | Presente; US-093; `src/app/ranger/[username]/page.tsx`, `src/lib/actions/ranger.ts` |
| FR-024 | Consentire al Sentinel di gestire contenuti, approvare bozze, modificare prezzi e ordinamento di vetrina e assegnare un viaggio a un Ranger. L'eliminazione amministrativa è consentita solo alle bozze. | Presente; US-094; `src/app/api/admin/trips/`, `src/components/admin/` |
| FR-025 | Consentire al Sentinel di creare e gestire utenti, cambiare ruoli e gestire l'eliminazione secondo le regole applicative. Gli utenti ordinari non possono promuoversi autonomamente. | Presente; US-095; `src/app/api/admin/users/`, `src/lib/auth/user-sync.ts` |
| FR-026 | Consentire al Sentinel di consultare gli acquisti, assegnare omaggi e registrare un rimborso di un acquisto completato con storico e motivazione. Il rimborso locale revoca quel diritto; non rappresenta un trasferimento di denaro Stripe. | Presente come operazione amministrativa locale; US-096; `src/app/api/admin/purchases/`, `src/lib/payment/purchaseService.ts` |

### Consenso e contatti

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-027 | Offrire accettazione, rifiuto e personalizzazione dei consensi; mantenere essenziali attivi e categorie opzionali disattivate inizialmente; consentire la modifica successiva. I video esterni restano bloccati senza il consenso relativo. | Presente; US-097; `src/lib/ui/cookie-consent.ts`, `src/components/ui/CookieBanner.tsx`, `VideoConsentBanner.tsx` |
| FR-028 | Pubblicare privacy, cookie e condizioni d'uso con collegamenti nel sito; offrire contatti con validazione e risultato di invio. Distinguere consegna email reale da risposta simulata nell'ambiente privo di configurazione. | Presente; US-098; `src/app/privacy-policy/`, `cookie-policy/`, `terms-of-service/`, `src/app/api/contact/`, `src/lib/core/email.ts` |

### Assistenza AI

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-029 | Offrire agli autenticati una chat con richiesta testuale e cronologia recente. La risposta suggerisce viaggi pubblicati del catalogo con collegamenti al dettaglio, senza creare nuove entità viaggio o GPX. | Presente; US-099; `src/app/trip-builder/`, `src/app/api/trip-builder/` |
| FR-030 | Estrarre vincoli di durata e geografia, filtrare candidati e fornire avvisi sui trasferimenti stimati. Non proporre come garantiti durata cumulativa, itinerario stradale o precisione delle stime. Verificare coerenza fra viaggi menzionati e avvisi. | Parziale; US-099; `src/lib/validation/`, `src/lib/trips/tripAnalysisService.ts`, `src/lib/trip-builder/promptService.ts` |

### Estensione ciclistica prevista

| ID | Requisito ed esito osservabile | Stato e tracciabilità |
|---|---|---|
| FR-031 | Consentire un solo mezzo per viaggio: Moto o Bicicletta. Nuovi viaggi e preesistenti partono da Moto; la modifica persiste e non cambia lo stato di pubblicazione, rispettando i permessi esistenti. | Previsto; US-100 `TODO`; il modello corrente non ha il campo mezzo |
| FR-032 | Filtrare il catalogo per Tutti/Moto/Bicicletta; solo con Bicicletta mostrare Tutti i tipi/MTB/Gravel/Stradale. Ricerca, mezzo e tipo si combinano; cambiando mezzo si conserva il testo e si azzera il tipo. | Previsto; US-101 `TODO` |
| FR-033 | Mostrare mezzo e tutti i tipi associati in scheda e dettaglio. Un viaggio senza tipi resta incluso in Tutti i tipi, senza implicare compatibilità specifiche. Le bozze restano escluse e l'assenza di risultati mantiene disponibili i filtri. | Previsto; US-101 `TODO`; la gestione editoriale delle associazioni dei tipi richiede chiarimento A-09 |

---

## Requisiti non funzionali

<!-- archetipo:prd section=non_functional_requirements required=true -->

Questa sezione distingue meccanismi osservati e requisiti da verificare. La presenza di implementazione o test non equivale a un audit di sicurezza, una misura prestazionale o una verifica normativa.

### Sicurezza

| ID | Requisito | Evidenza e limite |
|---|---|---|
| NFR-001 | Autorizzare ogni operazione su ruolo, titolarità e risorsa richiesta, con rifiuto in caso di identità insufficiente. | Controlli in middleware e handler; da verificare uniformità, aggiornamento dei ruoli nella sessione e titolarità nei flussi di pagamento |
| NFR-002 | Conservare password con hash e imporre la complessità prevista: almeno 8 caratteri, maiuscola, minuscola e numero; applicare token con scadenza ai flussi dedicati. | `src/auth.ts`, `src/lib/auth/password-validation.ts`, modelli token e API account |
| NFR-003 | Proteggere realmente contenuti premium e URL dei file sul server e nello storage, prima di trasmetterli a un non autorizzato. | Esistono gate e API; la pagina dettaglio passa tappe e dati del viaggio al componente client. Non è dimostrata la riservatezza con il solo gate visivo |
| NFR-004 | Tenere segreti e dettagli operativi fuori da client, risposte e log non necessari; usare impostazioni di sessione adeguate all'ambiente. | Cookie `httpOnly`, `sameSite: lax`, `secure` in produzione; errori e configurazioni richiedono riesame dell'ambiente reale |
| NFR-005 | Validare form, link social, file e richieste; delimitare abusi su autenticazione, contatti, upload e AI. | Zod, validazioni e modulo di rate limiting esistono; copertura completa dei punti d'ingresso non verificata |
| NFR-006 | Separare operazioni di pagamento di prova da quelle commerciali e verificare firma e associazioni degli eventi Stripe. | Webhook firmato implementato; endpoint `/api/payments/mock` presente senza blocco d'ambiente visibile |

### Integrazioni

| ID | Contratto richiesto | Stato e dipendenza |
|---|---|---|
| NFR-007 | Google OAuth deve usare callback coerenti con l'ambiente e restituire l'utente corretto. | Integrato con NextAuth; richiede credenziali e configurazione del provider |
| NFR-008 | Stripe deve mantenere coerenza tra pagamento, importo, acquisto, storico e diritto concesso, anche su ripetizione degli eventi. | Integrazione presente; verifica reale in ambiente di prova ancora necessaria |
| NFR-009 | Ogni provider storage deve sostenere upload, accesso e rimozione coerenti con i permessi dei contenuti. | Interfaccia comune e provider Vercel Blob/S3/CloudFront; policy effettive non ispezionate |
| NFR-010 | OpenRouter deve produrre suggerimenti gestendo errori e indisponibilità senza simulare nuovi viaggi esistenti. | Chiamata HTTP e prompt ancorato al catalogo; comportamento del modello da valutare con casi reali |
| NFR-011 | SMTP deve distinguere invio riuscito, errore e simulazione; l'utente non deve scambiare una simulazione per una consegna effettiva. | Nodemailer e percorsi di fallback presenti; consegna esterna non provata |
| NFR-012 | Mappe e video esterni devono gestire caricamento fallito e rispetto delle preferenze applicabili. | Componenti mappa con gestione errori e video con consenso; verificare richieste effettive nel browser |

### Usabilità, accessibilità e prestazioni

| ID | Esito atteso | Verifica richiesta |
|---|---|---|
| NFR-013 | Il percorso catalogo → acquisto → download è utilizzabile su desktop e smartphone senza perdere prezzo, esito e azione successiva. | Prove su viewport rappresentative e con utenti del target |
| NFR-014 | I flussi principali funzionano da tastiera, con etichette e messaggi comprensibili; mappa, riordino e consenso non costituiscono ostacoli esclusivi. | Verifica manuale e assistiva; nessun livello di conformità dichiarato |
| NFR-015 | La ricerca dà feedback durante l'aggiornamento e distingue caricamento, input invalido, catalogo vuoto e nessuna corrispondenza. | Debounce predefinito di 300 ms presente; non è una misura del tempo di risposta complessivo |
| NFR-016 | Catalogo, mappe, upload, AI e pagamenti rispettano budget di risposta e carico da concordare. | Nessun benchmark o obiettivo numerico verificato; definire prima della prova di carico |

### Affidabilità, dati e verificabilità

- **NFR-017 — Coerenza dei dati:** transazioni e vincoli devono impedire acquisti o stati incoerenti. L'unicità dell'ordine delle tappe è modellata; gli acquisti multipli sono ammessi per conservare riacquisti dopo rimborso. Ripetizione degli eventi e concorrenza richiedono verifica.
- **NFR-018 — Ripristino operativo:** definire backup e ripristino di database e file, trattamento dei job interrotti e ricostruzione dei diritti acquistati. Nessuna procedura operativa completa o prova di ripristino è stata accertata.
- **NFR-019 — Test significativi:** mantenere verifiche su ruoli, accesso ai non pubblicati, pubblicazione, pagamento, rimborso e download; usare prove browser e provider di test per i percorsi integrati. `src/tests/integration/tripBuilder.test.ts` contiene test segnaposto e non dimostra un'integrazione AI funzionante.
- **NFR-020 — Gestione delle informazioni personali:** inventariare dati raccolti, consensi, destinatari e conseguenze dell'eliminazione. Le pagine informative e i meccanismi presenti sono evidenze di implementazione; la loro adeguatezza deve essere valutata separatamente.

---

## Passi successivi

<!-- archetipo:prd section=next_steps required=true -->

1. **Validazione del prodotto:** confermare con il responsabile target, acquisto per viaggio, promessa di affidabilità, pubblicazione autonoma e diritti dopo ritiro di un itinerario. Usare A-01–A-10 come elenco di decisioni, senza assumere che siano già approvate.
2. **Riconciliazione del backlog esistente:** rivedere le divergenze tra US-087 e ricerca attuale, chiarire associazione dei tipi di bicicletta fra US-100 e US-101 e verificare il significato operativo dei rimborsi. Un eventuale aggiornamento passa da `/archetipo-spec`; non rigenerare il backlog già presente.
3. **Consolidamento dei percorsi commerciali:** verificare confine server dei contenuti premium, URL dei file, autorizzazioni e isolamento dei pagamenti mock; eseguire scenari Stripe di prova e definire rimborso finanziario, concorrenza e riconciliazione.
4. **Verifica dell'esperienza:** provare account → acquisto → download con Explorer, produzione con Ranger e gestione con Sentinel; includere errori, assenza dati, accessibilità e uso da smartphone. Usare `/archetipo-design` se servono proposte isolate di miglioramento della UI.
5. **Evoluzione ciclistica:** risolvere A-09, quindi pianificare le storie `TODO` mantenendo classificazione e filtri distinti da navigazione, prezzi e AI.
6. **Misure e operatività:** fissare obiettivi e strumenti per gli indicatori, identificare l'infrastruttura attiva e definire controlli di rilascio e ripristino.

**Verifica effettuata per questa ricostruzione:** lettura del codice, schema, configurazione, backlog e test selezionati; validazione strutturale superata con `archetipo validate prd` (`data.ok: true`): documento non vuoto, nessun segnaposto irrisolto e tutte le sezioni obbligatorie presenti con contenuto significativo. Le suite applicative, i provider esterni e l'ambiente distribuito non sono stati eseguiti o collaudati nell'ambito della redazione. Questo lavoro non cambia codice applicativo, backlog o stato delle storie.

---

_PRD retrospettivo generato con gli standard ARchetipo Product Inception — 15 ottobre 2026._  
_Richiesto dal responsabile del progetto RideAtlas; ricostruzione a cura del team ARchetipo su fonti locali._
