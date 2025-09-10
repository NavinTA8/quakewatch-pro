'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  Globe
} from 'lucide-react'
import { useEarthquakeStore } from '@/stores/earthquake-store'
import { USGSApiClient } from '@/lib/usgs-api'
import { AlertSystem } from './alert-system'

interface DashboardHeaderProps {
  isConnected?: boolean
  isConnecting?: boolean
  connectionError?: string | null
  onRefresh?: () => void
  onReconnect?: () => void
}

export const DashboardHeader = ({ 
  isConnected = false, 
  isConnecting = false, 
  connectionError = null, 
  onRefresh,
  onReconnect 
}: DashboardHeaderProps) => {
  const { earthquakes, isLoading, lastUpdated, error } = useEarthquakeStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const significantEarthquakes = earthquakes.filter(eq => eq.properties.mag >= 5.0)
  const recentEarthquakes = earthquakes.filter(eq => 
    Date.now() - eq.properties.time < 24 * 60 * 60 * 1000
  )

  const getConnectionStatus = () => {
    if (error || connectionError) return { color: 'red', text: 'Error', icon: AlertTriangle }
    if (isConnecting) return { color: 'yellow', text: 'Connecting...', icon: RefreshCw }
    if (isConnected) return { color: 'green', text: 'Live', icon: Wifi }
    return { color: 'gray', text: 'Offline', icon: WifiOff }
  }

  const status = getConnectionStatus()
  const StatusIcon = status.icon

  return (
    <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              QuakeWatch Pro
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time earthquake monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AlertSystem />
          
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 text-${status.color}-500 ${isConnecting ? 'animate-spin' : ''}`} />
            <Badge 
              variant={status.color === 'green' ? 'default' : status.color === 'red' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {status.text}
            </Badge>
            {(connectionError || (!isConnected && !isConnecting)) && onReconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReconnect}
                className="h-6 px-2 text-xs"
                disabled={isConnecting}
              >
                Retry
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {earthquakes.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total earthquakes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {significantEarthquakes.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Significant (M5.0+)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {recentEarthquakes.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Last 24 hours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium text-purple-600">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {lastUpdated 
                    ? `Updated ${USGSApiClient.getTimeAgo(lastUpdated)}`
                    : 'Never updated'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(error || connectionError) && (
        <Card className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <span className="text-sm font-medium">
                    {error ? `Data Error: ${error}` : `Connection Error: ${connectionError}`}
                  </span>
                  {connectionError && (
                    <p className="text-xs mt-1 text-red-600 dark:text-red-500">
                      Real-time updates are unavailable. Using cached data.
                    </p>
                  )}
                </div>
              </div>
              {connectionError && onReconnect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReconnect}
                  disabled={isConnecting}
                  className="gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isConnecting ? 'animate-spin' : ''}`} />
                  Retry Connection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}