# Sistema Unificato per Mappe GPX

Il nuovo sistema di mappe GPX migliora drasticamente la riutilizzabilità e manutenibilità dei componenti mappa in RideAtlas.

## 🚀 Componenti Principali

### 1. **UnifiedGPXMapViewer** - Componente Base
Il componente fondamentale che sostituisce i precedenti `GPXMapViewer`, `GPXMapModal`, etc.

```tsx
import { UnifiedGPXMapViewer } from '@/components/maps'

<UnifiedGPXMapViewer
  gpxData={points}
  routes={routes}
  waypoints={waypoints}
  title="Mappa del Percorso"
  showControls={true}
  enableFullscreen={true}
  enableDownload={true}
  showInfoFooter={true}
  onDownload={handleDownload}
/>
```

### 2. **SimpleMapViewer** - Per Visualizzazione Inline
Ideale per pagine di visualizzazione viaggi:

```tsx
import { SimpleMapViewer } from '@/components/maps'

<SimpleMapViewer
  gpxData={gpxData}
  routes={routes}
  waypoints={waypoints}
  title="Mappa del Percorso - Viaggio XYZ"
  height="h-96"
  showInfoFooter={true}
/>
```

### 3. **InteractiveMapModal** - Per Modal Avanzati
Perfetto per form di modifica/creazione:

```tsx
import { InteractiveMapModal } from '@/components/maps'

<InteractiveMapModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  gpxData={gpxData}
  routes={routes}
  waypoints={waypoints}
  tripName="Viaggio XYZ"
  onDownloadGpx={handleDownload}
/>
```

### 4. **AutoLoadMapViewer** - Caricamento Automatico
Per mappe che caricano dati da URL:

```tsx
import { AutoLoadMapViewer } from '@/components/maps'

<AutoLoadMapViewer
  gpxUrl={trip.gpxFile.url}
  tripTitle={trip.title}
  onDataLoaded={() => console.log('Dati caricati!')}
  onError={(error) => console.error(error)}
/>
```

## 🛠️ Hook Migliorato

### useGPXMap con Opzioni Avanzate

```tsx
import { useGPXMap } from '@/components/maps'

const { 
  gpxData, 
  routes, 
  waypoints, 
  isLoading, 
  error, 
  metadata,
  loadGPXFromUrl,
  loadGPXFromFile,
  clearData,
  retry 
} = useGPXMap({
  onDataLoaded: (data) => {
    console.log(`Caricati ${data.points.length} punti`)
  },
  onError: (error) => {
    showErrorToast(error)
  }
})
```

## 📦 Tipi Centralizzati

Tutti i tipi GPX sono ora centralizzati in `@/types/gpx`:

```tsx
import { GPXPoint, GPXWaypoint, GPXRoute, GPXData, MapConfig } from '@/types/gpx'
```

## 🔄 Migrazione da Componenti Esistenti

### Da GPXAutoMapViewer (deprecato):
```tsx
// Prima (deprecato)
<GPXAutoMapViewer gpxUrl={url} tripTitle={title} />

// Dopo
<AutoLoadMapViewer gpxUrl={url} tripTitle={title} />
```

### Da GPXMapModal (deprecato):
```tsx
// Prima (deprecato)
<GPXMapModal 
  isOpen={open} 
  onClose={close} 
  gpxData={data} 
  tripName={name} 
/>

// Dopo
<InteractiveMapModal 
  isOpen={open} 
  onClose={close} 
  gpxData={data} 
  tripName={name} 
/>
```

## ✨ Vantaggi del Nuovo Sistema

1. **Tipi Unificati**: Eliminata la duplicazione di tipi
2. **Configurabilità**: Ogni componente è altamente configurabile
3. **Riutilizzabilità**: Un componente base per tutti i casi d'uso
4. **Backward Compatibility**: I componenti esistenti continuano a funzionare
5. **Hook Potenziato**: Supporto per file e URL, callback, retry, metadati
6. **Import Centralizzato**: Tutti i componenti da un unico import
7. **Documentazione**: Ogni componente è ben documentato con TypeScript

## 🎯 Esempi d'Uso Comuni

### Visualizzazione Viaggio (pagina `/trips/[slug]`)
```tsx
<AutoLoadMapViewer
  gpxUrl={trip.gpxFile.url}
  tripTitle={trip.title}
  className="mt-6"
/>
```

### Form Modifica Viaggio
```tsx
const [isMapModalOpen, setIsMapModalOpen] = useState(false)

<InteractiveMapModal
  isOpen={isMapModalOpen}
  onClose={() => setIsMapModalOpen(false)}
  gpxData={gpxData}
  tripName={formData.title}
  onDownloadGpx={handleDownload}
/>
```

### Dashboard Amministratore
```tsx
<SimpleMapViewer
  gpxData={previewData}
  title="Anteprima Percorso"
  height="h-64"
  showInfoFooter={false}
/>
```
