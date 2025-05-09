# Progetto **RideAtlas** – Visione & Pianificazione v0.2 (7 maggio 2025)

> **Nota sul nome:** fra le proposte elencate sotto, in questa bozza userò “RideAtlas” come segnaposto.

---
## 1. Elevator Pitch (Italiano)
Per gli **appassionati di viaggi in moto** che desiderano itinerari curati o personalizzabili, **RideAtlas** è una **piattaforma web + mobile in abbonamento** che offre ogni settimana pacchetti viaggio multimediali e un **costruttore di percorsi assistito da AI**. A differenza delle app di navigazione generiche o dei siti di prenotazione, integra tracce GPX esplorate da ranger, storytelling e prenotazione alloggi in un’unica esperienza senza frizioni.

---
## 2. Vision Board
| Sezione | Dettagli |
| --- | --- |
| **Segmenti target** | • Utente Base (abbonato)  • Power User (designer di viaggi)  • Ranger/Editor (esploratore‑contenutista)  • Admin |
| **Problemi / Esigenze** | **Base**: scoprire itinerari di qualità, installare GPX in 1 click, prenotare alloggi. **Power**: inserire date, durata, budget e preferenze; selezionare un’area sulla mappa e ottenere itinerari ottimizzati,  pubblicare contributi. **Ranger**: condividere percorsi e media, ottenere riconoscimento. **Admin**: gestire ruoli, pagamenti, ACL. |
| **Prodotto** | PWA + app native, AI per generazione/ottimizzazione rotta e raccomandazioni contenuti. |
| **Obiettivi business** | • 20 k abbonati anno 1  • Churn mensile < 5 %  • GMV prenotazioni €2 M  • Comunità ranger 200 attivi |
| **Ricavi** | • Abbonamenti B2C  • Commissioni su alloggi e noleggio  • Marketplace pacchetti premium  • API white‑label B2B |
| **Costi** | API mappe/booking, incentivi contenuti, AI compute, marketing |
| **Canali** | App store, community moto, influencer‑ranger |

---
## 2.b Tecnologie & Stack
RideAtlas sarà sviluppato con un **tech stack moderno** che consente iterazione rapida, scalabilità e ottima esperienza utente:

- **Next.js** – framework React per frontend/server rendering e routing efficiente  
- **Supabase** – backend as-a-service per database PostgreSQL, API realtime e storage  
- **Clerk** – gestione autenticazione e identità (email, Apple/Google login, ACL)  
- **TailwindCSS** – sistema utility-first per styling veloce e responsivo

Questa combinazione consente di accelerare lo sviluppo dell’MVP mantenendo una solida base per evoluzioni future, incluse PWA e app native.

---
## 3. Roadmap 12 mesi
| Orizzonte | Obiettivo | Feature chiave | Metriche di successo |
| --- | --- | --- | --- |
| **Q3‑2025 – MVP** | Validare disponibilità a pagare | • Login & pagamenti (PayPal, Apple/Google Pay) • Libreria pacchetti & ricerca • Email settimanale • Download GPX • CMS base ranger | • 1 k abbonati • 70 % open rate email |
| **Q4‑2025 – Trip Builder Beta** | Abilitare design viaggi | • Modulo parametri viaggio (date, durata, budget) e selezione area "cerchio" su mappa • AI route optimizer • Ricerca alloggi con filtri • Esportazione viaggio • Workflow certificazione ranger | • 30 % builder MAU • Tempo medio progettazione < 10 min |
| **Q1‑2026 – Community & Marketplace** | Ampliare contenuti e engagement | • Upload segmenti UGC • Rating & review • Programma reward ranger • Booking in‑app | • 150 ranger attivi • 10 % viaggi con UGC |
| **Q2‑2026 – Personalizzazione & AI Concierge** | Aumentare retention & ARPU | • Suggerimento settimanale personalizzato • Chat assistant GPT • Dynamic pricing | • NPS ≥ 50 • ARPU + 20 % |

---
## 4. Backlog – Epiche
### Epic 1: On‑boarding & Abbonamento (Utente Base)
* **US 1.1**  Come nuovo rider mi registro con e‑mail, Apple o Google in < 60 s.
* **US 1.2**  Come abbonato pago mensilmente con Apple Pay, PayPal o carta e sblocco subito i pacchetti premium.

### Epic 2: Fruizione Pacchetti
* **US 2.1**  Come abbonato sfoglio e filtro i pacchetti per regione, difficoltà, tema.
* **US 2.2**  Scarico il file GPX e lo importo nell’app di navigazione con un tap.
* **US 2.3**  Posso visualizzare foto, video drone e note culturali anche offline.

### Epic 3: Trip Builder (Power User)
* **US 3.1**  Inserisco il periodo di viaggio (date di partenza/ritorno), la durata complessiva, il budget indicativo e le preferenze tematiche.
* **US 3.2**  Disegno un cerchio sulla zona di interesse e il sistema mi mostra sulla mappa strutture ricettive con prezzi, POI con video e le tracce già disponibili.
* **US 3.3**  Se nella zona non esistono tracce adeguate, l’AI genera automaticamente nuovi percorsi coerenti con i miei parametri.
* **US 3.4**  Salvo il viaggio ed esporto GPX unificato + PDF day‑by‑day.

### Epic 4: CMS Ranger
* **US 4.1**  Carico tracce GPX, foto e annoto POI.
* **US 4.2**  Programmo un pacchetto per revisione e pubblicazione.
* **US 4.3**  Posso certificare un power user.

### Epic 5: Admin & ACL
* **US 5.1**  Gestisco ruoli, sospensioni e permessi.
* **US 5.2**  Visualizzo dashboard metriche abbonamenti.

---
## 5. Definizione di Ready / Done
**DoR**  
* Storia con valore e criteri di accettazione chiari  
* Dipendenze identificate  
* Wireframe / contratti API disponibili

**DoD**  
* Feature su staging con test passati  
* Documentazione e telemetria  
* Demo approvata dal PO  
* Incluso nel rilascio settimanale

---
## 6. Analisi Concorrenza
| Competitor | Proposta di Valore | Funzioni Chiave | Limiti (gap opportunità) |
| --- | --- | --- | --- |
| **Calimoto** | Navigatore moto con itinerari tortuosi | Mappe offline, pianificatore web, community | Focus solo nav, contenuti editoriali scarsi, no pacchetti multimediali |
| **Kurviger** | Pianificazione strade curvy + esport GPX | Ottimizzatore percorsi, API open | UX datata, no booking/alloggi, zero storytelling |
| **REVER** | Community tracking + pianificazione | Tracking live, sfide, integrazione Sena | Molto US‑centric, paywall elevato, assenza AI ottimizzata |
| **Scenic App** | Navigatore iOS con import GPX | Download mappe offline, navigazione turn‑by‑turn | Solo iOS, mancano contenuti editoriali e booking |
| **MyRoute‑app** | Suite pianificazione multipiattaforma | Sincronizzazione dispositivi, libreria percorsi | Learning curve alta, UX generica, niente focus moto‑avventura |

> **Vantaggi competitivi di RideAtlas**: pacchetti multimediali curati da ranger, AI trip‑builder con integrazione booking, programma ricompense community.

---
## 7. Proposte Nome Prodotto
1. **RideAtlas**
2. **MotoTrails Hub**
3. **WildRoads**
4. **RouteRider**
5. **Twist&Track**

_Scegliamo quello che risuona di più con il brand positioning; RideAtlas rimane la mia preferenza per l’assonanza con mappe/atlante._

---
_Draft aggiornato in italiano. Fammi sapere correzioni, priorità o ulteriori dettagli da aggiungere._
