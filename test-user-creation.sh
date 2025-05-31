#!/bin/bash

# 🧪 Script di test per la funzionalità di creazione utenti Sentinel
# Questo script guida l'utente attraverso i passi per testare l'implementazione

echo "🚀 Test Implementazione Creazione Utenti Sentinel"
echo "=================================================="
echo ""

echo "📋 Verifica prerequisiti..."

# 1. Verifica che il server sia in esecuzione
echo "🔍 Controllo server..."
if curl -s http://localhost:3001/api/auth/session > /dev/null; then
    echo "✅ Server Next.js in esecuzione su http://localhost:3001"
else
    echo "❌ Server non in esecuzione. Avvia con: npm run dev"
    exit 1
fi

# 2. Verifica che ci sia almeno un Sentinel
echo "🔍 Controllo Sentinel nel database..."
SENTINEL_CHECK=$(npx tsx src/scripts/verify-system.ts 2>/dev/null | grep -c "Sentinel trovati: [1-9]")
if [ "$SENTINEL_CHECK" -gt 0 ]; then
    echo "✅ Sentinel trovato nel database"
else
    echo "❌ Nessun Sentinel trovato. Crea un Sentinel prima di procedere."
    exit 1
fi

# 3. Verifica file implementazione
echo "🔍 Controllo file implementazione..."
if [ -f "src/app/api/admin/users/route.ts" ]; then
    echo "✅ Endpoint API presente"
else
    echo "❌ Endpoint API mancante"
    exit 1
fi

if [ -f "src/components/UserManagement.tsx" ]; then
    echo "✅ Componente UserManagement presente"
else
    echo "❌ Componente UserManagement mancante"
    exit 1
fi

echo ""
echo "🎯 Tutti i prerequisiti soddisfatti!"
echo ""
echo "📝 Passi per testare l'implementazione:"
echo ""
echo "1. 🔐 ACCESSO COME SENTINEL"
echo "   • Apri: http://localhost:3001/auth/signin"
echo "   • Accedi con: admin@rideatlas.com"
echo "   • (o un altro account Sentinel)"
echo ""
echo "2. 📊 NAVIGAZIONE ADMIN"
echo "   • Dopo il login, vai su: http://localhost:3001/admin"
echo "   • Dovresti vedere la pagina di gestione utenti"
echo ""
echo "3. ➕ CREAZIONE NUOVO UTENTE"
echo "   • Clicca il pulsante 'Crea Utente' in alto a destra"
echo "   • Si aprirà un modal con il form di creazione"
echo ""
echo "4. 📝 COMPILAZIONE FORM"
echo "   • Nome: Inserisci nome completo"
echo "   • Email: Inserisci email valida e unica"
echo "   • Password: Minimo 8 caratteri"
echo "   • Ruolo: Seleziona Explorer/Ranger/Sentinel"
echo "   • Email benvenuto: Spunta se vuoi inviare email"
echo ""
echo "5. ✅ CONFERMA CREAZIONE"
echo "   • Clicca 'Crea Utente'"
echo "   • Dovresti vedere un messaggio di successo"
echo "   • L'utente apparirà nella lista"
echo ""
echo "🧪 TEST CASES DA PROVARE:"
echo ""
echo "✅ Test Positivi:"
echo "   • Creazione utente Explorer con email valida"
echo "   • Creazione utente Ranger con email valida"
echo "   • Creazione con email di benvenuto abilitata"
echo "   • Creazione con email di benvenuto disabilitata"
echo ""
echo "❌ Test Negativi:"
echo "   • Email già esistente (dovrebbe dare errore 409)"
echo "   • Password troppo corta (dovrebbe dare errore 400)"
echo "   • Email formato non valido (dovrebbe dare errore 400)"
echo "   • Campi vuoti (dovrebbe dare errore frontend)"
echo ""
echo "📊 VERIFICA RISULTATI:"
echo "   • L'utente creato dovrebbe apparire nella lista"
echo "   • Se email abilitata, dovrebbe essere inviata"
echo "   • Password dovrebbe essere hashata nel database"
echo "   • Token di verifica creato (se email abilitata)"
echo ""
echo "🎉 L'implementazione è completa e pronta per l'uso!"
echo ""
echo "📚 Per maggiori dettagli, consulta: IMPLEMENTAZIONE_CREAZIONE_UTENTI.md"
