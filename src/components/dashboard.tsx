'use client'

import { useEffect, useState } from 'react'
import { DashboardHeader } from './dashboard-header'
import { EarthquakeMap } from './earthquake-map'
import { EarthquakeList } from './earthquake-list'
import { EarthquakeFiltersComponent } from './earthquake-filters'
import { EmergencyAlertOverlay } from './emergency-alert-overlay'
import { ThailandLocationSelector } from './thailand-location-selector'
import { SafetyInstructions } from './safety-instructions'
import { EarlyWarningTest } from './early-warning-test'
import { useEarthquakeStore } from '@/stores/earthquake-store'
import { useWebSocket } from '@/hooks/use-websocket'
import { useEarlyWarning } from '@/hooks/use-early-warning'
import { useThailandLocation } from '@/components/thailand-location-selector'
import { WebSocketMessage } from '@/lib/websocket-server'
import { Earthquake } from '@/types/earthquake'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Map, List, Settings, Shield } from 'lucide-react'

export const Dashboard = () => {
  const [isWebSocketInitialized, setIsWebSocketInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const {
    earthquakes,
    filteredEarthquakes,
    selectedEarthquake,
    setSelectedEarthquake,
    setEarthquakes,
    fetchRecentEarthquakes
  } = useEarthquakeStore()

  // Thailand location for early warning system
  const { userLocation, updateLocation: setUserLocation } = useThailandLocation()

  // Early warning system
  const { 
    currentWarning, 
    isEmergencyActive, 
    dismissEmergency 
  } = useEarlyWarning({
    earthquakes,
    userLocation,
    onWarning: (warning) => {
      console.log('🚨 Early Warning Alert:', warning)
    }
  })

  // Check WebSocket server readiness
  useEffect(() => {
    const checkWebSocketReadiness = async () => {
      let attempts = 0
      const maxAttempts = 10
      const checkInterval = 1000
      
      const check = async () => {
        try {
          const response = await fetch('/api/health')
          const health = await response.json()
          
          if (health.services?.websocket) {
            console.log('✅ WebSocket server is ready')
            setIsWebSocketInitialized(true)
            return
          }
        } catch {
          console.log('Waiting for WebSocket server...')
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, checkInterval)
        } else {
          console.log('⚠️ WebSocket server not ready after 10 attempts, proceeding anyway')
          setIsWebSocketInitialized(true)
        }
      }
      
      // Start checking after a brief delay
      setTimeout(check, 1000)
    }
    checkWebSocketReadiness()
  }, [])

  // WebSocket connection - only connect when server is ready
  const { isConnected, isConnecting, error: wsError, reconnect } = useWebSocket({
    url: isWebSocketInitialized ? 'ws://localhost:8080' : '', // Empty URL prevents connection
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'initial-data' || message.type === 'earthquake-update') {
        const earthquakeData = message.type === 'initial-data' 
          ? message.data as Earthquake[]
          : (message.data as { all: Earthquake[] }).all
        setEarthquakes(earthquakeData)
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    }
  })

  // Initial data fetch
  useEffect(() => {
    fetchRecentEarthquakes()
  }, [fetchRecentEarthquakes])

  const handleRefresh = () => {
    fetchRecentEarthquakes()
  }

  const displayedEarthquakes = filteredEarthquakes.length > 0 ? filteredEarthquakes : earthquakes

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader 
        isConnected={isConnected && isWebSocketInitialized}
        isConnecting={isConnecting}
        connectionError={wsError}
        onRefresh={handleRefresh}
        onReconnect={reconnect}
      />

      <div className="h-[calc(100vh-200px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 py-2 border-b">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <Map className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="early-warning" className="gap-2">
                <Shield className="h-4 w-4" />
                Early Warning
                {currentWarning && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs animate-pulse">
                    !
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="h-[calc(100%-60px)] m-0">
            <div className="px-6 py-2 border-b">
              <EarthquakeFiltersComponent />
            </div>
            <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-80px)]">
              <ResizablePanel defaultSize={70} minSize={50}>
                <div className="h-full p-4">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        Earthquake Map
                        <Badge variant="secondary" className="ml-auto">
                          {displayedEarthquakes.length} earthquakes
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-[calc(100%-80px)]">
                      <EarthquakeMap
                        earthquakes={displayedEarthquakes}
                        selectedEarthquake={selectedEarthquake}
                        onEarthquakeSelect={setSelectedEarthquake}
                        className="h-full"
                      />
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={30} minSize={25}>
                <div className="h-full p-4 pl-0">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <List className="h-5 w-5" />
                        Recent Earthquakes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-80px)]">
                      <EarthquakeList
                        earthquakes={displayedEarthquakes.slice(0, 50)}
                        selectedEarthquake={selectedEarthquake}
                        onEarthquakeSelect={setSelectedEarthquake}
                        className="h-full"
                      />
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          <TabsContent value="list" className="h-[calc(100%-60px)] m-0">
            <div className="px-6 py-2 border-b">
              <EarthquakeFiltersComponent />
            </div>
            <div className="h-[calc(100%-80px)] p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      All Earthquakes
                    </span>
                    <Badge variant="secondary">
                      {displayedEarthquakes.length} total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-80px)]">
                  <EarthquakeList
                    earthquakes={displayedEarthquakes}
                    selectedEarthquake={selectedEarthquake}
                    onEarthquakeSelect={setSelectedEarthquake}
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="early-warning" className="h-[calc(100%-60px)] m-0">
            <div className="h-full p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Location Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Thailand Regional Early Warning System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Select your location in Thailand to receive earthquake early warnings with estimated arrival times for seismic waves.
                      </p>
                      <ThailandLocationSelector 
                        onLocationChange={setUserLocation}
                        initialLocation={userLocation}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Early Warning Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentWarning ? (
                        <div className="p-4 border rounded-lg bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                            <Shield className="h-5 w-5" />
                            Active Warning
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <p><strong>Earthquake:</strong> M{currentWarning.earthquake.magnitude} - {currentWarning.earthquake.location}</p>
                            <p><strong>Distance:</strong> {currentWarning.distance}km from your location</p>
                            <p><strong>Threat Level:</strong> {currentWarning.threatLevel.toUpperCase()}</p>
                            {currentWarning.timeToS > 0 && (
                              <p><strong>S-Wave Arrival:</strong> {currentWarning.timeToS}s</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                            <Shield className="h-5 w-5" />
                            No Active Warnings
                          </div>
                          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            System is monitoring for regional earthquake threats
                          </p>
                        </div>
                      )}
                      
                      {userLocation && (
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Your Location:</strong> {userLocation.name}</p>
                          <p><strong>Coordinates:</strong> {userLocation.lat}°N, {userLocation.lng}°E</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p>
                        This early warning system monitors earthquake data from the USGS and calculates estimated arrival times for seismic waves at your location in Thailand.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold">P-Waves (Primary)</h4>
                          <p className="text-muted-foreground">Fast waves (6 km/s) that arrive first but cause less damage</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">S-Waves (Secondary)</h4>
                          <p className="text-muted-foreground">Slower waves (3.5 km/s) that cause the strongest shaking</p>
                        </div>
                      </div>
                      <p className="text-amber-600 dark:text-amber-400">
                        <strong>Remember:</strong> When you receive a warning, immediately DROP, COVER, and HOLD ON.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Comprehensive Safety Instructions */}
                <SafetyInstructions />

                {/* Early Warning System Testing */}
                <EarlyWarningTest />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {wsError && (
        <div className="fixed bottom-4 right-4">
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Real-time updates unavailable</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Alert Overlay */}
      {isEmergencyActive && currentWarning && (
        <EmergencyAlertOverlay
          warning={currentWarning}
          onDismiss={dismissEmergency}
        />
      )}
    </div>
  )
}