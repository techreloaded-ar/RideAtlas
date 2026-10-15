---
type: overview
title: "Panoramica di RideAtlas"
description: "Scopo del sistema, attori, stack osservato e limiti della mappatura."
status: generated
sources:
  - path: "src/app"
    role: evidence
  - path: "src/lib"
    role: evidence
  - path: "prisma/schema.prisma"
    role: evidence
  - path: "package.json"
    role: evidence
  - path: "src/auth.ts"
    role: evidence
---
# Panoramica di RideAtlas

## Sistema osservato

RideAtlas espone un catalogo di viaggi motociclistici con tappe, media e GPX; permette creazione editoriale, acquisto per viaggio, profili degli autori e suggerimenti AI ancorati al catalogo. Le responsabilità sono descritte nella [mappa dei contesti](/architecture/context-map.md); l’accesso ai file segue [acquisti e premium](/domains/purchases.md), con le differenze documentate nelle issue.

## Attori

Visitatore consulta pubblicati, profili e contatti. Explorer è un utente fruitore/acquirente; Ranger crea e modifica propri viaggi; Sentinel amministra utenti, contenuti, acquisti e accede alla UI AI. I controlli effettivi dipendono dall’handler: non assumere una gerarchia di permessi uniforme in ogni punto.

## Stack e integrazioni

Dal manifest: Next.js ^15.4.6, React ^18.2.0, TypeScript, Tailwind, NextAuth 5 beta, Prisma 6 e PostgreSQL. Sono vincoli dichiarati dal manifest, non versioni misurate dell’ambiente distribuito. Route Handlers e Server Components convivono con UI client. Integrazioni implementate: Google OAuth, Stripe, Nodemailer SMTP, storage Vercel Blob/S3/CloudFront, Leaflet e chiamate OpenRouter. La presenza del provider non dimostra che sia attivo in produzione.

## Perimetro e attendibilità

Bootstrap sul working tree con revisione Git iniziale 5d708c6677aa1c288489b86d7b51889da413afed, 15 ottobre 2026. Inventario CLI: 434 file, con radici fisiche `.` e `src`; `src` è segnalato come campione rappresentativo. Sono stati letti schema, manifest, configurazioni non segrete, contratti e percorsi server principali; UI e test sono stati esaminati per collegamenti, comandi e asserzioni rappresentative. La [mappa fisica](/engineering/code-map.md) rende esplicita la copertura dei candidati e il trattamento dell’infrastruttura.

Esclusioni dell’ispezione: metadati repository, dipendenze e build, radice Wiki configurata. Non sono stati letti segreti, interrogati dati di produzione, eseguite suite applicative o chiamati servizi esterni. La validazione bootstrap verifica struttura e copertura, non certifica i flussi distribuiti. Nessun confine è promosso oltre candidate e tutte le pagine restano generated.

## Intento documentato

Il [PRD originale conservato](/references/prd.md) attribuisce al prodotto target over 50, ambizioni e sviluppi ciclistici. Sono intenzioni del documento: nello schema corrente non esistono campi mezzo/tipo bicicletta; il codice letto applica acquisti per singolo viaggio e non implementa un modello di abbonamento o payout ai Ranger. Nessuna decisione architetturale viene inferita dalla sola forma del codice.
