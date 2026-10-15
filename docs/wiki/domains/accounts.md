---
type: domain
title: "Account e profili"
description: "Identità, credenziali, ruoli e profili personali e pubblici degli autori."
status: generated
classification: candidate
sources:
  - path: "src/auth.ts"
    role: evidence
  - path: "src/middleware.ts"
    role: evidence
  - path: "prisma/schema.prisma"
    role: evidence
  - path: "src/app/api/auth"
    role: evidence
  - path: "src/app/api/profile"
    role: evidence
  - path: "src/app/api/user/avatar/route.ts"
    role: evidence
  - path: "src/app/api/user/bike-photos/route.ts"
    role: evidence
  - path: "src/app/api/user/change-password/route.ts"
    role: evidence
  - path: "src/app/api/admin/users"
    role: evidence
  - path: "src/lib/auth/password-reset.ts"
    role: evidence
  - path: "src/lib/auth/user-sync.ts"
    role: evidence
  - path: "src/lib/auth/password-validation.ts"
    role: evidence
  - path: "src/lib/actions/ranger.ts"
    role: evidence
  - path: "src/lib/social-links"
    role: evidence
  - path: "src/lib/utils/url-sanitizer.ts"
    role: evidence
  - path: "src/components/profile"
    role: evidence
  - path: "src/components/ranger"
    role: evidence
  - path: "src/tests/unit/api/auth"
    role: evidence
  - path: "src/tests/unit/api/admin/users"
    role: evidence
  - path: "src/tests/integration/api/profile"
    role: evidence
  - path: "src/tests/integration/ranger"
    role: evidence
issues:
  - code: VERIFICATION_FALLBACK_UNRELATED_USER
    summary: "GET verify-email può rispondere verified=true a un token inesistente se trova un qualsiasi altro utente già verificato; quel risultato non attesta l’identità richiesta (src/app/api/auth/verify-email/route.ts, fallback GET; test dedicato verify-email.test.ts)."
---
# Account e profili

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Visitatore e utente gestiscono identità e profilo; Sentinel gestisce altri utenti e ruoli. I candidati auth, profile, user, ranger e social-link confluiscono qui: operano sullo stesso User; profilo Ranger e social non hanno entità o ciclo di vita indipendente. Questa aggregazione è una proposta di confine, senza promozione a bounded context.

<!-- archetipo:wiki section=language -->

## Lessico

Explorer fruisce dei viaggi; Ranger crea contenuti; Sentinel amministra. Profilo privato è la vista dell’utente corrente; profilo Ranger è una proiezione pubblica di User e dei suoi viaggi pubblicati. Token di verifica, recupero password e cambio email sono distinti.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Controlla User, hash password, ruolo, bio, immagine, informazioni moto e social; gestisce Account e i modelli token di Prisma. NextAuth configura sessioni JWT pur usando PrismaAdapter. Il profilo pubblico legge Trip senza possederne pubblicazione o prezzo. Unicità dell’email nel database; name non è un identificatore univoco nello schema e la ricerca pubblica usa findFirst sul nome.

<!-- archetipo:wiki section=contracts -->

## Contratti

NextAuth espone GET/POST tramite api/auth/[...nextauth]; provider Google e Credentials in src/auth.ts. API auth per register, verify-email, resend-verification, forgot/reset/setup-password e cleanup-tokens; profile per lettura, aggiornamento, statistiche e cambio email; user per password, avatar e foto moto; admin/users per gestione Sentinel. src/types/profile.ts, src/types/user.ts e src/types/ranger.ts descrivono DTO; il parsing eseguibile è negli handler e negli schemi Zod. getRangerProfile(username) restituisce un risultato discriminato e una selezione pubblica senza email/password.

<!-- archetipo:wiki section=flows -->

## Flussi osservati

Registrazione: controlla duplicato, hash bcrypt costo 12, crea User e token, invia email; elimina utente e token se l’invio restituisce insuccesso (src/app/api/auth/register/route.ts). Con token valido e non scaduto verify-email assegna emailVerified = new Date() e cancella il token (src/app/api/auth/verify-email/route.ts, GET e POST). GET ha anche un fallback anomalo descritto nell’issue. Google assegna emailVerified nei callback/eventi di src/auth.ts.

Setup password controlla token/scadenza e password attuale nulla, poi scrive hash ed emailVerified (src/app/api/auth/setup-password/route.ts). Recupero: genera token, valida scadenza ed età minima di 30 secondi, aggiorna password e consuma il token (src/lib/auth/password-reset.ts; src/app/api/auth/reset-password/route.ts). La chiamata successiva a validatePasswordResetToken sul token già eliminato non dimostra invalidazione di tutti gli altri token.

Cambio email: verifica password e duplicati, crea EmailChangeToken; alla conferma non scaduta aggiorna email = tokenRecord.newEmail ed emailVerified e cancella token in transazione (src/app/api/profile/verify-email-change/route.ts). Profilo pubblico: nome e ruolo Ranger/Sentinel, fino a 20 viaggi Pubblicato, più recenti; isActive è assegnato true e distanceKm null in src/lib/actions/ranger.ts, senza processo autonomo di attivazione.

Ruoli: User ha default Explorer; admin/users crea un ruolo validato, admin/users/[id] scrive il ruolo richiesto dopo controlli Sentinel, vieta cambio proprio ruolo e demozione di un Sentinel esistente. Non si assume una macchina di stati sequenziale Explorer → Ranger → Sentinel.

<!-- archetipo:wiki section=code -->

## Mappa fisica

UI: src/app/auth, src/app/profile, src/components/profile e src/app/ranger/[username]. Logica: src/auth.ts, src/lib/auth, src/lib/actions/ranger.ts; social in src/lib/social-links e src/lib/utils/url-sanitizer.ts. Dati: prisma/schema.prisma. Storage per avatar; SMTP per token e notifiche di ruolo; Google per OAuth. Configurazione del ruolo nella sessione in src/auth.ts; il callback JWT rilegge il ruolo solo quando manca, quindi non prova aggiornamento immediato dei JWT già emessi dopo cambio ruolo.

<!-- archetipo:wiki section=invariants -->

## Regole applicate e limiti

Credentials richiede email verificata, password presente e bcrypt.compare; complessità: almeno 8 caratteri, maiuscola, minuscola e numero (src/lib/auth/password-validation.ts). admin/users ha controlli Sentinel negli handler; il solo middleware non sostituisce tali controlli. Profilo aggiornato sull’ID sessione; bio max 1000 e descrizione moto max 500. Le foto moto sono riservate al ruolo esattamente Ranger, massimo 10 e limitazione richieste in memoria: Sentinel riceve 403, anche se un titolo del test dice “allow”. getRangerProfile omette email nella select; tale privacy non è una garanzia di tutte le altre viste autore.

<!-- archetipo:wiki section=verification -->

## Verifiche

Letti test register/resend/setup/verify-email, password-reset, gestione utenti, cambio password, foto moto, profili e rendering pubblico. I titoli dei test sono indizi da verificare con le asserzioni: per Sentinel/foto moto l’asserzione è 403. Jest mappa admin/users/route a un mock (jest.config.js): i relativi test non dimostrano da soli l’handler reale. Le suite non sono state eseguite per questo bootstrap.

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
