// src/app/api/trips/batch/template/route.ts
import { NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function GET() {
  try {
    
    
    const zip = new JSZip()
    
    // 1. Create viaggi.json with valid example data
    const viaggiJsonExample = {
      title: "Giro delle Dolomiti - Esempio",
      summary: "Un viaggio di esempio attraverso le meravigliose Dolomiti, perfetto per testare il sistema di caricamento batch.",
      destination: "Dolomiti, Trentino-Alto Adige",
      theme: "Montagna e natura",
      characteristics: [
        "Curve strette",
        "Bel paesaggio",
        "Interesse storico-culturale"
      ],
      recommended_seasons: [
        "Estate",
        "Autunno"
      ],
      tags: [
        "dolomiti",
        "montagna",
        "esempio"
      ],
      travelDate: "2024-07-15",
      stages: [
        {
          title: "Bolzano - Ortisei",
          description: "Prima tappa attraverso la Val Gardena con panorami mozzafiato.",
          routeType: "Strada statale",
          duration: "2 ore"
        },
        {
          title: "Ortisei - Cortina d'Ampezzo",
          description: "Seconda tappa verso la regina delle Dolomiti.",
          routeType: "Strada statale e provinciale",
          duration: "1.5 ore"
        }
      ]
    }
    
    zip.file('viaggi.json', JSON.stringify(viaggiJsonExample, null, 2))
    
    // 2. Create main GPX file (simple example)
    const mainGpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RideAtlas Template" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Giro delle Dolomiti - Traccia Principale</name>
    <desc>Traccia GPX di esempio per il template</desc>
  </metadata>
  <trk>
    <name>Giro delle Dolomiti</name>
    <trkseg>
      <trkpt lat="46.4983" lon="11.3548">
        <ele>262</ele>
        <name>Bolzano</name>
      </trkpt>
      <trkpt lat="46.5784" lon="11.6751">
        <ele>1236</ele>
        <name>Ortisei</name>
      </trkpt>
      <trkpt lat="46.5369" lon="12.1389">
        <ele>1224</ele>
        <name>Cortina d'Ampezzo</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`
    
    zip.file('main.gpx', mainGpxContent)
    
    // 3. Create media folder with placeholder
    const placeholderImageContent = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
    zip.file('media/hero-example.jpg', placeholderImageContent, { base64: true })
    zip.file('media/README.txt', `Questa cartella contiene le immagini principali del viaggio.
La prima immagine (in ordine alfabetico) diventerà automaticamente l'immagine hero.

Formati supportati:
- Immagini: JPG, PNG
- Video: MP4, MOV

Dimensione massima per file: 10MB`)
    
    // 4. Create stages folders
    const stage1GpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RideAtlas Template" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Tappa 1: Bolzano - Ortisei</name>
  </metadata>
  <trk>
    <name>Bolzano - Ortisei</name>
    <trkseg>
      <trkpt lat="46.4983" lon="11.3548">
        <ele>262</ele>
        <name>Partenza Bolzano</name>
      </trkpt>
      <trkpt lat="46.5784" lon="11.6751">
        <ele>1236</ele>
        <name>Arrivo Ortisei</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`
    
    const stage2GpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RideAtlas Template" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Tappa 2: Ortisei - Cortina d'Ampezzo</name>
  </metadata>
  <trk>
    <name>Ortisei - Cortina d'Ampezzo</name>
    <trkseg>
      <trkpt lat="46.5784" lon="11.6751">
        <ele>1236</ele>
        <name>Partenza Ortisei</name>
      </trkpt>
      <trkpt lat="46.5369" lon="12.1389">
        <ele>1224</ele>
        <name>Arrivo Cortina d'Ampezzo</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`
    
    // Stage 1
    zip.file('tappe/01-bolzano-ortisei/tappa.gpx', stage1GpxContent)
    zip.file('tappe/01-bolzano-ortisei/media/stage1-photo.jpg', placeholderImageContent, { base64: true })
    zip.file('tappe/01-bolzano-ortisei/media/README.txt', `Media per la Tappa 1: Bolzano - Ortisei
Inserisci qui le foto e i video relativi a questa specifica tappa.`)
    
    // Stage 2
    zip.file('tappe/02-ortisei-cortina/tappa.gpx', stage2GpxContent)
    zip.file('tappe/02-ortisei-cortina/media/stage2-photo.jpg', placeholderImageContent, { base64: true })
    zip.file('tappe/02-ortisei-cortina/media/README.txt', `Media per la Tappa 2: Ortisei - Cortina d'Ampezzo
Inserisci qui le foto e i video relativi a questa specifica tappa.`)
    
    // 5. Create general README
    const readmeContent = `# Template per Caricamento Batch - RideAtlas

Questo è un template di esempio per il caricamento batch dei viaggi su RideAtlas.

## Struttura del Template

### File Principali
- viaggi.json: Metadati del viaggio (OBBLIGATORIO)
- main.gpx: Traccia GPX principale (opzionale)

### Cartelle
- media/: Immagini e video principali del viaggio
- tappe/: Cartelle numerate per ogni tappa (01-, 02-, 03-, ...)

### Note Importanti

1. **Caratteristiche Valide**: Usa solo le caratteristiche consentite dal sistema:
   - Strade sterrate
   - Curve strette
   - Presenza pedaggi
   - Presenza traghetti
   - Autostrada
   - Bel paesaggio
   - Visita prolungata
   - Interesse gastronomico
   - Interesse storico-culturale

2. **Stagioni Consigliate**: Usa solo:
   - Primavera
   - Estate
   - Autunno
   - Inverno

3. **Cartelle Tappe**: Devono essere numerate con formato ##-nome
   Esempio: 01-bolzano-ortisei, 02-ortisei-cortina

4. **Formati Media Supportati**:
   - Immagini: JPG, PNG
   - Video: MP4, MOV
   - Dimensione massima ZIP: 100MB

## Come Usare Questo Template

1. Modifica il file viaggi.json con i tuoi dati
2. Sostituisci i file GPX con le tue tracce
3. Aggiungi le tue immagini nelle cartelle media/
4. Rinomina le cartelle tappe/ secondo le tue tappe
5. Comprimi tutto in un file ZIP
6. Carica il ZIP usando il sistema batch di RideAtlas

Buon viaggio! 🚗🏔️`
    
    zip.file('README.txt', readmeContent)
    
    // Generate ZIP
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    
    
    // Return ZIP as download
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="rideatlas-batch-template.zip"',
        'Content-Length': zipBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error generating template ZIP:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione del template' },
      { status: 500 }
    )
  }
}