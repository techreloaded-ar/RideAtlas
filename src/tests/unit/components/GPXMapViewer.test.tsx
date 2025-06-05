import React from 'react'
import { render } from '@testing-library/react'
import GPXMapViewer from '@/components/GPXMapViewer'

// Mock Leaflet per evitare errori nel test
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn()
    }
  },
  latLngBounds: jest.fn(() => ({
    isValid: () => true,
    getCenter: () => ({ lat: 45, lng: 7 })
  }))
}))

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: () => <div data-testid="polyline" />,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn()
  })
}))

describe('GPXMapViewer', () => {
  const mockGpxData = [
    { lat: 45.1, lng: 7.1, elevation: 100 },
    { lat: 45.2, lng: 7.2, elevation: 110 }
  ]

  const mockWaypoints = [
    { lat: 45.15, lng: 7.15, name: 'Punto di partenza', elevation: 105 },
    { lat: 45.25, lng: 7.25, name: 'Punto di arrivo' }
  ]

  it('renderizza la mappa con tracciato GPX', () => {
    const { getByTestId } = render(
      <GPXMapViewer gpxData={mockGpxData} />
    )

    expect(getByTestId('map-container')).toBeInTheDocument()
    expect(getByTestId('tile-layer')).toBeInTheDocument()
    expect(getByTestId('polyline')).toBeInTheDocument()
  })

  it('renderizza i waypoints quando forniti', () => {
    const { getAllByTestId } = render(
      <GPXMapViewer 
        gpxData={mockGpxData} 
        waypoints={mockWaypoints}
      />
    )

    const markers = getAllByTestId('marker')
    // Dovremmo avere 2 marker per i waypoints
    expect(markers).toHaveLength(2)
  })

  it('renderizza popup con informazioni waypoint', () => {
    const { getAllByTestId } = render(
      <GPXMapViewer 
        gpxData={mockGpxData} 
        waypoints={mockWaypoints}
      />
    )

    const popups = getAllByTestId('popup')
    expect(popups).toHaveLength(2)
    
    // Verifica che il primo popup contenga il nome del waypoint
    expect(popups[0]).toHaveTextContent('Punto di partenza')
  })

  it('gestisce waypoints senza nome', () => {
    const waypointsWithoutName = [
      { lat: 45.15, lng: 7.15, elevation: 105 }
    ]

    const { queryByTestId } = render(
      <GPXMapViewer 
        gpxData={mockGpxData} 
        waypoints={waypointsWithoutName}
      />
    )

    // Dovrebbe renderizzare il marker ma non il popup per waypoint senza nome
    expect(queryByTestId('marker')).toBeInTheDocument()
  })
})
