# Sistema di Gestione Ruoli - RideAtlas

## Panoramica

Il sistema di gestione ruoli di RideAtlas implementa tre tipologie di utenti con diversi livelli di permessi:

- **Explorer** 🌍: Utenti base che possono visualizzare e partecipare ai viaggi
- **Ranger** 🗺️: Utenti avanzati che possono creare, modificare e partecipare ai viaggi
- **Sentinel** 🛡️: Amministratori con accesso completo al sistema e gestione utenti

## Architettura del Sistema

### 1. Database Schema
```prisma
enum UserRole {
  Explorer  // Utenti che fruiscono dei viaggi
  Ranger    // Utenti che possono creare e fruire dei viaggi
  Sentinel  // Ranger con poteri amministrativi
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  role          UserRole  @default(Explorer)
  // ... altri campi
}
```

### 2. Tipi TypeScript
```typescript
// src/types/profile.ts
export enum UserRole {
  Explorer = 'Explorer',
  Ranger = 'Ranger',
  Sentinel = 'Sentinel'
}

export const UserPermissions = {
  canCreateTrips: (role: UserRole) => role === UserRole.Ranger || role === UserRole.Sentinel,
  canManageUsers: (role: UserRole) => role === UserRole.Sentinel,
  canAccessAdminPanel: (role: UserRole) => role === UserRole.Sentinel,
}
```

### 3. Autenticazione (NextAuth)
```typescript
// src/auth.ts
callbacks: {
  jwt: async ({ token, user }) => {
    if (user) {
      token.role = user.role
    }
    return token
  },
  session: async ({ session, token }) => {
    if (session.user) {
      session.user.role = token.role as UserRole
    }
    return session
  }
}
```

### 4. Middleware di Protezione
```typescript
// src/middleware.ts
export default auth((req) => {
  const userRole = req.auth?.user?.role as UserRole | undefined
  
  // Route che richiedono ruolo Ranger o superiore
  const rangerRoutes = ['/create-trip', '/api/trips']
  
  // Route che richiedono ruolo Sentinel
  const sentinelRoutes = ['/admin', '/api/admin']
  
  // Controlli di accesso basati su ruoli
  // ...
})
```

## Flusso di Registrazione e Promozione

### 1. Registrazione Iniziale
- Tutti i nuovi utenti si registrano come **Explorer** (default)
- L'utente riceve un'email di verifica
- Dopo la verifica, può accedere al sistema con permessi base

### 2. Promozione a Ranger
- Solo i **Sentinel** possono promuovere utenti
- La promozione avviene tramite il pannello amministrativo
- Il cambiamento è immediato e riflesso nella sessione

### 3. Promozione a Sentinel
- Solo altri **Sentinel** possono creare nuovi Sentinel
- Richiede particolare attenzione per la sicurezza del sistema
- Il primo Sentinel viene creato tramite script dedicato

## API Endpoints

### Gestione Utenti (Solo Sentinel)

#### GET /api/admin/users
Recupera la lista degli utenti con paginazione e filtri.

**Query Parameters:**
- `page`: Numero della pagina (default: 1)
- `limit`: Utenti per pagina (default: 10)
- `search`: Ricerca per nome/email
- `role`: Filtra per ruolo specifico

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "Nome Utente",
      "email": "email@example.com",
      "role": "Explorer",
      "emailVerified": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "_count": {
        "trips": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### PATCH /api/admin/users/:id
Aggiorna il ruolo di un utente specifico.

**Body:**
```json
{
  "role": "Ranger"
}
```

**Response:**
```json
{
  "message": "Ruolo utente aggiornato con successo",
  "user": {
    "id": "user_id",
    "role": "Ranger"
  }
}
```

## Componenti UI

### 1. UserManagement
Componente principale per la gestione degli utenti nel pannello admin.

**Funzionalità:**
- Visualizzazione lista utenti con paginazione
- Ricerca per nome/email
- Filtro per ruolo
- Aggiornamento ruoli in tempo reale
- Feedback visivo per operazioni

### 2. Navbar con Controlli Ruoli
La navbar mostra link diversi in base al ruolo:

```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  // Mostrato solo per Ranger e Sentinel
  ...(canCreateTrips ? [{ name: 'Crea Viaggio', href: '/create-trip' }] : []),
  // Mostrato solo per Sentinel
  ...(canAccessAdminPanel ? [{ name: 'Amministrazione', href: '/admin' }] : []),
]
```

### 3. Dashboard con Informazioni Ruoli
Il dashboard mostra informazioni specifiche per ogni ruolo:

- **Explorer**: Viaggi disponibili e statistiche personali
- **Ranger**: Tools per creazione viaggi + analytics
- **Sentinel**: Pannello di controllo completo del sistema

## Sicurezza

### 1. Validazione Lato Server
- Tutti gli endpoint API verificano l'autenticazione
- I permessi vengono controllati ad ogni richiesta
- Validazione input con Zod

### 2. Protezione Route
- Middleware NextJS per protezione automatica
- Redirect intelligenti in base ai permessi
- Gestione errori di accesso non autorizzato

### 3. Principio di Least Privilege
- Ogni ruolo ha il minimo dei permessi necessari
- Escalation controllata dei privilegi
- Audit trail delle modifiche (futuro sviluppo)

## Testing

### 1. Unit Tests
```bash
npm test -- --testPathPattern=user-roles
```

Test per:
- Enum UserRole
- Helper UserPermissions
- Logica di validazione ruoli

### 2. Integration Tests
Test per:
- API endpoints di gestione utenti
- Middleware di protezione
- Flussi di autenticazione

### 3. E2E Tests (Futuro)
- Flusso completo di registrazione e promozione
- Test di accesso cross-ruoli
- Validazione UI based su permessi

## Scripts di Utilità

### Creazione Primo Sentinel
```bash
npm run create:sentinel
```

Crea il primo utente amministratore con:
- Email: admin@rideatlas.com
- Password temporanea: admin123456
- Ruolo: Sentinel

### Verifica Sistema
```bash
npx tsx src/scripts/verify-system.ts
```

Verifica:
- Presenza utenti nel database
- Configurazione ruoli corretta
- Stato del sistema

## Monitoraggio e Manutenzione

### Logs da Monitorare
- Tentativi di accesso non autorizzato
- Modifiche ai ruoli utente
- Errori di autenticazione

### Manutenzione Periodica
- Review periodica dei permessi Sentinel
- Pulizia utenti non verificati
- Backup delle configurazioni ruoli

## Sviluppi Futuri

### 1. Audit Trail
- Log di tutte le modifiche ai ruoli
- Tracciabilità delle operazioni admin
- Dashboard di analytics per Sentinel

### 2. Ruoli Personalizzati
- Sistema di permessi granulari
- Ruoli definiti dinamicamente
- Template di ruoli per organizzazioni

### 3. Gestione Organizzazioni
- Raggruppamento utenti per organizzazione
- Ruoli contestuali all'organizzazione
- Delega di permessi amministrativi

---

## Come Iniziare

1. **Setup Iniziale:**
   ```bash
   npx prisma db push
   npm run create:sentinel
   ```

2. **Login Primo Admin:**
   - Email: admin@rideatlas.com
   - Password: admin123456
   - ⚠️ Cambiare immediatamente la password!

3. **Gestione Utenti:**
   - Accedi a `/admin` come Sentinel
   - Usa il pannello di gestione utenti
   - Promuovi utenti secondo necessità

4. **Test del Sistema:**
   ```bash
   npm test
   npm run dev
   ```

Il sistema è ora pronto per la gestione completa dei ruoli utente! 🚀
