# RideAtlas – Visione di Prodotto v0.3 (9 maggio 2025)

## 1. Elevator Pitch

Per i **motoviaggiatori over‑50**, spesso poco tecnologici ma desiderosi d’avventura, **RideAtlas** è una piattaforma **web e mobile** che permette di **scaricare percorsi certificati** o **creare itinerari personalizzati** senza doversi occupare di aspetti tecnici. Offre pacchetti curati da ranger che hanno davvero percorso quelle strade, completi di GPX, punti imperdibili, soste consigliate e strutture prenotabili. Quando il viaggiatore ha esigenze particolari (es. “9 notti in Slovacchia, tappe max 200 km”), il nostro Trip Builder AI genera un percorso su misura, integrando i POI scelti dall’utente. “**Noi lo facciamo per te. Tu guidi l’avventura.**”

---

## 2. Vision Board

| Sezione                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Segmenti target**     | • **Motociclista Base** (50‑60 anni, pigro tech, vuole pacchetti pronti)  • **Planner Personalizzato** (utente che fornisce parametri e vuole itinerario sartoriale)  • **Ranger/Editor** (esploratore che produce contenuti)  • **Admin**                                                                                                                                                                                        |
| **Problemi / Esigenze** | **Base**: ottenere velocemente una traccia affidabile, con info su cosa vedere, dove mangiare/dormire, senza doversi sbattere. **Planner**: definire parametri (date, durata, trasferimento ≤ X h, tappe ≤ Y km) e ricevere percorso ottimizzato con POI filtrabili (viola/verde/blu). **Ranger**: monetizzare/condividere i propri viaggi reali, mantenere reputazione. **Admin**: gestire utenti, ruoli, pagamenti e contenuti. |
| **Proposta di Valore**  | • Pacchetti "pronti all’uso" testati sul campo  • Trip Builder AI che adatta tracce esistenti o ne crea di nuove  • Libreria gratuita 1° anno → abbonamento mensile  • Booking integrato di strutture moto‑friendly                                                                                                                                                                                                               |
| **Differenziatori**     | 1. Percorsi realmente percorsi da ranger  2. Pacchetto base con POI, soste food‑&‑sleep verificate  3. Personalizzazione che tiene conto di tempi di guida, preferenze e tappe  4. L’utente rimane la “guida” della propria avventura                                                                                                                                                                                             |
| **Metriche Obiettivo**  | • 10 k utenti registrati alla fine del periodo free  • 3 k abbonati paganti a +12 mesi  • ARPU > €9/mese  • NPS ≥ 50  • 300 percorsi certificati                                                                                                                                                                                                                                                                                  |

---

## 2b. Indicazioni Tecniche di Massima

**Obiettivo**: fornire linee guida d’architettura per stimare effort, scegliere stack e mantenere la flessibilità necessaria a evolvere il prodotto.

* **Next.js**: framework React per frontend/server rendering e routing efficiente

- **Supabase**: backend as-a-service per database PostgreSQL, API realtime e storage

* **Clerk** – gestione autenticazione e identità (email, Apple/Google login, ACL)&#x20;
* **TailwindCSS** – sistema utility-first per styling veloce e responsivo

|   |
| - |

|   |
| - |

---

## 3. Go Product Roadmap (12 mesi)

| Orizzonte                                         | Outcome                                     | Feature chiave                                                                                                                   | KPI                                        |
| ------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Q3‑2025 – MVP Libreria**                        | Validare interessa pacchetti curati         | • Libreria browse/search (free) • Download GPX • Contenuti multimediali • Account base                                           | 1 k download pacchetto, 70 % soddisfazione |
| **Q4‑2025 – Subscription & Trip Builder Beta**    | Convertire a pagamento e testare AI planner | • Stripe/PayPal/Apple Pay • Modulo parametri viaggio • Mappa POI colore • Generazione percorso custom • Email supporto concierge | 1 k abbonati, 25 % uso builder             |
| **Q1‑2026 – Community & Ranger Hub**              | Aumentare offerta contenuti                 | • Portale upload ranger • Validazione percorsi • Ricompense ranger • Rating/feedback utenti                                      | 150 ranger attivi, 50 nuove tracce/mese    |
| **Q2‑2026 – Personalizzazione Pro & Marketplace** | Crescita ARPU e engagement                  | • Suggerimenti settimanali AI • Upsell pacchetti premium • Affiliate booking flusso completo                                     | ARPU +20 %, churn < 5 %                    |

---

## 3a. Struttura dati "Viaggio"

| Attributo                  | Tipo                                                | Descrizione                                                           |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| **id**                     | UUID                                                | Identificativo univoco del viaggio.                                   |
| **slug**                   | string                                              | Stringa SEO‑friendly usata per URL (/viaggi/val-d-orcia-classic).     |
| **titolo**                 | string                                              | Nome del viaggio visualizzato in libreria.                            |
| **sommario**               | string                                              | Breve teaser (140‑200 caratteri).                                     |
| **descrizione\_html**      | rich‑text HTML                                      | Descrizione completa con formattazione.                               |
| **ranger\_id**             | UUID                                                | Utente ranger autore.                                                 |
| **data\_creazione**        | datetime                                            | Timestamp di creazione.                                               |
| **data\_pubblicazione**    | datetime nullable                                   | Popolato quando lo stato diventa *pubblicato*.                        |
| **stato**                  | enum(draft, review, scheduled, published, archived) | Workflow redazionale.                                                 |
| **durata\_giorni**         | integer                                             | Numero complessivo di giorni (auto‑calcolato dalle tappe).            |
| **notti**                  | integer                                             | Numero notti (durata\_giorni − 1).                                    |
| **distanza\_km\_totale**   | decimal                                             | Somma dei km di tutte le tappe.                                       |
| **difficoltà**             | enum(easy, medium, hard)                            | Valutazione soggettiva del ranger.                                    |
| **tema\_tag\[]**           | array                                               | Tag liberi (arte, natura, borghi, off‑road…).                         |
| **area\_geojson**          | GeoJSON Polygon                                     | Bounding box/area del viaggio.                                        |
| **tracce\_gpx\[]**         | array                                               | Oggetti GPX con meta‑dati (filename, distance\_km, elevation\_gain).  |
| **tappe\[]**               | array                                               | Elenco giornaliero (giorno, distanza\_km, gpx\_ref, descrizione).     |
| **poi\[]**                 | array                                               | POI con id, nome, coord, categoria, colore\_priorità, media\_refs\[]. |
| **media\[]**               | array                                               | Foto, video, drone‑footage con type, url, thumbnail, credit.          |
| **accommodations\[]**      | array                                               | Strutture con nome, coord, booking\_url, price\_range.                |
| **ristoranti\[]**          | array                                               | Punti ristoro consigliati.                                            |
| **documenti\[]**           | array                                               | PDF, road‑book, brochure scaricabili.                                 |
| **lingue\_disponibili\[]** | array                                               | es: \["it","en","de"].                                                |
| **rating\_media**          | decimal(2,1)                                        | Media recensioni utenti.                                              |
| **reviews\_count**         | integer                                             | Numero di recensioni.                                                 |
| **prezzo\_base**           | decimal                                             | Prezzo pacchetto base (0 se free).                                    |
| **license**                | enum(CC‑BY‑NC, internal, commercial)                | Licenza d’uso contenuti.                                              |
| **visite\_totali**         | integer                                             | Visualizzazioni in libreria (analytics).                              |

> *La struttura è pensata per Postgres + PostGIS: le relazioni **********************************************************************************************tracce\_gpx**********************************************************************************************, **********************************************************************************************poi**********************************************************************************************, **********************************************************************************************media**********************************************************************************************, **********************************************************************************************tappe********************************************************************************************** hanno tabelle dedicate con chiave esterna verso **********************************************************************************************viaggio\_id**********************************************************************************************.*

## 4. Backlog – User Story (ordinata con Story Points)

* **US 1.1  REGISTRAZIONE RAPIDA (pt 1)** &#x20;
  *In qualità di motociclista, desidero registrarmi via e‑mail, Apple o Google in meno di 60 secondi affinché possa iniziare subito a usare la piattaforma.*

* \*\*US 1.2  CONSULTAZIONE  LIBRERIA \*\*\*\*CON FILTRI \*\***(pt 3)** &#x20;
  *In qualità di motociclista, desidero filtrare la libreria pubblica per destinazione, durata, difficoltà, tema e tipologia di strada/moto affinché possa vedere solo i viaggi che rispondono alle mie esigenze.* &#x20;
  **Criteri di accettazione**  \\

  1. I campi di filtro disponibili sono *destinazione, durata, difficoltà, tema, tipologia strada/moto*. &#x20;

  2. Dopo aver applicato i filtri, la lista mostra tutti i viaggi corrispondenti con *titolo* e *descrizione*; il titolo è un link alla pagina di dettaglio.

* **US 1.3  DETTAGLIO VIAGGIO (pt 2)** &#x20;
  *In qualità di motociclista, desidero visualizzare il dettaglio di un singolo viaggio affinché possa capire se è di mio interesse.* &#x20;
  **Criteri di accettazione**  \\

  1. Vedo testo descrittivo completo del viaggio. &#x20;

  2. Posso riprodurre i video associati al viaggio. &#x20;

  3. È presente il link per scaricare il pacchetto. &#x20;

  4. È presente il link per installare il GPX.

* **US 1.3bis  CONDIVISIONE SOCIAL (pt 1)** &#x20;
  *In qualità di motociclista, desidero condividere il viaggio sui social (Facebook, Instagram, WhatsApp) affinché possa far conoscere il percorso ad altri motociclisti.* &#x20;
  **Criteri di accettazione**  \\

  1. Dal dettaglio viaggio sono presenti i pulsanti di condivisione Facebook, Instagram e WhatsApp. &#x20;

  2. Il link condiviso apre la pagina del viaggio in modalità pubblico/anteprima. &#x20;

  3. Il sistema mostra un messaggio di conferma di condivisione riuscita.

* **US 1.4  DOWNLOAD PACCHETTO (pt 2)** &#x20;
  *In qualità di motociclista, desidero scaricare il pacchetto base (GPX, POI, PDF) affinché possa consultarlo offline e installarlo sul mio dispositivo di navigazione.* &#x20;
  **Criteri di accettazione**  \\

  1. Il download fornisce un archivio compresso con GPX, PDF e link ai video. &#x20;

  2. Il file PDF contiene descrizione, mappa, elenco POI, strutture consigliate. &#x20;

  3. Il pacchetto scaricato corrisponde esattamente al viaggio visualizzato.

* **US 4.0  CREAZIONE VIAGGIO BASE (pt 2)** &#x20;
  *In qualità di ranger, desidero creare un nuovo pacchetto viaggio affinché poi possa aggiungere contenuti multimediali, associare tracce GPX e definire i POI.* &#x20;
  **Criteri di accettazione**  \\

  1. Posso inserire titolo, sommario, destinazione/area geografica e durata (giorni/notti). &#x20;

  2. Posso impostare difficoltà, tag/tema e stagione consigliata. &#x20;

  3. Il sistema genera automaticamente slug univoco, data di creazione e imposta lo stato **Bozza**. &#x20;

  4. Dopo il salvataggio posso accedere alle funzioni di upload contenuti (US 4.1), validazione (US 4.2) e gestione POI/GPX (US 4.5).  \\

* **US 4.1 CREA NUOVO VIAGGIO (pt 5)**&#x20;
  *In qualità di ranger, desidero caricare tracce GPX, foto e video e associare i POI affinché possa pubblicare contenuti di qualità sulla piattaforma.* &#x20;
  **Criteri di accettazione:**

  1. Posso selezionare o trascinare file GPX (≤ 20 MB), immagini (≥ 1280×720 px) e video MP4 (≤ 500 MB). &#x20;

  2. Posso inserire titolo, descrizione, tag e livello di difficoltà. &#x20;

  3. Posso associare i media a waypoint/POI sulla mappa con un click

  4. Dopo il salvataggio il contenuto è in stato **Bozza** in attesa di validazione.

* **US 4.1.2  ASSEGNAZIONE POI (pt 2)** &#x20;
  *In qualità di ranger, desidero assegnare POI a un viaggio e alle sue tracce di interesse affinché i punti di interesse siano visibili agli utenti durante la pianificazione e la navigazione.* &#x20;
  **Criteri di accettazione**  \\

  1. Il POI viene selezionato direttamente dalla mappa con un click lungo o ricerca coordinate.  \\

  2. Il POI deve contenere almeno *titolo* e *testo breve* (max 250 caratteri).  \\

  3. Salvando, il POI è associato al viaggio selezionato e appare nel riepilogo POI del viaggio in stato **Bozza**.

* **US 4.1.3  ASSEGNAZIONE TRACCIA (pt 2)** &#x20;
  *In qualità di ranger, desidero assegnare una traccia GPX a un viaggio esistente affinché il percorso sia georeferenziato e pronto per la validazione.* &#x20;
  **Criteri di accettazione**  \\

  1. Posso caricare un file GPX valido (≤ 20 MB).  \\

  2. Il sistema visualizza la traccia sulla mappa in modo georeferenziato.  \\

  3. La traccia viene salvata come parte del viaggio in stato **Bozza** per eventuale validazione.  \\

* **US 4.3  VALIDAZIONE AUTOMATICA (pt 5)** &#x20;
  *In qualità di ranger, desidero che la piattaforma validi automaticamente i file caricati affinché i contenuti pubblicati rispettino gli standard di qualità.* &#x20;
  **Criteri di accettazione** &#x20;

  1. Il GPX contiene almeno una traccia continua (> 5 km) senza errori di coordinate. &#x20;
  2. Le immagini e i video rispettano requisiti di formato e dimensione. &#x20;
  3. In caso di errori l’utente riceve messaggio di dettaglio. &#x20;
  4. Se tutte le verifiche passano, lo stato passa a **Pronto per revisione**.

* **US 4.5  AGGIUNTA POI/SEGMENTO (pt 3)** &#x20;
  *In qualità di ranger, desidero aggiungere singoli POI o segmenti di traccia affinché gli utenti possano arricchire i propri viaggi personalizzati.* &#x20;
  **Criteri di accettazione**  \\

  1. Posso creare un nuovo POI su mappa inserendo coordinate, titolo, descrizione e foto.  \\

  2. Posso caricare un segmento GPX ≤ 30 km e assegnargli tag e descrizione.  \\

  3. Il nuovo elemento è soggetto a validazione automatica come in US 4.2.  \\

  4. Gli utenti del Trip Builder possono trovare e usare il nuovo elemento entro 15 min dalla pubblicazione.

* **US 3.1  SETUP VIAGGIO (pt 3)** &#x20;
  *In qualità di motociclista, desidero creare un viaggio personalizzato indicando durata, destinazione, limite di trasferimento e chilometri giornalieri affinché possa andare dove desidero.* &#x20;
  **Criteri di accettazione** (sintesi)  \\

  1. Inserimento durata, destinazione, trasferimento max, km/giorno.

* **US 3.2  SELEZIONE ELEMENTI (pt 5)** &#x20;
  *In qualità di motociclista, desidero selezionare o modificare i POI, i segmenti di traccia e le strutture proposte affinché il viaggio rispecchi i miei interessi.* &#x20;
  **Criteri di accettazione** (sintesi)  \\

  1. Gestione POI con codice colore; aggiunta/rimozione.  \\

  2. Gestione segmenti traccia e strutture.

* **US 3.3  PREVIEW VIAGGIO (pt 3)** &#x20;
  *In qualità di motociclista, desidero vedere un’anteprima del viaggio personalizzato affinché possa valutarne la coerenza con i miei parametri.* &#x20;
  **Criteri di accettazione** (sintesi)  \\

  1. Mappa con percorso completo e riepilogo distanze; possibilità di conferma.

* **US 4.4  PROGRAMMA PUBBLICAZIONE (pt 3)** &#x20;
  *In qualità di ranger, desidero programmare la pubblicazione di un pacchetto viaggio affinché possa promuoverlo in anticipo sui social.* &#x20;
  **Criteri di accettazione** (sintesi)  \\

  1. Calendario data/ora; stato programmato; notifica agli abbonati.

* **US 4.3  CERTIFICAZIONE RANGER (pt 2)** &#x20;
  *In qualità di ranger senior, desidero nominare un power user come ranger junior affinché possa pubblicare le proprie tracce e contribuire alla community.* &#x20;
  **Criteri di accettazione** (sintesi)  \\

  1. Ricerca utente, assegnazione ruolo, notifica e revoca da admin.

---
