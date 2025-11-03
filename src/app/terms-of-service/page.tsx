/* eslint-disable react/no-unescaped-entities */
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termini di Servizio - RideAtlas',
  description: 'Termini e condizioni per l\'utilizzo della piattaforma RideAtlas e acquisto viaggi'
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Termini di Servizio</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>Ultimo aggiornamento:</strong> 20/10/2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Accettazione dei termini</h2>
          <p className="mb-4">
            RideAtlas è un prodotto sviluppato da Agile Reloaded S.r.l.
          </p>
          <p className="mb-4">
            L’accettazione dei presenti termini e della licenza d’uso avviene esclusivamente <strong>al momento dell’acquisto di una traccia GPX o di altri contenuti digitali</strong>.
            La semplice registrazione o navigazione sulla piattaforma non comporta accettazione dei termini, che divengono vincolanti solo al completamento dell’acquisto.
          </p>
          <p>
            I presenti termini costituiscono un accordo legalmente vincolante tra Agile Reloaded S.r.l., titolare della piattaforma RideAtlas, e l’utilizzatore dei servizi.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Premessa fondamentale – natura del servizio</h2>
          <p className="mb-4">
            RideAtlas è una piattaforma per la vendita <strong>di contenuti digitali informativi</strong> (file GPX e altri contenuti digitali) a scopo informativo.
            <strong>Non vengono forniti servizi di guida, accompagnamento, consulenza turistica o raccomandazioni operative.</strong>
            L’acquisto e l’accesso ai file GPX non implicano alcuna verifica su capacità, età, abilitazioni o idoneità dell’acquirente.
            L’uso dei contenuti è sotto la <strong>completa ed esclusiva responsabilità dell’utente finale.</strong>
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Definizioni</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Piattaforma:</strong> il sito web <a href="http://www.rideatlas.it">www.rideatlas.it</a> e le relative funzionalità web.</li>
            <li><strong>Redazione:</strong> team di esperti che si occupano della cura dei contenuti informativi della piattaforma.</li>
            <li><strong>Contenuti digitali:</strong> file GPX, descrizioni, immagini e materiali informativi acquistabili.</li>
            <li><strong>Utente:</strong> chi accede all’applicazione RideAtlas o acquista/usa i contenuti digitali.</li>
            <li><strong>Ranger:</strong> motociclisti esperti che collaborano con la redazione di RideAtlas e hanno testato i viaggi e prodotto i vari contenuti digitali, fra cui le tracce GPX, le foto e video.</li>
            <li><strong>Licenza:</strong> diritto d’uso personale, non esclusivo e non trasferibile dei contenuti acquistati.</li>
          </ul>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Descrizione del servizio</h2>
          <p className="mb-4">
            RideAtlas consente agli utenti di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>acquistare e scaricare viaggi e tracce GPX realizzati dai ranger;</li>
            <li>accedere a informazioni su percorsi, punti di interesse e soste consigliate;</li>
            <li>gestire i contenuti acquistati attraverso la propria area utente sull’applicazione web.</li>
          </ul>
          <p>
            I servizi possono essere modificati, sospesi o interrotti con ragionevole preavviso.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prodotti e condizioni commerciali</h2>
          
          <h3 className="text-xl font-medium mb-3">5.1 Oggetto del contratto</h3>
          <p className="mb-4">
            L’acquisto dei contenuti digitali <strong>non trasferisce la proprietà</strong>, ma solo una <strong>licenza d’uso personale e limitata</strong>.
            La licenza d’uso consente di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>scaricare e conservare i contenuti per uso personale;</li>
            <li>caricare i file GPX su dispositivi GPS di proprietà;</li>
            <li>effettuare copie di backup personali.</li>
          </ul>
          <p className="mb-4">
            È espressamente vietato:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>rivendere o redistribuire i contenuti;</li>
            <li>condividere i file con terzi;</li>
            <li>utilizzare i contenuti per scopi commerciali;</li>
            <li>modificare i contenuti per creare prodotti derivati.</li>
          </ul>
          <p>
            Accedendo o utilizzando l’applicazione RideAtlas, l’utente accetta integralmente i presenti termini.
          </p>

          <h3 className="text-xl font-medium mb-3">5.2 Processo di acquisto e pagamenti</h3>
          <p className="mb-4">
            Gli acquisti avvengono tramite piattaforme di pagamento sicure (es. Stripe e PayPal).
            I prezzi sono espressi in euro (€) e includono IVA, salvo diversa indicazione.
            Le modifiche di prezzo non si applicano retroattivamente.
          </p>

          <h3 className="text-xl font-medium mb-3">5.3 Diritto di recesso</h3>
          <p className="mb-4">
            Ai sensi dell’art. 59, comma 1, lettera m) del codice del consumo, <strong>il diritto di recesso è escluso</strong> per contenuti digitali forniti su supporto non materiale una volta iniziata la fornitura.
            Procedendo con l’acquisto, l’utente <strong>richiede espressamente</strong> che la fornitura dei contenuti digitali inizi immediatamente e <strong>accetta di perdere il diritto di recesso</strong> previsto dall’art. 52 del Codice del Consumo.
            L’utente <strong>acconsente all’esecuzione immediata</strong> e <strong>rinuncia al diritto di recesso.</strong>
          </p>
          <p className="mb-4">
            Rimborsi eccezionali possono essere concessi in caso di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>impossibilità tecnica di accedere ai contenuti acquistati;</li>
            <li>file sostanzialmente difforme o corrotto;</li>
            <li>doppio addebito per errore del sistema.</li>
          </ul>
          <p>
            Eventuali rimborsi seguono le policy della piattaforma di pagamento utilizzata.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Natura dei contenuti</h2>

          <h3 className="text-xl font-medium mb-3">6.1 Carattere informativo</h3>
          <p className="mb-4">
            I contenuti sono forniti <strong>a titolo informativo e orientativo</strong> e <strong>non costituiscono istruzioni operative o garanzie di sicurezza.</strong>
            RideAtlas non garantisce l’attualità, la percorribilità o la sicurezza dei percorsi.
          </p>

          <h3 className="text-xl font-medium mb-3">6.2 Certificazione ranger</h3>
          <p className="mb-4">
            I percorsi “certificati ranger” attestano che il percorso è stato completato e testato, ma <strong>non garantiscono la sicurezza o la percorribilità attuale.</strong>
          </p>

          <h3 className="text-xl font-medium mb-3">6.3 Verifiche e responsabilità dell’utente</h3>
          <p>
            RideAtlas <strong>non effettua verifiche in tempo reale</strong> sulle condizioni dei percorsi.
            È responsabilità dell’utente valutare la propria capacità, le condizioni del veicolo e del percorso.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Limitazioni di responsabilità</h2>

          <h3 className="text-xl font-medium mb-3">7.1 Esclusioni generali</h3>
          <p className="mb-4">
            Il fornitore <strong>non sarà responsabile</strong> per danni, incidenti, perdite di dati, guasti o conseguenze derivanti dall’uso dei contenuti.
            L’utente riconosce che la guida motociclistica comporta <strong>rischi intrinseci</strong> e se ne assume la piena responsabilità.
          </p>

          <h3 className="text-xl font-medium mb-3">7.2 Esclusione specifica</h3>
          <p className="mb-4">
            RideAtlas <strong>non è responsabile</strong> per:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>danni a persone, veicoli o cose derivanti dall’uso delle tracce;</li>
            <li>infrazioni al codice della strada o normative locali;</li>
            <li>multe, sequestri, o infortuni derivanti da percorsi inadeguati.</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">7.3 Assunzione di rischio e rinuncia ad azioni legali</h3>
          <p className="mb-4">
            L’utente accetta di utilizzare i contenuti <strong>a proprio rischio e pericolo</strong>, rinunciando espressamente a qualsiasi azione o pretesa verso Agile Reloaded S.r.l.
          </p>

          <h3 className="text-xl font-medium mb-3">7.4 Fornitura “as is”</h3>
          <p className="mb-4">
            RideAtlas e i suoi contenuti sono forniti <strong>“così come sono” (“as is”)</strong> e <strong>“secondo disponibilità” (“as available”)</strong>, senza garanzie espresse o implicite.
            La responsabilità complessiva del fornitore non potrà superare il prezzo pagato per il contenuto.
          </p>

          <h3 className="text-xl font-medium mb-3">7.5 Indennizzo e manleva</h3>
          <p className="mb-4">
            L'utente si impegna a manlevare e tenere indenne <strong>Agile Reloaded S.r.l.</strong>, i suoi dipendenti, collaboratori e partner da qualsiasi richiesta, reclamo o pretesa di terzi derivante dall'uso dei contenuti, incluse spese legali e risarcimenti.
          </p>

          <h3 className="text-xl font-medium mb-3">7.6 Forza maggiore</h3>
          <p>
            Agile Reloaded S.r.l. non sarà responsabile per inadempimenti dovuti a cause di forza maggiore quali interruzioni di servizio, attacchi informatici, eventi naturali o altre circostanze al di fuori del proprio controllo.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Garanzie sui contenuti digitali</h2>
          <p className="mb-4">
            I contenuti venduti:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>corrispondono alle descrizioni fornite;</li>
            <li>sono tecnicamente accessibili e funzionanti;</li>
            <li>includono i materiali descritti nel prodotto.</li>
          </ul>
          <p>
            Non viene garantita l’accuratezza geografica o la sicurezza dei percorsi.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Proprietà intellettuale e dati</h2>
          <p className="mb-4">
            Tutti i contenuti, marchi e testi presenti su RideAtlas sono di proprietà di <strong>Agile Reloaded S.r.l.</strong> o dei rispettivi autori. Ogni uso non autorizzato è vietato.
          </p>
          <p>
            Il trattamento dei dati personali è disciplinato dalla separata <strong>Informativa Privacy</strong> disponibile su <a href="http://www.rideatlas.it/privacy-policy">www.rideatlas.it/privacy-policy</a>, conforme al <strong>Regolamento UE 2016/679 (GDPR)</strong>.
          </p>
          <p>
            La gestione dei cookie è descritta nella nostra <a href="/cookie-policy">Cookie Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Risoluzione delle controversie</h2>

          <h3 className="text-xl font-medium mb-3">10.1 Mediazione e ODR</h3>
          <p className="mb-4">
            Le parti si impegnano a tentare una risoluzione amichevole mediante mediazione.
            Per acquisti online, è disponibile la piattaforma ODR europea: <a href="https://ec.europa.eu/consumers/odr/">https://ec.europa.eu/consumers/odr/</a>
          </p>

          <h3 className="text-xl font-medium mb-3">10.2 Legge applicabile e foro competente</h3>
          <p>
            Il contratto è regolato dalla <strong>legge italiana</strong>.
            Il foro competente è quello di residenza del consumatore o la sede legale di Agile Reloaded S.r.l.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Clausole finali</h2>

          <h3 className="text-xl font-medium mb-3">11.1 Validità parziale</h3>
          <p className="mb-4">
            Se una disposizione è ritenuta invalida, le restanti restano efficaci.
          </p>

          <h3 className="text-xl font-medium mb-3">11.2 Modifiche ai termini</h3>
          <p className="mb-4">
            Agile Reloaded S.r.l. può modificare i presenti termini con preavviso pubblicato sull’applicazione web RideAtlas.
          </p>

          <h3 className="text-xl font-medium mb-3">11.3 Integralità dell’accordo</h3>
          <p>
            Il presente documento costituisce l’intero accordo tra le parti.
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contatti</h2>
          <p className="mb-4">
            📧 <strong>Email:</strong> info@rideatlas.it<br />
            🌐 <strong>Sito:</strong> <a href="http://www.rideatlas.it">www.rideatlas.it</a>
          </p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Dichiarazione finale di accettazione</h2>
          <p className="mb-4">
            Procedendo con l'acquisto, l'utente dichiara di aver letto, compreso e accettato integralmente i presenti Termini di Servizio. Ai sensi e per gli effetti degli articoli 1341 e 1342 del Codice Civile,  l'utente dichiara di aver preso specifica conoscenza e di approvare  espressamente le seguenti clausole vessatorie:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Art. 5.1 - Limitazioni della licenza d'uso e divieti</li>
            <li>Art. 5.3 - Esclusione del diritto di recesso per contenuti digitali</li>
            <li>Art. 6 - Natura meramente informativa dei contenuti e assenza di garanzie</li>
            <li>Art. 7.1 - Esclusioni generali di responsabilità</li>
            <li>Art. 7.2 - Esclusioni specifiche di responsabilità per danni</li>
            <li>Art. 7.3 - Assunzione del rischio e rinuncia ad azioni legali</li>
            <li>Art. 7.4 - Fornitura dei servizi "as is" e "as available"</li>
            <li>Art. 7.5 - Obbligo di indennizzo e manleva</li>
            <li>Art. 10.2 - Legge applicabile e foro competente</li>
          </ul>
          <p className="mb-4">
            L'utente riconosce inoltre che:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>I contenuti acquistati sono di natura puramente informativa</li>
            <li>L'utilizzo è a proprio esclusivo rischio e pericolo</li>
            <li>Agile Reloaded S.r.l. non effettua verifiche sull'idoneità dell'acquirente</li>
            <li>La responsabilità massima è limitata al prezzo del singolo contenuto acquistato</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
