---
type: domain
title: "Contatti"
description: "Validazione e inoltro email dei messaggi dal modulo pubblico."
status: generated
classification: candidate
sources:
  - path: "src/app/api/contact/route.ts"
    role: evidence
  - path: "src/app/contatti"
    role: evidence
  - path: "src/schemas/contact.ts"
    role: evidence
  - path: "src/lib/core/email.ts"
    role: evidence
  - path: "src/tests/unit/api/contact/route.test.ts"
    role: evidence
---
# Contatti

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Un visitatore invia un messaggio al recapito di assistenza. contact e contatti sono API e UI dello stesso caso d’uso, quindi un solo candidato semantico.

<!-- archetipo:wiki section=language -->

## Lessico

nome, email, messaggio, success, simulated. Il risultato simulato è distinto dalla consegna esterna.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Possiede validazione della richiesta e risultato dell’inoltro. Non persiste ticket, conversazioni o stato di lavorazione in Prisma. Il destinatario attuale è info@rideatlas.it nel servizio email.

<!-- archetipo:wiki section=contracts -->

## Contratti

POST api/contact accetta JSON conforme a contactFormSchema: nome 2–100, email valida normalizzata, messaggio 10–2000. Risponde success/message/simulated; errori validazione 400, invio/processing 500.

<!-- archetipo:wiki section=flows -->

## Flusso osservato

src/app/contatti/page.tsx usa react-hook-form e zodResolver e invia JSON a /api/contact. L’handler ripete safeParse sul server, chiama sendContactEmail e propaga il risultato. src/lib/core/email.ts usa Nodemailer: senza trasporto configurato restituisce success=true, simulated=true solo in development; negli altri ambienti restituisce errore. Nessun ciclo di vita ticket o prova di ricezione umana.

<!-- archetipo:wiki section=code -->

## Mappa fisica

UI src/app/contatti/page.tsx e layout.tsx; handler src/app/api/contact/route.ts; schema src/schemas/contact.ts; integrazione SMTP in src/lib/core/email.ts e variabili nominate in .env.example.

<!-- archetipo:wiki section=invariants -->

## Regole e limiti

Il server applica formato e lunghezze e usa replyTo del mittente; non richiede autenticazione. Una risposta simulated non dimostra consegna SMTP. Nessun rate limit applicato nella route letta; non estendere a questa API il limitatore usato per foto moto.

<!-- archetipo:wiki section=verification -->

## Verifiche

src/tests/unit/api/contact/route.test.ts copre invio, simulated, campi invalidi, fallimenti e JSON; letto, non eseguito. La consegna SMTP reale resta fuori dal bootstrap.

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
