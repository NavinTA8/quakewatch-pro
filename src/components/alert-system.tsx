'use client'

import { useEffect, useState } from 'react'
import { useEarthquakeStore } from '@/stores/earthquake-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Bell, 
  BellRing, 
  X, 
  MapPin, 
  Clock,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { USGSApiClient } from '@/lib/usgs-api'
import { Earthquake } from '@/types/earthquake'

interface AlertSystemProps {
  className?: string
}

export const AlertSystem = ({ className = '' }: AlertSystemProps) => {
  const { alerts, earthquakes, addAlert, markAlertAsRead, clearAlerts } = useEarthquakeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [minMagnitudeAlert, setMinMagnitudeAlert] = useState(5.0)
  const [processedEarthquakeIds, setProcessedEarthquakeIds] = useState<Set<string>>(new Set())

  // Function to play notification sound using Web Audio API
  const playNotificationSound = () => {
    if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) {
      return
    }

    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
      const audioContext = new AudioContext()
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Set frequency for a notification beep
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800 Hz tone
      oscillator.type = 'sine'
      
      // Set volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      // Play the sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      // Clean up
      setTimeout(() => {
        audioContext.close()
      }, 1000)
    } catch {
      console.log('Could not play notification sound')
    }
  }

  const unreadAlerts = alerts.filter(alert => !alert.read)

  // Check for truly new earthquakes (by ID) and create alerts
  useEffect(() => {
    // Skip if no earthquakes or initial load
    if (earthquakes.length === 0) return
    
    // Find genuinely new earthquakes that haven't been processed
    const newEarthquakes = earthquakes.filter(earthquake => 
      !processedEarthquakeIds.has(earthquake.id)
    )
    
    if (newEarthquakes.length > 0) {
      console.log(`Processing ${newEarthquakes.length} new earthquakes for alerts`)
      
      // Update processed IDs first
      setProcessedEarthquakeIds(prev => {
        const newSet = new Set(prev)
        earthquakes.forEach(eq => newSet.add(eq.id))
        return newSet
      })
      
      // Only process significant new earthquakes for alerts
      newEarthquakes.forEach(earthquake => {
        const { mag, alert, time } = earthquake.properties
        
        // Only alert for recent earthquakes (within last 24 hours) to avoid old data alerts
        const isRecent = (Date.now() - time) < (24 * 60 * 60 * 1000)
        
        // Create alert for significant earthquakes
        if (isRecent && (mag >= minMagnitudeAlert || alert === 'red' || alert === 'orange')) {
          console.log(`New significant earthquake alert: M${mag.toFixed(1)} - ${earthquake.properties.place}`)
          
          addAlert(earthquake)
          
          // Play notification sound if enabled
          if (soundEnabled) {
            try {
              playNotificationSound()
            } catch (error) {
              console.log('Audio not supported')
            }
          }
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Earthquake Alert: M${USGSApiClient.formatMagnitude(mag)}`, {
              body: earthquake.properties.place,
              icon: '/icon.svg',
              tag: earthquake.id,
              requireInteraction: true
            })
          }
        }
      })
    }
  }, [earthquakes, addAlert, soundEnabled, minMagnitudeAlert, processedEarthquakeIds])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
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

  const getAlertPriority = (earthquake: Earthquake) => {
    const { mag, alert } = earthquake.properties
    if (alert === 'red' || mag >= 7.0) return 'high'
    if (alert === 'orange' || mag >= 6.0) return 'medium'
    return 'low'
  }

  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId)
  }

  const sortedAlerts = [...alerts].sort((a, b) => {
    // Sort by read status first (unread first), then by timestamp (newest first)
    if (a.read !== b.read) {
      return a.read ? 1 : -1
    }
    return b.timestamp - a.timestamp
  })

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="relative p-2" size="sm">
            {unreadAlerts.length > 0 ? (
              <BellRing className="h-5 w-5 text-orange-500" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadAlerts.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs flex items-center justify-center"
              >
                {unreadAlerts.length > 99 ? '99+' : unreadAlerts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Earthquake Alerts
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="h-6 w-6 p-0"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                  </Button>
                  {alerts.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAlerts}
                      className="h-6 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts</p>
                  <p className="text-xs mt-1">
                    You&apos;ll be notified of significant earthquakes (M{minMagnitudeAlert}+)
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-1 p-2">
                    {sortedAlerts.map((alert) => {
                      const { earthquake } = alert
                      const { mag, place, time, alert: alertLevel } = earthquake.properties
                      const priority = getAlertPriority(earthquake)
                      
                      return (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border transition-all ${
                            alert.read 
                              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                              : 'bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-sm ${
                                  priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                  priority === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                                  'text-blue-600 dark:text-blue-400'
                                }`}>
                                  M{USGSApiClient.formatMagnitude(mag)}
                                </span>
                                {alertLevel && (
                                  <Badge variant={getAlertBadgeVariant(alertLevel)} className="text-xs">
                                    {alertLevel.toUpperCase()}
                                  </Badge>
                                )}
                                {!alert.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {place}
                              </p>
                              
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {USGSApiClient.getTimeAgo(time)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {earthquake.geometry.coordinates[2].toFixed(0)}km deep
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
              
              {/* Alert Settings */}
              <div className="border-t p-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Alert threshold: M{minMagnitudeAlert}+
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs flex items-center gap-1"
                    onClick={() => {
                      const newThreshold = minMagnitudeAlert === 5.0 ? 4.0 : 
                                         minMagnitudeAlert === 4.0 ? 6.0 : 5.0
                      setMinMagnitudeAlert(newThreshold)
                    }}
                  >
                    <Settings className="h-3 w-3" />
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}