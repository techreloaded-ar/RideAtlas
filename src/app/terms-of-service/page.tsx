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
          <strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString('it-IT')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Accettazione dei Termini</h2>
          <p className="mb-4">
            Benvenuto su RideAtlas. Utilizzando i nostri servizi e acquistando i nostri prodotti, 
            accetti di rispettare e di essere vincolato da questi Termini di Servizio ("Termini"). 
            Se non accetti questi Termini, ti preghiamo di non utilizzare i nostri servizi.
          </p>
          <p>
            Questi Termini costituiscono un accordo legalmente vincolante tra te e RideAtlas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Descrizione del Servizio</h2>
          <p className="mb-4">
            RideAtlas è una piattaforma online che offre:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Creazione e condivisione di itinerari per viaggi in moto</li>
            <li>Gestione di contenuti multimediali (foto, file GPX)</li>
            <li>Strumenti per la pianificazione di viaggi</li>
            <li>Community per appassionati di viaggi in moto</li>
            <li>Costruttore di percorsi assistito da intelligenza artificiale</li>
            <li><strong>Vendita di viaggi completi</strong> con descrizioni dettagliate e tracce GPX di tutte le tappe</li>
          </ul>
          <p>
            I servizi possono essere modificati, sospesi o interrotti in qualsiasi momento con ragionevole preavviso.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Prodotti e Servizi in Vendita</h2>
          
          <h3 className="text-xl font-medium mb-3">3.1 Viaggi Completi</h3>
          <p className="mb-4">
            RideAtlas vende <strong>viaggi completi</strong> che includono:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Descrizione dettagliata dell'intero itinerario</li>
            <li>Tracce GPX di tutte le tappe che compongono il viaggio</li>
            <li>Informazioni su punti di interesse, soste e raccomandazioni</li>
            <li>Materiale multimediale (foto, video) quando disponibile</li>
            <li>Istruzioni e consigli per la percorrenza</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">3.2 Natura del Prodotto</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-sm">
              <strong>Importante:</strong> I viaggi venduti sono <strong>prodotti digitali informativi</strong> 
              che forniscono percorsi, tracce GPS e informazioni turistiche. Non includono:
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm">
              <li>Prenotazioni alberghiere</li>
              <li>Servizi di trasporto</li>
              <li>Guide fisiche o accompagnatori</li>
              <li>Assicurazioni di viaggio</li>
              <li>Noleggio mezzi o attrezzature</li>
            </ul>
          </div>

          <h3 className="text-xl font-medium mb-3">3.3 Vendita per Viaggio Completo</h3>
          <p className="mb-4">
            I viaggi sono venduti esclusivamente nella loro <strong>interezza</strong>. 
            Non è possibile acquistare singole tappe o porzioni di un itinerario.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Processo di Acquisto</h2>
          
          <h3 className="text-xl font-medium mb-3">4.1 Ordini e Prezzi</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Tutti i prezzi sono espressi in Euro (€) e includono IVA</li>
            <li>I prezzi possono variare senza preavviso</li>
            <li>Il prezzo applicabile è quello visualizzato al momento dell'ordine</li>
            <li>Ci riserviamo il diritto di correggere errori di prezzo evidenti</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">4.2 Conferma Ordine</h3>
          <p className="mb-4">
            Riceverai una conferma d'ordine via email contenente:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Dettagli del viaggio acquistato</li>
            <li>Prezzo pagato</li>
            <li>Numero dell'ordine</li>
            <li>Istruzioni per l'accesso ai contenuti</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">4.3 Pagamenti</h3>
          <p className="mb-4">
            Accettiamo i seguenti metodi di pagamento:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Carte di credito/debito (Visa, Mastercard, American Express)</li>
            <li>PayPal</li>
            <li>Altri metodi di pagamento specificati al checkout</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Consegna e Accesso ai Contenuti</h2>
          
          <h3 className="text-xl font-medium mb-3">5.1 Consegna Digitale</h3>
          <p className="mb-4">
            Trattandosi di prodotti digitali, la consegna avviene <strong>immediatamente</strong> 
            dopo la conferma del pagamento tramite:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Accesso diretto ai contenuti dal tuo account</li>
            <li>Download dei file GPX e materiali correlati</li>
            <li>Link di accesso inviati via email</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">5.2 Requisiti Tecnici</h3>
          <p className="mb-4">
            Per utilizzare i contenuti acquistati necessiti di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Dispositivo GPS o smartphone con app di navigazione</li>
            <li>Capacità di aprire file GPX</li>
            <li>Connessione internet per il download iniziale</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Diritto di Recesso (Art. 59-67 Codice del Consumo)</h2>
          
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <h3 className="text-xl font-medium mb-3">6.1 Limitazioni per Contenuti Digitali</h3>
            <p className="text-sm mb-2">
              <strong>ATTENZIONE:</strong> In conformità all'Art. 59 comma 1, lettera m) del Codice del Consumo, 
              il diritto di recesso è <strong>escluso</strong> per:
            </p>
            <ul className="list-disc pl-6 text-sm">
              <li>Contenuti digitali forniti mediante un supporto non materiale</li>
              <li>Se la fornitura è iniziata con il consenso espresso del consumatore</li>
              <li>Con la rinuncia del consumatore al diritto di recesso</li>
            </ul>
          </div>

          <h3 className="text-xl font-medium mb-3">6.2 Consenso Espresso</h3>
          <p className="mb-4">
            Effettuando l'acquisto, dichiari espressamente di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Essere consapevole che i contenuti digitali saranno forniti immediatamente</li>
            <li>Acconsentire all'inizio immediato della fornitura</li>
            <li>Rinunciare al diritto di recesso per i contenuti digitali</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">6.3 Eccezioni</h3>
          <p className="mb-4">
            Il diritto di recesso rimane valido per 14 giorni solo se:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Non hai ancora avuto accesso ai contenuti digitali</li>
            <li>Si verifica un errore tecnico che impedisce l'accesso</li>
            <li>I contenuti sono sostanzialmente diversi da quanto descritto</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Garanzie e Responsabilità</h2>
          
          <h3 className="text-xl font-medium mb-3">7.1 Garanzia sui Contenuti</h3>
          <p className="mb-4">
            Garantiamo che i contenuti venduti:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Corrispondono alle descrizioni fornite</li>
            <li>Sono tecnicamente funzionanti e accessibili</li>
            <li>Includono tutti i materiali specificati nella descrizione</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">7.2 Limitazioni di Responsabilità</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm mb-2">
              <strong>Importante per la Sicurezza:</strong> I contenuti sono forniti esclusivamente 
              a scopo informativo. L'utente è l'unico responsabile per:
            </p>
            <ul className="list-disc pl-6 text-sm">
              <li>Verifica dell'accuratezza delle informazioni</li>
              <li>Valutazione dei rischi e delle proprie capacità</li>
              <li>Rispetto del codice della strada e normative locali</li>
              <li>Utilizzo di adeguate misure di sicurezza</li>
              <li>Aggiornamenti su chiusure strade o modifiche percorsi</li>
            </ul>
          </div>

          <h3 className="text-xl font-medium mb-3">7.3 Esclusioni</h3>
          <p className="mb-4">
            Non siamo responsabili per:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Danni derivanti dall'uso delle tracce GPS</li>
            <li>Incidenti o inconvenienti durante i viaggi</li>
            <li>Variazioni nelle condizioni stradali o meteorologiche</li>
            <li>Chiusure temporanee di strade o attrazioni</li>
            <li>Problemi con dispositivi GPS di terze parti</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Rimborsi e Reclami</h2>
          
          <h3 className="text-xl font-medium mb-3">8.1 Rimborsi Eccezionali</h3>
          <p className="mb-4">
            Rimborsi possono essere concessi solo in caso di:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Impossibilità tecnica di accedere ai contenuti acquistati</li>
            <li>Contenuti sostanzialmente diversi dalla descrizione</li>
            <li>Doppio addebito per errore del sistema</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">8.2 Procedura di Reclamo</h3>
          <p className="mb-4">
            Per richiedere un rimborso o presentare reclamo:
          </p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Contatta il supporto a <strong>support@rideatlas.com</strong></li>
            <li>Fornisci numero d'ordine e descrizione del problema</li>
            <li>Riceverai risposta entro 48 ore lavorative</li>
            <li>I rimborsi saranno processati entro 14 giorni dalla risoluzione</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Proprietà Intellettuale e Licenza d'Uso</h2>
          
          <h3 className="text-xl font-medium mb-3">9.1 Licenza Personale</h3>
          <p className="mb-4">
            Acquistando un viaggio, ricevi una <strong>licenza personale, non esclusiva e non trasferibile</strong> per:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Utilizzare le tracce GPS per i tuoi viaggi personali</li>
            <li>Scaricare e conservare i contenuti sui tuoi dispositivi</li>
            <li>Stampare le informazioni per uso personale</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">9.2 Restrizioni d'Uso</h3>
          <p className="mb-4">
            È <strong>espressamente vietato</strong>:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Rivendere, distribuire o condividere i contenuti acquistati</li>
            <li>Utilizzare i contenuti per scopi commerciali</li>
            <li>Modificare o creare opere derivative</li>
            <li>Rimuovere copyright o marchi</li>
            <li>Caricare i contenuti su altre piattaforme</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Account e Registrazione</h2>
          
          <h3 className="text-xl font-medium mb-3">10.1 Requisiti per l'Acquisto</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Devi avere almeno 18 anni per effettuare acquisti</li>
            <li>Devi fornire informazioni di fatturazione accurate</li>
            <li>È necessario un account registrato per accedere agli acquisti</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">10.2 Accesso agli Acquisti</h3>
          <p className="mb-4">
            Gli acquisti sono collegati al tuo account e rimarranno accessibili fintanto che:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Il tuo account rimane attivo</li>
            <li>Non violi questi Termini di Servizio</li>
            <li>RideAtlas continua ad operare</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Informazioni Obbligatorie per E-commerce</h2>
          
          <h3 className="text-xl font-medium mb-3">11.1 Dati dell'Azienda</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Ragione Sociale:</strong> [Da completare con dati reali]<br/>
              <strong>Partita IVA:</strong> [Da completare]<br/>
              <strong>Sede Legale:</strong> [Da completare]<br/>
              <strong>PEC:</strong> [Da completare]<br/>
              <strong>Telefono:</strong> [Da completare]<br/>
              <strong>Email:</strong> support@rideatlas.com
            </p>
          </div>

          <h3 className="text-xl font-medium mb-3">11.2 Informazioni Precontrattuali</h3>
          <p className="mb-4">
            Prima di ogni acquisto, riceverai informazioni complete su:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Caratteristiche del prodotto/servizio</li>
            <li>Prezzo totale (IVA inclusa)</li>
            <li>Modalità di pagamento e consegna</li>
            <li>Durata del contratto</li>
            <li>Diritti del consumatore</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Risoluzione delle Controversie</h2>
          
          <h3 className="text-xl font-medium mb-3">12.1 Mediazione</h3>
          <p className="mb-4">
            Prima di intraprendere azioni legali, ci impegniamo a tentare una risoluzione 
            amichevole tramite mediazione presso un organismo di mediazione accreditato.
          </p>

          <h3 className="text-xl font-medium mb-3">12.2 Risoluzione Online delle Controversie (ODR)</h3>
          <p className="mb-4">
            Per controversie relative ad acquisti online, puoi utilizzare la piattaforma europea ODR: 
            <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 hover:underline" target="_blank">
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>

          <h3 className="text-xl font-medium mb-3">12.3 Foro Competente</h3>
          <p className="mb-4">
            Per qualsiasi controversia, è competente il foro del luogo di residenza del consumatore 
            o della sede legale di RideAtlas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Modifiche ai Termini</h2>
          <p className="mb-4">
            Eventuali modifiche ai Termini saranno comunicate con almeno 30 giorni di preavviso 
            e non si applicheranno retroattivamente agli acquisti già effettuati.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contatti</h2>
          <p className="mb-4">
            Per domande sui Termini di Servizio o sugli acquisti:
          </p>
          <ul className="list-none pl-0">
            <li><strong>Supporto Clienti:</strong> support@rideatlas.com</li>
            <li><strong>Questioni Legali:</strong> legal@rideatlas.com</li>
            <li><strong>Privacy:</strong> <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a></li>
            <li><strong>Cookie:</strong> <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}