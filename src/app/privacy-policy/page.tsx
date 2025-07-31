/* eslint-disable react/no-unescaped-entities */
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - RideAtlas',
  description: 'Informativa sulla privacy e protezione dei dati personali di RideAtlas'
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString('it-IT')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Titolare del Trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati è <strong>RideAtlas</strong>.
          </p>
          <p>
            Per qualsiasi comunicazione relativa al trattamento dei dati personali è possibile contattarci all'indirizzo email: <strong>privacy@rideatlas.com</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Tipologia di Dati Raccolti</h2>
          <h3 className="text-xl font-medium mb-3">2.1 Dati forniti dall'utente</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Dati di registrazione:</strong> nome, email, password (crittografata)</li>
            <li><strong>Dati del profilo:</strong> foto profilo, preferenze personali</li>
            <li><strong>Contenuti caricati:</strong> itinerari, foto, file GPX, descrizioni viaggi</li>
            <li><strong>Comunicazioni:</strong> messaggi inviati tramite i servizi della piattaforma</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">2.2 Dati raccolti automaticamente</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Dati di navigazione:</strong> indirizzo IP, browser utilizzato, pagine visitate</li>
            <li><strong>Cookie tecnici:</strong> sessione di autenticazione, preferenze utente</li>
            <li><strong>Log del server:</strong> timestamp accessi, errori tecnici</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Finalità e Base Giuridica del Trattamento</h2>
          
          <h3 className="text-xl font-medium mb-3">3.1 Esecuzione del contratto (Art. 6.1.b GDPR)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Creazione e gestione dell'account utente</li>
            <li>Erogazione dei servizi della piattaforma</li>
            <li>Gestione degli itinerari e contenuti caricati</li>
            <li>Comunicazioni relative al servizio</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">3.2 Obbligo legale (Art. 6.1.c GDPR)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Conservazione dati contabili e fiscali</li>
            <li>Adempimenti in materia di sicurezza informatica</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">3.3 Consenso (Art. 6.1.a GDPR)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Invio newsletter e comunicazioni marketing (solo se consenso specifico)</li>
            <li>Utilizzo cookie non essenziali</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">3.4 Legittimo interesse (Art. 6.1.f GDPR)</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Sicurezza informatica e prevenzione frodi</li>
            <li>Miglioramento dei servizi offerti</li>
            <li>Gestione reclami e supporto clienti</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Conservazione dei Dati</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Dati dell'account:</strong> fino alla cancellazione dell'account</li>
            <li><strong>Contenuti pubblicati:</strong> fino alla rimozione da parte dell'utente o cancellazione account</li>
            <li><strong>Dati di navigazione:</strong> massimo 12 mesi</li>
            <li><strong>Backup di sicurezza:</strong> massimo 30 giorni dalla cancellazione</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Comunicazione e Trasferimento Dati</h2>
          <p className="mb-4">
            I tuoi dati personali non verranno comunicati a terzi, salvo nei seguenti casi:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Fornitori di servizi tecnici:</strong> hosting, backup, servizi cloud (con adeguate garanzie contrattuali)</li>
            <li><strong>Autorità competenti:</strong> solo su richiesta delle autorità giudiziarie o di polizia</li>
            <li><strong>Servizi di pagamento:</strong> solo per transazioni e-commerce future</li>
          </ul>
          <p>
            <strong>Trasferimenti extra-UE:</strong> Eventuali trasferimenti sono effettuati solo verso paesi con decisione di adeguatezza o con adeguate garanzie (Standard Contractual Clauses).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. I Tuoi Diritti</h2>
          <p className="mb-4">
            In qualità di interessato, hai diritto a:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Accesso (Art. 15 GDPR):</strong> ottenere conferma del trattamento e copia dei dati</li>
            <li><strong>Rettifica (Art. 16 GDPR):</strong> correzione di dati inesatti o incompleti</li>
            <li><strong>Cancellazione (Art. 17 GDPR):</strong> rimozione dei dati quando non più necessari</li>
            <li><strong>Limitazione (Art. 18 GDPR):</strong> sospensione del trattamento in specifici casi</li>
            <li><strong>Portabilità (Art. 20 GDPR):</strong> ricevere i dati in formato strutturato</li>
            <li><strong>Opposizione (Art. 21 GDPR):</strong> opporsi al trattamento per legittimo interesse</li>
            <li><strong>Revoca consenso:</strong> ritirare il consenso in qualsiasi momento</li>
          </ul>
          
          <p className="mb-4">
            Per esercitare i tuoi diritti, contattaci a: <strong>privacy@rideatlas.com</strong>
          </p>
          
          <p className="mb-4">
            <strong>Diritto di reclamo:</strong> Puoi presentare reclamo al Garante per la Protezione dei Dati Personali: 
            <a href="https://www.garanteprivacy.it" className="text-blue-600 hover:underline ml-1">www.garanteprivacy.it</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Sicurezza dei Dati</h2>
          <p className="mb-4">
            Adottiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati personali:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Crittografia delle password e dati sensibili</li>
            <li>Connessioni protette HTTPS</li>
            <li>Backup regolari e sicuri</li>
            <li>Accesso limitato ai dati solo al personale autorizzato</li>
            <li>Monitoraggio costante della sicurezza</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Cookie</h2>
          <p className="mb-4">
            Il nostro sito utilizza cookie per garantire il corretto funzionamento e migliorare l'esperienza utente.
            Per informazioni dettagliate sui cookie utilizzati, consulta la nostra{' '}
            <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Minori</h2>
          <p>
            I nostri servizi non sono destinati a minori di 16 anni. Non raccogliamo consapevolmente dati personali di minori. 
            Se vieni a conoscenza che un minore ha fornito dati personali, ti preghiamo di contattarci immediatamente.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Modifiche alla Privacy Policy</h2>
          <p>
            Questa Privacy Policy può essere aggiornata periodicamente. Ti informeremo di eventuali modifiche sostanziali 
            tramite avviso sul sito o email. Ti invitiamo a consultare regolarmente questa pagina.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contatti</h2>
          <p>
            Per qualsiasi domanda relativa a questa Privacy Policy o al trattamento dei tuoi dati personali:
          </p>
          <ul className="list-none pl-0 mt-4">
            <li><strong>Email:</strong> privacy@rideatlas.com</li>
            <li><strong>Responsabile Privacy:</strong> privacy@rideatlas.com</li>
          </ul>
        </section>
      </div>
    </div>
  )
}