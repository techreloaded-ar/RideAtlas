/* eslint-disable react/no-unescaped-entities */
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - RideAtlas',
  description: 'Informativa dettagliata sui cookie utilizzati da RideAtlas'
}

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString('it-IT')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Cosa sono i Cookie</h2>
          <p className="mb-4">
            I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo (computer, tablet, smartphone) 
            quando visiti un sito web. I cookie permettono al sito di riconoscerti durante la navigazione e nelle visite successive.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Come Utilizziamo i Cookie</h2>
          <p className="mb-4">
            RideAtlas utilizza i cookie per:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Garantire il corretto funzionamento del sito web</li>
            <li>Mantenere attiva la tua sessione di accesso</li>
            <li>Ricordare le tue preferenze</li>
            <li>Migliorare l'esperienza utente</li>
            <li>Analizzare il traffico del sito (se consenso fornito)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Tipologie di Cookie Utilizzati</h2>
          
          <h3 className="text-xl font-medium mb-3 text-green-700">3.1 Cookie Essenziali (Sempre Attivi)</h3>
          <p className="mb-4">
            Questi cookie sono necessari per il funzionamento del sito e non possono essere disabilitati. 
            Sono considerati "strettamente necessari" secondo l'Art. 6.1.f del GDPR e non richiedono consenso.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Nome Cookie</th>
                  <th className="text-left py-2 font-semibold">Finalità</th>
                  <th className="text-left py-2 font-semibold">Durata</th>
                  <th className="text-left py-2 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-mono">next-auth.session-token</td>
                  <td className="py-2">Autenticazione utente e mantenimento sessione</td>
                  <td className="py-2">30 giorni</td>
                  <td className="py-2">Proprietario</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">rideatlas-consents</td>
                  <td className="py-2">Memorizza le preferenze granulari sui cookie (formato JSON)</td>
                  <td className="py-2">365 giorni</td>
                  <td className="py-2">Proprietario</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Dettagli Tecnici - Cookie rideatlas-consents</h4>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Formato:</strong> JSON contenente le preferenze per ogni categoria di cookie
            </p>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Esempio:</strong> <code className="bg-blue-100 px-1 rounded">{`{"essential":true,"functional":false,"external-videos":true,"analytics":false}`}</code>
            </p>
            <p className="text-sm text-blue-800">
              <strong>Gestione:</strong> Puoi visualizzare e cancellare questo cookie dalle impostazioni del tuo browser
            </p>
          </div>

          <h3 className="text-xl font-medium mb-3 text-blue-700">3.2 Cookie di Preferenze (Opzionali)</h3>
          <p className="mb-4">
            Le preferenze sui cookie sono gestite tramite il cookie <code>rideatlas-consents</code> che memorizza 
            le tue scelte per ogni categoria. Questo cookie è essenziale per ricordare le tue preferenze e non richiede consenso aggiuntivo.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm italic">
              Le categorie gestite sono: Cookie Funzionali, Video Esterni (YouTube), Analytics. 
              I cookie essenziali sono sempre attivi per garantire il funzionamento del sito.
            </p>
          </div>

          <h3 className="text-xl font-medium mb-3 text-orange-700">3.3 Cookie Statistici/Analytics (Opzionali)</h3>
          <p className="mb-4">
            Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo e riportando informazioni in forma anonima.
          </p>
          
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <p className="text-sm italic">
              Al momento non utilizziamo cookie di analytics. Quando implementeremo Google Analytics o servizi simili, 
              richiederemo il tuo consenso specifico.
            </p>
          </div>

          <h3 className="text-xl font-medium mb-3 text-red-700">3.4 Cookie di Marketing (Opzionali)</h3>
          <p className="mb-4">
            Questi cookie sono utilizzati per tracciare i visitatori sui siti web per mostrare annunci rilevanti e coinvolgenti.
          </p>
          
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-sm italic">
              Al momento non utilizziamo cookie di marketing. Quando implementeremo pubblicità o remarketing, 
              richiederemo il tuo consenso specifico.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookie di Terze Parti</h2>
          
          <h3 className="text-xl font-medium mb-3">4.1 Google OAuth (Se utilizzi accesso Google)</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Servizio</th>
                  <th className="text-left py-2 font-semibold">Finalità</th>
                  <th className="text-left py-2 font-semibold">Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Google OAuth</td>
                  <td className="py-2">Autenticazione tramite account Google</td>
                  <td className="py-2">
                    <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank">
                      Privacy Policy Google
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-medium mb-3">4.2 Servizi di Hosting e CDN</h3>
          <p className="mb-4">
            Il nostro sito utilizza servizi di hosting che potrebbero impostare cookie tecnici per il funzionamento dell'infrastruttura.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Gestione delle Preferenze Cookie</h2>
          
          <h3 className="text-xl font-medium mb-3">5.1 Banner Cookie</h3>
          <p className="mb-4">
            Alla prima visita del sito, ti viene mostrato un banner che ti permette di scegliere quali tipologie di cookie accettare:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>"Accetta tutti i cookie":</strong> acconsenti all'uso di tutti i cookie</li>
            <li><strong>"Rifiuta cookie non essenziali":</strong> accetti solo i cookie essenziali</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">5.2 Modifica Preferenze</h3>
          <p className="mb-4">
            Puoi modificare le tue preferenze sui cookie in qualsiasi momento:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Dal nostro sito:</strong> accedi alle <a href="/cookie-settings" className="text-blue-600 hover:underline">impostazioni cookie</a></li>
            <li><strong>Tramite browser:</strong> cancella il cookie <code>rideatlas-consents</code> per far ricomparire il banner</li>
            <li><strong>Blocco totale:</strong> utilizza le impostazioni del browser per bloccare tutti i cookie</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm">
              <strong>Nota:</strong> Disabilitare i cookie essenziali potrebbe compromettere il funzionamento del sito, 
              in particolare le funzionalità di login e gestione account.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Come Disabilitare i Cookie nel Browser</h2>
          
          <h3 className="text-xl font-medium mb-3">6.1 Google Chrome</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Clicca sui tre punti in alto a destra → Impostazioni</li>
            <li>Scorri verso il basso e clicca su "Avanzate"</li>
            <li>Clicca su "Privacy e sicurezza" → "Impostazioni contenuti"</li>
            <li>Clicca su "Cookie" e scegli le tue preferenze</li>
          </ol>

          <h3 className="text-xl font-medium mb-3">6.2 Mozilla Firefox</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Clicca sul menu in alto a destra → Opzioni</li>
            <li>Seleziona "Privacy e sicurezza"</li>
            <li>Nella sezione "Cookie e dati dei siti web" scegli le tue preferenze</li>
          </ol>

          <h3 className="text-xl font-medium mb-3">6.3 Safari</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Clicca su Safari → Preferenze</li>
            <li>Clicca sulla scheda "Privacy"</li>
            <li>Nella sezione "Cookie e dati dei siti web" scegli le tue opzioni</li>
          </ol>

          <p className="mb-4">
            Per istruzioni dettagliate su altri browser, visita{' '}
            <a href="https://www.allaboutcookies.org/manage-cookies/" className="text-blue-600 hover:underline" target="_blank">
              www.allaboutcookies.org
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Base Giuridica</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cookie essenziali:</strong> Legittimo interesse per il funzionamento del sito (Art. 6.1.f GDPR)</li>
            <li><strong>Cookie non essenziali:</strong> Consenso dell'utente (Art. 6.1.a GDPR)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Aggiornamenti della Cookie Policy</h2>
          <p className="mb-4">
            Questa Cookie Policy può essere aggiornata periodicamente per riflettere cambiamenti nei cookie utilizzati 
            o per altri motivi operativi, legali o normativi.
          </p>
          <p>
            Ti informeremo di eventuali modifiche sostanziali tramite avviso sul sito.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contatti</h2>
          <p className="mb-4">
            Per domande riguardo questa Cookie Policy, contattaci:
          </p>
          <ul className="list-none pl-0">
            <li><strong>Email:</strong> privacy@rideatlas.com</li>
            <li><strong>Privacy Policy completa:</strong> <a href="/privacy-policy" className="text-blue-600 hover:underline">/privacy-policy</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}