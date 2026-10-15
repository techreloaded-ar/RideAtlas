---
type: context-map
title: "Mappa dei contesti"
description: "Responsabilità candidate, dipendenze osservate e confini ancora da verificare."
status: generated
sources:
  - path: "src/lib"
    role: evidence
  - path: "src/app/api"
    role: evidence
  - path: "prisma/schema.prisma"
    role: evidence
  - path: "src/middleware.ts"
    role: evidence
  - path: "src/auth.ts"
    role: evidence
---
# Mappa dei contesti

<!-- archetipo:wiki section=contexts -->

## Capacità candidate

[Account e profili](/domains/accounts.md) controlla identità e User; [viaggi](/domains/trips.md) controlla Trip, Stage e BatchJob; [acquisti](/domains/purchases.md) controlla pagamenti e diritti; [suggerimenti](/domains/recommendations.md) seleziona il catalogo; [contatti](/domains/contact.md) inoltra messaggi; [consensi](/domains/consents.md) controlla preferenze locali. Sono candidati semantici, non bounded context approvati.

<!-- archetipo:wiki section=relationships -->

## Relazioni osservate

| Consumatore | Dipendenza | Collaborazione nel codice |
|---|---|---|
| Viaggi e acquisti | Account | ID e ruolo dalla sessione; relazioni Prisma su User |
| Acquisti | Viaggi | Legge prezzo, pubblicazione e autore; restituisce diritto premium ai controlli accesso/download |
| Profili pubblici | Viaggi | getRangerProfile proietta i Trip Pubblicato dell’autore |
| Suggerimenti | Viaggi | GET interno con cookie, selezione Pubblicato e metadati GPX |
| Viaggi e profili | Storage | Factory condivisa per file e URL |
| Account e contatti | SMTP | Funzioni email condivise |
| UI media | Consensi | Legge categoria e autorizzazione locale prima dell’iframe |

Si osservano chiamate interne e database condiviso; governance e autonomia di rilascio non sono dimostrate. Tipo di relazione DDD specializzato non assegnato.

<!-- archetipo:wiki section=shared -->

## Infrastruttura condivisa

Prisma singleton, middleware/NextAuth, Zod, storage provider, email, rate limiter in memoria, componenti UI, mappe e utility comuni. Mappe e upload non possiedono un proprio ciclo commerciale. Geo è supporto ai suggerimenti, mentre social-link è parte del profilo. validation aggrega moduli con consumatori diversi, non è un dominio unico. [Mappa del codice](/engineering/code-map.md) documenta il dettaglio fisico; [sviluppo](/operations/development.md) le dipendenze operative.

<!-- archetipo:wiki section=uncertainties -->

## Confini e incertezze

Separazione logica dentro un’applicazione Next.js con schema comune: non si deducono servizi indipendenti o ownership organizzative. La futura autonomia di profili, importazione batch e algoritmi geografici richiede evidenza di lifecycle/decisioni proprie. Le issue concrete sulle pagine riguardano stati senza scritture, cancellazione batch senza effetto, verifica email non attribuibile al token, dati premium inviati prima del gate, controlli pagamento e permessi AI discordanti.

Hosting attivo, accessibilità, policy storage, riconciliazione Stripe e recupero dei job dopo riavvio non sono stati provati. Sono limiti del perimetro, non risultati negativi di test. Il [PRD](/references/prd.md) contiene ulteriori intenzioni e domande commerciali, che non cambiano i comportamenti osservati.
