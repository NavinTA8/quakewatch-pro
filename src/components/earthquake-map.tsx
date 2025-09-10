'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Earthquake } from '@/types/earthquake'
import { USGSApiClient } from '@/lib/usgs-api'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface EarthquakeMapProps {
  earthquakes: Earthquake[]
  selectedEarthquake?: Earthquake | null
  onEarthquakeSelect?: (earthquake: Earthquake) => void
  className?: string
}

const EarthquakeMapComponent = ({
  earthquakes,
  selectedEarthquake,
  onEarthquakeSelect,
  className = ''
}: EarthquakeMapProps) => {
  const [leafletComponents, setLeafletComponents] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return
      
      try {
        // Dynamically import Leaflet components and CSS
        const [leaflet, leafletCore] = await Promise.all([
          import('react-leaflet'),
          import('leaflet')
        ])
        
        // Dynamically load CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Fix for default markers
        delete (leafletCore.Icon.Default.prototype as any)._getIconUrl
        leafletCore.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        setLeafletComponents({
          MapContainer: leaflet.MapContainer,
          TileLayer: leaflet.TileLayer,
          CircleMarker: leaflet.CircleMarker,
          Popup: leaflet.Popup,
          useMap: leaflet.useMap
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  const getAlertBadgeVariant = (alert: string | null) => {
    switch (alert) {
      case 'red': return 'destructive'
      case 'orange': return 'destructive'
      case 'yellow': return 'secondary'
      case 'green': return 'default'
      default: return 'outline'
    }
  }

  // MapController component
  const MapController = ({ selectedEarthquake }: { selectedEarthquake?: Earthquake | null }) => {
    const map = leafletComponents?.useMap()
    
    useEffect(() => {
      if (selectedEarthquake && map) {
        const [lng, lat] = selectedEarthquake.geometry.coordinates
        map.flyTo([lat, lng], 8, { duration: 1 })
      }
    }, [selectedEarthquake, map])
    
    if (!leafletComponents) return null
    return null
  }

  if (isLoading || !leafletComponents) {
    return (
      <div className={`relative h-full w-full ${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = leafletComponents

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapContainer
        ref={mapRef}
        center={[20, 0]}
        zoom={2}
        className="h-full w-full z-0"
        worldCopyJump={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedEarthquake={selectedEarthquake} />
        
        {earthquakes.map((earthquake) => {
          const [lng, lat, depth] = earthquake.geometry.coordinates
          const { mag, place, time, alert } = earthquake.properties
          
          return (
            <CircleMarker
              key={earthquake.id}
              center={[lat, lng]}
              radius={USGSApiClient.getMagnitudeSize(mag) / 2}
              fillColor={USGSApiClient.getMagnitudeColor(mag)}
              color="#fff"
              weight={2}
              opacity={1}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => onEarthquakeSelect?.(earthquake)
              }}
            >
              <Popup>
                <Card className="border-0 shadow-none p-2 min-w-[250px]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        M{USGSApiClient.formatMagnitude(mag)}
                      </h3>
                      {alert && (
                        <Badge variant={getAlertBadgeVariant(alert)} className="text-xs">
                          {alert.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {place}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Depth:</span><br />
                        {USGSApiClient.formatDepth(depth)}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span><br />
                        {USGSApiClient.getTimeAgo(time)}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Coordinates:</span><br />
                      {lat.toFixed(4)}°N, {lng.toFixed(4)}°W
                    </div>
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

// Dynamic import to avoid SSR issues with Leaflet
const EarthquakeMap = dynamic(() => Promise.resolve(EarthquakeMapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  )
})

export { EarthquakeMap }