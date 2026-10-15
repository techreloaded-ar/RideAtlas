---
type: domain
title: "Consensi nel browser"
description: "Preferenze locali per categorie cookie e visualizzazione dei video esterni."
status: generated
classification: candidate
sources:
  - path: "src/lib/ui/cookie-consent.ts"
    role: evidence
  - path: "src/components/ui/CookieBanner.tsx"
    role: evidence
  - path: "src/components/ui/VideoConsentBanner.tsx"
    role: evidence
  - path: "src/components/ui/UnifiedMediaGallery.tsx"
    role: evidence
  - path: "src/app/cookie-settings/page.tsx"
    role: evidence
  - path: "src/tests/unit/lib/ui/cookie-consent.test.ts"
    role: evidence
  - path: "src/tests/unit/components/UnifiedMediaGallery.gdpr.test.tsx"
    role: evidence
---
# Consensi nel browser

<!-- archetipo:wiki section=purpose -->

## Scopo e attori

Il visitatore decide categorie opzionali e caricamento dei video. Capacità aggiuntiva emersa dal codice fuori dai cluster deterministici: possiede preferenze e decisioni proprie, quindi resta separata dai contatti e dal profilo account.

<!-- archetipo:wiki section=language -->

## Lessico

Categorie essential, functional, external-videos, analytics; consenso persistente, consenso per singolo video, reset e listener.

<!-- archetipo:wiki section=ownership -->

## Dati e decisioni

Cookie rideatlas-consents e stato del singleton cookieConsentService nel browser; nessuna tabella o sincronizzazione account. La decisione di caricare l’iframe viene applicata nella galleria; le pagine legali sono contenuto informativo, non prova di conformità.

<!-- archetipo:wiki section=contracts -->

## Contratti

hasConsent, getAllConsents, setConsent, setAllConsents, resetConsents e onConsentChange in src/lib/ui/cookie-consent.ts. Banner e cookie-settings gestiscono scelte; VideoConsentBanner offre anche scelta limitata al video corrente.

<!-- archetipo:wiki section=flows -->

## Scritture osservate

Nessuna enum di ciclo di vita. Il default ha essential=true e categorie opzionali false. setConsent scrive consents[category]=granted dopo guardia che impedisce essential=false; setAllConsents forza essential=true; entrambi salvano cookie e notificano listener. resetConsents assegna DEFAULT_CONSENTS, elimina cookie e notifica (src/lib/ui/cookie-consent.ts). La galleria può mantenere autorizzazione locale di un solo video senza rendere persistente l’intera categoria.

<!-- archetipo:wiki section=code -->

## Mappa fisica

Servizio src/lib/ui/cookie-consent.ts; componenti CookieBanner, VideoConsentBanner e UnifiedMediaGallery in src/components/ui; UI preferenze src/app/cookie-settings. Cookie browser con SameSite=Lax, Secure su HTTPS e scadenza configurata 365 giorni.

<!-- archetipo:wiki section=invariants -->

## Regole e limiti

Le API pubbliche di modifica impediscono la disattivazione degli essenziali. Il caricamento iniziale fonde JSON del cookie con default senza una validazione di schema completa; non si assume che ogni dato nel cookie sia valido. Il controllo video non prova il consenso di tutte le richieste esterne del sito, delle mappe o dei provider.

<!-- archetipo:wiki section=verification -->

## Verifiche

Letti servizio, percorso galleria e test cookie-consent/UnifiedMediaGallery.gdpr per default, salvataggio, reset, listener, scelta singolo video e caricamento iframe. Nessun audit legale o prova di rete browser effettuato.

La capacità partecipa alla [mappa dei contesti](/architecture/context-map.md) e alla [mappa del codice](/engineering/code-map.md).
