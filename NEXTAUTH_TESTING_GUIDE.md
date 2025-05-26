# 🧪 Guida Test NextAuth.js Migration

## Verifica Rapida Sistema

### 1. Verifica Build e Tests
```bash
# Test build produzione
npm run build

# Test suite
npm test

# Test connessione database
npm run test:prisma
```

### 2. Verifica Server Sviluppo
```bash
# Avvia server
npm run dev

# Il server dovrebbe avviarsi su http://localhost:3000
```

### 3. Test Navigazione Routes

#### Routes Pubbliche (dovrebbero funzionare)
- ✅ `http://localhost:3000` - Homepage
- ✅ `http://localhost:3000/auth/signin` - Pagina login

#### Routes Protette (dovrebbero reindirizzare a signin)
- 🔒 `http://localhost:3000/dashboard` → redirect a `/auth/signin`
- 🔒 `http://localhost:3000/create-trip` → redirect a `/auth/signin`

### 4. Test Componenti UI

#### Navbar
- [ ] **Non autenticato**: Mostra "Accedi" e "Registrati"
- [ ] **Autenticato**: Mostra avatar utente e "Esci"

#### Homepage
- [ ] **Non autenticato**: Mostra sezione "Pronto a partire?" con CTA
- [ ] **Autenticato**: NON mostra sezione "Pronto a partire?"

### 5. Test con Credenziali Google (Quando Configurate)

#### Setup Required
1. Seguire `GOOGLE_OAUTH_SETUP.md`
2. Configurare `.env.local`:
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-here
```

#### Flusso di Test
1. **Accesso**: Click "Accedi" → Pagina signin
2. **Google OAuth**: Click "Continua con Google" → Autorizzazione Google
3. **Callback**: Redirect automatico a dashboard
4. **Sessione**: Verificare che navbar mostri avatar/nome utente
5. **Database**: Verificare creazione utente in database

### 6. Test API Routes

#### Test API Trips (Richiede Autenticazione)
```bash
# Senza autenticazione (dovrebbe fallire)
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","summary":"Test summary"}'
# Expected: 401 Unauthorized

# Con autenticazione browser (dopo login)
# Usare browser dev tools per testare con sessione attiva
```

### 7. Test Database

#### Verifica Tabelle NextAuth.js
```bash
# Apri Prisma Studio
npm run db:studio

# Verificare presenza tabelle:
# - users
# - accounts  
# - sessions
# - verificationtokens
# - trips
```

### 8. Test Middleware

#### Protezione Routes
- [ ] `/dashboard` richiede autenticazione
- [ ] `/create-trip` richiede autenticazione  
- [ ] `/api/trips` richiede autenticazione
- [ ] Route pubbliche non richiedono autenticazione

### 9. Test Errori

#### Pagine di Errore
- [ ] `/auth/error?error=AccessDenied` - Mostra errore accesso negato
- [ ] `/auth/error?error=Configuration` - Mostra errore configurazione
- [ ] Route inesistente `/nonexistent` - Mostra 404

### 10. Verifica Mobile/Responsive

#### Test Responsive
- [ ] Navbar mobile menu funziona
- [ ] Pagine signin/signout responsive
- [ ] Dashboard responsive

## 🐛 Troubleshooting Comune

### Errore: "Invalid Redirect URI"
**Soluzione**: Verificare URI callback in Google Console:
```
http://localhost:3000/api/auth/callback/google
```

### Errore: "Database Connection"
**Soluzione**: Verificare DATABASE_URL in `.env.local`

### Errore: "NextAuth Secret"
**Soluzione**: Configurare NEXTAUTH_SECRET in `.env.local`

### Test Falliscono
**Soluzione**: Verificare Jest configuration e mocks NextAuth.js

## ✅ Checklist Finale

- [ ] Build successful senza errori
- [ ] Tests passano tutti
- [ ] Server development si avvia
- [ ] Routes pubbliche accessibili
- [ ] Routes protette redirection funziona
- [ ] Navbar cambia stato based on auth
- [ ] Database connection operativa
- [ ] Prisma Studio accessibile

**Quando tutti i test passano, il sistema NextAuth.js è pronto per produzione!**
