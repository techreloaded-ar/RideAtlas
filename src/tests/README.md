# RideAtlas Test Suite

Struttura dei test centralizzata e organizzata per il progetto RideAtlas.

## 📁 Struttura delle Cartelle

```
src/tests/
├── setup/                          # Configurazione centralizzata
│   ├── jest.setup.ts               # Mock globali e setup Jest
│   └── test-utils.tsx              # Utilities per rendering e testing
├── unit/                           # Test unitari
│   ├── components/                 # Test componenti React
│   ├── pages/                      # Test pagine Next.js
│   │   ├── HomePage.test.tsx       # Test homepage
│   │   ├── RegisterPage.test.tsx   # Test registrazione
│   │   └── SignInPage.test.tsx     # Test login
│   └── lib/                        # Test librerie e utilities
│       └── email.test.ts           # Test servizio email
├── integration/                    # Test di integrazione
│   ├── auth-flow.test.tsx          # Test flusso autenticazione completo
│   └── email-verification.test.tsx # Test verifica email
└── e2e/                           # Test end-to-end (per il futuro)
```

## 🧪 Tipologie di Test

### Test Unitari (`unit/`)
- **Pagine**: Test rendering e interazioni UI delle pagine
- **Componenti**: Test isolati dei componenti React
- **Librerie**: Test logica business e utilities

### Test di Integrazione (`integration/`)
- **Auth Flow**: Test completo del flusso di autenticazione
- **Email Verification**: Test verifica email con mock API

### Test End-to-End (`e2e/`)
- Placeholder per futuri test E2E con Playwright/Cypress

## ⚙️ Configurazione

### Setup Centralizzato
Il file `setup/jest.setup.ts` contiene:
- Mock globali per next-auth
- Mock per Next.js navigation
- Configurazione console per test più puliti
- Mock per setImmediate (compatibilità browser/Node.js)

### Test Utilities
Il file `setup/test-utils.tsx` fornisce:
- Funzioni di rendering custom
- Provider di test configurati
- Utilities riusabili per i test

## 🚀 Comandi di Test

```bash
# Esegue tutti i test
npm test

# Test in modalità watch
npm run test:watch

# Test con coverage
npm run test:coverage

# Test specifici per categoria
npm test -- --testPathPattern=unit
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=e2e
```

## 📊 Coverage Attuale

- **35 test totali** - Tutti passanti ✅
- **Test Unitari**: 18 test
  - HomePage: 2 test
  - RegisterPage: 2 test  
  - SignInPage: 12 test
  - Email Service: 4 test
- **Test Integrazione**: 15 test
  - Auth Flow: 7 test
  - Email Verification: 8 test

## 🔧 Script di Utilità

### `scripts/test-auth.js`
Script di verifica dell'ambiente di autenticazione:
- Controlla file di configurazione
- Verifica dipendenze installate
- Valida file di autenticazione
- Testa compilazione TypeScript

### `src/scripts/test-prisma.ts`
Script per testare la connessione al database Prisma.

## 📝 Best Practices

1. **Organizzazione**: Mantieni i test vicini alla loro categoria (unit/integration/e2e)
2. **Mock Centralizzati**: Usa il setup globalizzato per mock riutilizzabili
3. **Test Isolati**: Ogni test deve essere indipendente e deterministico
4. **Naming Convention**: Nome file `*.test.{ts,tsx}` per auto-discovery
5. **Coverage**: Punta per alta copertura ma privilegia qualità su quantità

## 🔄 Migrazione Completata

Questa struttura è il risultato della rifattorizzazione completa dei test RideAtlas:
- ✅ Test migrati da cartelle sparse
- ✅ Setup centralizzato e ottimizzato  
- ✅ Mock next-auth e Next.js risolti
- ✅ Test email verification completi
- ✅ Configurazione Jest ottimizzata
- ✅ File duplicati rimossi
