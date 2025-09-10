'use client'

import { Earthquake } from '@/types/earthquake'
import { USGSApiClient } from '@/lib/usgs-api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin, Clock } from 'lucide-react'

interface EarthquakeListProps {
  earthquakes: Earthquake[]
  selectedEarthquake?: Earthquake | null
  onEarthquakeSelect?: (earthquake: Earthquake) => void
  className?: string
}

export const EarthquakeList = ({
  earthquakes,
  selectedEarthquake,
  onEarthquakeSelect,
  className = ''
}: EarthquakeListProps) => {
  const getAlertBadgeVariant = (alert: string | null) => {
    switch (alert) {
      case 'red': return 'destructive'
      case 'orange': return 'destructive' 
      case 'yellow': return 'secondary'
      case 'green': return 'default'
      default: return 'outline'
    }
  }

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 7.0) return 'text-red-600 dark:text-red-400'
    if (magnitude >= 6.0) return 'text-orange-600 dark:text-orange-400'
    if (magnitude >= 5.0) return 'text-yellow-600 dark:text-yellow-400'
    if (magnitude >= 4.0) return 'text-green-600 dark:text-green-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  if (earthquakes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No earthquakes found</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-2 p-2">
        {earthquakes.map((earthquake) => {
          const { mag, place, time, alert, url } = earthquake.properties
          const [lng, lat, depth] = earthquake.geometry.coordinates
          const isSelected = selectedEarthquake?.id === earthquake.id

          return (
            <Card 
              key={earthquake.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => onEarthquakeSelect?.(earthquake)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getMagnitudeColor(mag)}`}>
                      M{USGSApiClient.formatMagnitude(mag)}
                    </span>
                    {alert && (
                      <Badge variant={getAlertBadgeVariant(alert)} className="text-xs">
                        {alert.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(url, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  {place}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{USGSApiClient.getTimeAgo(time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{USGSApiClient.formatDepth(depth)} deep</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {lat.toFixed(2)}°, {lng.toFixed(2)}°
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}