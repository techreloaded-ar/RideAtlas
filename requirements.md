# RideAtlas – Visione di Prodotto v0.4

## 1. Elevator Pitch

Per i **motoviaggiatori over‑50**, spesso poco tecnologici ma desiderosi d’avventura, **RideAtlas** è una piattaforma **web e mobile** che permette di **scaricare percorsi certificati** o **creare itinerari personalizzati** senza doversi occupare di aspetti tecnici. Offre viaggi curati da ranger che hanno davvero percorso quelle strade, completi di GPX, punti imperdibili, soste consigliate e strutture prenotabili. Quando il viaggiatore ha esigenze particolari (es. “9 notti in Slovacchia, tappe max 200 km”), il nostro Trip Builder AI genera un percorso su misura, integrando i POI scelti dall’utente. “**Noi lo facciamo per te. Tu guidi l’avventura.**”

---

## 2. Vision Board

| Sezione                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Segmenti target**     | • **Explorer** motociclista base 50‑60 anni, pigro tech, vuole viaggi pronti • **Explorer Pro** explorer che fornisce parametri ed è disposto a pagare di più per avere itinerario sartoriali.           • **Ranger** esploratore che produce contenuti. Viene remunerato. **• Sentinel** amministratore di sistema                                                                                                                        |
| **Problemi / Esigenze** | **Explorer**: ottenere velocemente una traccia affidabile, con info su cosa vedere, dove mangiare/dormire, senza doversi sbattere. **Explorer PRO**: definire parametri (date, durata, trasferimento ≤ X h, tappe ≤ Y km) e ricevere percorso ottimizzato con POI filtrabili (viola/verde/blu). **Ranger**: monetizzare/condividere i propri viaggi reali, mantenere reputazione. **Sentinel**: gestire utenti, ruoli, pagamenti e contenuti. |
| **Proposta di Valore**  | • Viaggi "pronti all'uso" testati sul campo  • Trip Builder AI che adatta tracce esistenti o ne crea di nuove  • Libreria gratuita 1° anno → abbonamento mensile  • Booking integrato di strutture moto‑friendly                                                                                                                                                                                                                           |
| **Differenziatori**     | 1. Percorsi realmente percorsi da ranger  2. Viaggio base con POI, soste food‑&‑sleep verificate  3. Personalizzazione che tiene conto di tempi di guida, preferenze e tappe  4. L’utente rimane la “guida” della propria avventura                                                                                                                                                                                                         |
| **Metriche Obiettivo**  | • 10 k utenti registrati alla fine del periodo free  • 3 k abbonati paganti a +12 mesi  • ARPU > €9/mese  • NPS ≥ 50  • 300 percorsi certificati                                                                                                                                                                                                                                                                                              |

---

## 4. Backlog – User Story (ordinata con Story Points)

* **US 1.1  REGISTRAZIONE RAPIDA (pt 1)** 
  *In qualità di motociclista, desidero registrarmi via e‑mail, Apple o Google in meno di 60 secondi affinché possa iniziare subito a usare la piattaforma.*
* **US 1.2  CONSULTAZIONE LIBRERIA CON FILTRI** 
  *In qualità di motociclista, desidero filtrare la libreria pubblica per destinazione, durata, difficoltà, tema e tipologia di strada/moto affinché possa vedere solo i viaggi che rispondono alle mie esigenze.* 
  **Criteri di accettazione** 

  1. I campi di filtro disponibili sono *destinazione, durata, difficoltà, tema, tipologia strada/moto*.
  2. Dopo aver applicato i filtri, la lista mostra tutti i viaggi corrispondenti con *titolo* e *descrizione*; il titolo è un link alla pagina di dettaglio.
* **US 1.3  DETTAGLIO VIAGGI**
   *In qualità di motociclista, desidero visualizzare il dettaglio di un singolo viaggio affinché possa capire se è di mio interesse.* 
  **Criteri di accettazione** 

  1. Vedo testo descrittivo completo del viaggio.
  2. Posso riprodurre i video associati al viaggio.
  3. È presente il link per scaricare il viaggio.
  4. È presente il link per installare il GPX.
* **US 1.4 CONDIVISIONE SOCIAL**
  *In qualità di motociclista, desidero condividere il viaggio sui social (Facebook, Instagram, WhatsApp) affinché possa far conoscere il percorso ad altri motociclisti.* **Criteri di accettazione** 

  1. Dal dettaglio viaggio sono presenti i pulsanti di condivisione Facebook, Instagram e WhatsApp.
  2. Il link condiviso apre la pagina del viaggio in modalità pubblico/anteprima.
  3. Il sistema mostra un messaggio di conferma di condivisione riuscita.
* **US 1.5  DOWNLOAD VIAGGIO**
  *In qualità di motociclista, desidero scaricare il viaggio base (GPX, POI, PDF) affinché possa consultarlo offline e installarlo sul mio dispositivo di navigazione.* **Criteri di accettazione** 

  1. Il download fornisce un archivio compresso con GPX, PDF e link ai video.
  2. Il file PDF contiene descrizione, mappa, elenco POI, strutture consigliate.
  3. Il viaggio scaricato corrisponde esattamente al viaggio visualizzato.
* **US 4.1 CREAZIONE VIAGGIO BASE**
  *In qualità di ranger, desidero creare un nuovo viaggio affinché poi possa aggiungere contenuti multimediali, associare tracce GPX e definire i POI.* **Criteri di accettazione** 

  1. Posso inserire titolo, sommario, destinazione/area geografica e durata (giorni/notti).
  2. Posso impostare difficoltà, tag/tema e stagione consigliata.
  3. Il sistema genera automaticamente slug univoco, data di creazione e imposta lo stato **Bozza**.
  4. Dopo il salvataggio posso accedere alle funzioni di upload contenuti (US 4.1), validazione (US 4.2) e gestione POI/GPX (US 4.5). 
* **US 4.2 CREA NUOVO VIAGGIO**
  *In qualità di ranger, desidero caricare tracce GPX, foto e video e associare i POI affinché possa pubblicare contenuti di qualità sulla piattaforma.* 
  **Criteri di accettazione:**

  1. Posso selezionare o trascinare file GPX (≤ 20 MB), immagini (≥ 1280×720 px) e video MP4 (≤ 500 MB).
  2. Posso inserire titolo, descrizione, tag e livello di difficoltà.
  3. Posso associare i media a waypoint/POI sulla mappa con un click
  4. Dopo il salvataggio il contenuto è in stato **Bozza** in attesa di validazione.
* **US 4.3  CREAZIONE VIAGGIO**
  *In qualità di motociclista, desidero creare un viaggio personalizzato indicando durata, destinazione, limite di trasferimento e chilometri giornalieri affinché possa andare dove desidero.* 
  **Criteri di accettazione** (sintesi)

  1. Inserimento durata, destinazione, trasferimento max, km/giorno.
* **US 5 1 ASSEGNAZIONE POI**
  *In qualità di ranger, desidero assegnare POI a un viaggio e alle sue tracce di interesse affinché i punti di interesse siano visibili agli utenti durante la pianificazione e la navigazione.* 
  **Criteri di accettazione** 

  1. Il POI viene selezionato direttamente dalla mappa con un click lungo o ricerca coordinate. 
  2. Il POI deve contenere almeno *titolo* e *testo breve* (max 250 caratteri). 
  3. Salvando, il POI è associato al viaggio selezionato e appare nel riepilogo POI del viaggio in stato Bozza.
* **US 5.2 ASSEGNAZIONE TRACCIA**
  *In qualità di ranger, desidero assegnare una traccia GPX a un viaggio esistente affinché il percorso sia georeferenziato e pronto per la validazione.* 
  **Criteri di accettazione** 

  1. Posso caricare un file GPX valido (≤ 20 MB). 
  2. Il sistema visualizza la traccia sulla mappa in modo georeferenziato.
  3. La traccia viene salvata come parte del viaggio in stato **Bozza** per eventuale validazione. \\
* **US 5.3  VALIDAZIONE AUTOMATICA**
  *In qualità di ranger, desidero che la piattaforma validi automaticamente i file caricati affinché i contenuti pubblicati rispettino gli standard di qualità.* 
  **Criteri di accettazione**

  1. Il GPX contiene almeno una traccia continua (> 5 km) senza errori di coordinate.
  2. Le immagini e i video rispettano requisiti di formato e dimensione.
  3. In caso di errori l’utente riceve messaggio di dettaglio.
  4. Se tutte le verifiche passano, lo stato passa a Pronto per revisione.
* **US 5.4  AGGIUNTA POI/SEGMENTO**
  *In qualità di ranger, desidero aggiungere singoli POI o segmenti di traccia affinché gli utenti possano arricchire i propri viaggi personalizzati.* 
  **Criteri di accettazione** 

  1. Posso creare un nuovo POI su mappa inserendo coordinate, titolo, descrizione e foto. 
  2. Posso caricare un segmento GPX ≤ 30 km e assegnargli tag e descrizione. 
  3. Il nuovo elemento è soggetto a validazione automatica come in US 4.2. 
  4. Gli utenti del Trip Builder possono trovare e usare il nuovo elemento entro 15 min dalla pubblicazione.
* **US 5.5  SELEZIONE ELEMENTI**
  *In qualità di motociclista, desidero selezionare o modificare i POI, i segmenti di traccia e le strutture proposte affinché il viaggio rispecchi i miei interessi.* 
  **Criteri di accettazione** (sintesi) 

  1. Gestione POI con codice colore; aggiunta/rimozione. 
  2. Gestione segmenti traccia e strutture.
* **US 6.1  PREVIEW VIAGGIO**
   *In qualità di motociclista, desidero vedere un’anteprima del viaggio personalizzato affinché possa valutarne la coerenza con i miei parametri.* 
  **Criteri di accettazione** (sintesi) 

  1. Mappa con percorso completo e riepilogo distanze; possibilità di conferma.
* **US 7.1  PROGRAMMA PUBBLICAZIONE**
  *In qualità di ranger, desidero programmare la pubblicazione di un viaggio affinché possa promuoverlo in anticipo sui social.* 
  **Criteri di accettazione** (sintesi)

  1. Calendario data/ora; stato programmato; notifica agli abbonati.
* **US 8.1  CERTIFICAZIONE RANGER**
  *In qualità di ranger senior, desidero nominare un power user come ranger junior affinché possa pubblicare le proprie tracce e contribuire alla community.* 
  **Criteri di accettazione** (sintesi)

  1. Ricerca utente, assegnazione ruolo, notifica e revoca da admin.

  * **US 9.1  TRIP BUILDER**
  *In qualità di motociclista, desidero utilizzare il Trip Builder per creare un itinerario personalizzato basato su viaggi esistenti e ottimizzato per le mie esigenze.* 
  **Criteri di accettazione** (sintesi)

  1. I viaggi proposti sono solo quelli presenti in RideAtlas
  2. L’AI suggerisce combinazioni ottimali di viaggi in base ai parametri inseriti.
  3. Se il trasferimento tra un viaggio e un altro è più lungo di 30Km deve essere presente un warning

---

## 5. Architettura

**Obiettivo**: fornire linee guida d’architettura per stimare effort, scegliere stack e mantenere la flessibilità necessaria a evolvere il prodotto.

* **Next.js**: framework React per frontend/server rendering e routing efficiente
* **Supabase**: backend as-a-service per database PostgreSQL, API realtime e storage
* **Clerk**: gestione autenticazione e identità (email, Apple/Google login, ACL)
* **TailwindCSS**: sistema utility-first per styling veloce e responsivo
* **Prisma**: ORM per accedere al database in modo sicuro e efficiente
* **Mapbox**: mappa interattiva per visualizzare tracce e POI
* **OpenRouter**: API per chiamare modelli LLM (es. ChatGPT) e ottimizzare percorsi