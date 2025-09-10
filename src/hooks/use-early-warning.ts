'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Earthquake } from '@/types/earthquake'
import { 
  calculateEarlyWarning, 
  isThailandThreat, 
  EarlyWarningData,
  WARNING_THRESHOLDS 
} from '@/lib/early-warning'

interface UseEarlyWarningOptions {
  userLocation: { lat: number; lng: number; name: string }
  onWarningTriggered?: (warning: EarlyWarningData) => void
  onCriticalAlert?: (warning: EarlyWarningData) => void
  enabled?: boolean
}

interface EarlyWarningState {
  activeWarnings: EarlyWarningData[]
  lastProcessedEarthquakes: Set<string>
  warningHistory: EarlyWarningData[]
  isMonitoring: boolean
}

export const useEarlyWarning = ({
  userLocation,
  onWarningTriggered,
  onCriticalAlert,
  enabled = true
}: UseEarlyWarningOptions) => {
  const [state, setState] = useState<EarlyWarningState>({
    activeWarnings: [],
    lastProcessedEarthquakes: new Set(),
    warningHistory: [],
    isMonitoring: false
  })

  const processedEarthquakesRef = useRef<Set<string>>(new Set())
  const warningTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Process new earthquakes for early warning
  const processEarthquakes = useCallback((earthquakes: Earthquake[]) => {
    if (!enabled || !userLocation) return

    console.log(`🔍 Processing ${earthquakes.length} earthquakes for early warning...`)

    const newWarnings: EarlyWarningData[] = []

    earthquakes.forEach(earthquake => {
      const earthquakeId = earthquake.id

      // Skip if already processed
      if (processedEarthquakesRef.current.has(earthquakeId)) return

      // Check if this earthquake poses a threat to Thailand
      if (!isThailandThreat(earthquake)) return

      // Check if user location is available
      if (!userLocation) {
        console.log('⚠️ No user location available for early warning calculation')
        return
      }

      console.log(`🌍 Analyzing potential Thailand threat: ${earthquake.properties.place}`)

      // Calculate early warning data
      const warningData = calculateEarlyWarning(
        earthquake,
        userLocation.lat,
        userLocation.lng
      )

      console.log(`⚠️  Warning data for ${earthquake.properties.place}:`, {
        distance: warningData.distanceKm.toFixed(1) + 'km',
        magnitude: earthquake.properties.mag,
        warningTime: warningData.warningTimeSeconds + 's',
        threatLevel: warningData.threatLevel,
        isValid: warningData.isWarningValid
      })

      // Only process valid warnings
      if (warningData.isWarningValid) {
        newWarnings.push(warningData)
        processedEarthquakesRef.current.add(earthquakeId)

        // Set timeout to remove warning after it expires
        const timeout = setTimeout(() => {
          setState(prev => ({
            ...prev,
            activeWarnings: prev.activeWarnings.filter(w => w.earthquake.id !== earthquakeId)
          }))
          warningTimeoutsRef.current.delete(earthquakeId)
        }, (warningData.warningTimeSeconds + 60) * 1000) // Keep for 1 minute after expected arrival

        warningTimeoutsRef.current.set(earthquakeId, timeout)

        // Trigger callbacks
        onWarningTriggered?.(warningData)
        
        if (warningData.threatLevel === 'CRITICAL' || warningData.threatLevel === 'HIGH') {
          onCriticalAlert?.(warningData)
        }

        console.log(`🚨 Early warning triggered:`, {
          location: earthquake.properties.place,
          magnitude: earthquake.properties.mag,
          distance: warningData.distanceKm.toFixed(1) + 'km',
          warningTime: warningData.warningTimeSeconds + 's',
          threatLevel: warningData.threatLevel
        })
      }
    })

    // Update state with new warnings
    if (newWarnings.length > 0) {
      setState(prev => ({
        ...prev,
        activeWarnings: [...prev.activeWarnings, ...newWarnings],
        warningHistory: [...prev.warningHistory, ...newWarnings].slice(-50), // Keep last 50 warnings
        lastProcessedEarthquakes: new Set([
          ...prev.lastProcessedEarthquakes,
          ...newWarnings.map(w => w.earthquake.id)
        ])
      }))

      // Browser notification for critical warnings
      newWarnings
        .filter(w => w.threatLevel === 'CRITICAL' || w.threatLevel === 'HIGH')
        .forEach(warning => {
          requestNotificationPermission()
          showBrowserNotification(warning)
        })
    }
  }, [userLocation, enabled, onWarningTriggered, onCriticalAlert])

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  // Enhanced browser notification with visual and audio cues
  const showBrowserNotification = (warning: EarlyWarningData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const magnitude = warning.earthquake.properties.mag?.toFixed(1) || 'Unknown'
      const location = warning.earthquake.properties.place
      const threatZoneText = warning.threatZone ? ` from ${warning.threatZone}` : ''
      
      // Create enhanced notification based on threat level
      const getNotificationConfig = () => {
        switch (warning.threatLevel) {
          case 'CRITICAL':
            return {
              title: `🚨 CRITICAL EARTHQUAKE ALERT - M${magnitude}`,
              body: `IMMEDIATE DANGER${threatZoneText}\n📍 ${location}\n⏰ S-waves arrive in ${warning.warningTimeSeconds}s\n🛡️ ${warning.actionRequired}`,
              requireInteraction: true,
              silent: false
            }
          case 'HIGH':
            return {
              title: `⚠️ HIGH EARTHQUAKE ALERT - M${magnitude}`,
              body: `Significant threat${threatZoneText}\n📍 ${location}\n⏰ Shaking in ${warning.warningTimeSeconds}s\n🛡️ ${warning.actionRequired}`,
              requireInteraction: true,
              silent: false
            }
          case 'MODERATE':
            return {
              title: `📢 EARTHQUAKE WARNING - M${magnitude}`,
              body: `Moderate threat${threatZoneText}\n📍 ${location}\n⏰ Arrival in ${warning.warningTimeSeconds}s\n💡 ${warning.actionRequired}`,
              requireInteraction: false,
              silent: false
            }
          default:
            return {
              title: `📍 Earthquake Alert - M${magnitude}`,
              body: `${location}${threatZoneText}\n⏰ ${warning.warningTimeSeconds}s until arrival\n💡 ${warning.actionRequired}`,
              requireInteraction: false,
              silent: true
            }
        }
      }
      
      const config = getNotificationConfig()
      
      const notification = new Notification(config.title, {
        body: config.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `earthquake-${warning.earthquake.id}`,
        requireInteraction: config.requireInteraction,
        silent: config.silent,
        timestamp: Date.now(),
        actions: [
          {
            action: 'dismiss',
            title: 'Dismiss'
          },
          {
            action: 'view',
            title: 'View Details'
          }
        ]
      })
      
      // Auto-dismiss notification after warning expires
      setTimeout(() => {
        notification.close()
      }, (warning.warningTimeSeconds + 30) * 1000)
      
      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }
  }

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }))
    console.log('🚨 Early warning system activated for', userLocation?.name || 'Unknown location')
  }, [userLocation?.name])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false, activeWarnings: [] }))
    
    // Clear all timeouts
    warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    warningTimeoutsRef.current.clear()
    
    console.log('⏹️ Early warning system deactivated')
  }, [])

  // Clear warning by ID
  const clearWarning = useCallback((earthquakeId: string) => {
    setState(prev => ({
      ...prev,
      activeWarnings: prev.activeWarnings.filter(w => w.earthquake.id !== earthquakeId)
    }))
    
    const timeout = warningTimeoutsRef.current.get(earthquakeId)
    if (timeout) {
      clearTimeout(timeout)
      warningTimeoutsRef.current.delete(earthquakeId)
    }
  }, [])

  // Get statistics
  const getStatistics = useCallback(() => {
    const { warningHistory } = state
    const last24Hours = warningHistory.filter(w => 
      Date.now() - new Date(w.earthquake.properties.time).getTime() < 24 * 60 * 60 * 1000
    )
    
    return {
      totalWarnings: warningHistory.length,
      warningsLast24h: last24Hours.length,
      criticalWarnings: warningHistory.filter(w => w.threatLevel === 'CRITICAL').length,
      averageWarningTime: warningHistory.length > 0 
        ? warningHistory.reduce((sum, w) => sum + w.warningTimeSeconds, 0) / warningHistory.length 
        : 0
    }
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      warningTimeoutsRef.current.clear()
    }
  }, [])

  // Auto-start monitoring when enabled
  useEffect(() => {
    if (enabled && userLocation) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
  }, [enabled, userLocation, startMonitoring, stopMonitoring])

  return {
    // State
    activeWarnings: state.activeWarnings,
    warningHistory: state.warningHistory,
    isMonitoring: state.isMonitoring,
    
    // Actions
    processEarthquakes,
    startMonitoring,
    stopMonitoring,
    clearWarning,
    getStatistics,
    
    // Utils
    requestNotificationPermission
  }
}

// Hook for managing early warning system status
export const useEarlyWarningStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    isEnabled: true,
    notificationsEnabled: false,
    soundEnabled: true,
    lastCheck: Date.now()
  })

  // Check notification permission
  useEffect(() => {
    const checkPermissions = () => {
      setSystemStatus(prev => ({
        ...prev,
        notificationsEnabled: 'Notification' in window && Notification.permission === 'granted',
        lastCheck: Date.now()
      }))
    }

    checkPermissions()
    const interval = setInterval(checkPermissions, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const toggleSystem = (enabled: boolean) => {
    setSystemStatus(prev => ({ ...prev, isEnabled: enabled }))
  }

  const toggleNotifications = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setSystemStatus(prev => ({ 
          ...prev, 
          notificationsEnabled: permission === 'granted' 
        }))
      }
    }
  }

  const toggleSound = (enabled: boolean) => {
    setSystemStatus(prev => ({ ...prev, soundEnabled: enabled }))
  }

  return {
    systemStatus,
    toggleSystem,
    toggleNotifications,
    toggleSound
  }
}